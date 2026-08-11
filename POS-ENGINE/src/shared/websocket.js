/**
 * WebSocket Server (Socket.IO)
 * 
 * Chạy cùng Gateway HTTP server.
 * Khi Event Bus publish event → broadcast qua WebSocket tới tất cả connected clients.
 * 
 * Device Agent Events:
 *   - device:register       → POS Electron gửi thông tin thiết bị khi khởi động
 *   - device:heartbeat      → POS Electron gửi heartbeat định kỳ (30s)
 *   - device:printResult   → POS Electron báo kết quả in (SUCCESS / FAILED)
 *   - print:job             → Gateway gửi job in tới device
 * 
 * Channels (broadcast to all authenticated clients):
 *   - transaction:created    → Portal Dashboard + POS auto-refresh
 *   - transaction:cancelled  → Portal cập nhật trạng thái
 *   - transaction:refunded   → Portal cập nhật trạng thái
 *   - store:updated          → POS reload config
 *   - store:bankUpdated      → POS reload bank info
 *   - store:receiptUpdated   → POS reload receipt template
 *   - store:productCreated   → POS reload menu
 *   - store:productUpdated   → POS reload menu
 *   - dashboard:refresh      → Portal Dashboard auto-refresh
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const logger = require('./logger');

let io = null;
let deviceRegistry = null;
let appLogger = null;

/**
 * Initialize Socket.IO on an existing HTTP server.
 * @param {http.Server} httpServer
 * @param {{ deviceRegistry: object, logger: object }} options
 */
function initWebSocket(httpServer, options = {}) {
  deviceRegistry = options.deviceRegistry || null;
  appLogger = options.logger || logger;

  io = new Server(httpServer, {
    cors: {
      origin: config.PORTAL_ORIGIN,
      credentials: true,
    },
  });

  // ─── Authentication ────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, config.JWT_ACCESS_SECRET);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection + Device Events ────────────────────────────────────
  io.on('connection', (socket) => {
    appLogger.info('WebSocket client connected', {
      clientId: socket.id,
      username: socket.user.username,
      role: socket.user.role,
    });

    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    // ── Device registration (POS Electron calls on startup) ──────────
    socket.on('device:register', (data) => {
      const serial = data?.serial;
      if (!serial) return;

      // Join device room so we can send targeted events
      socket.join(`device:${serial}`);

      if (deviceRegistry) {
        deviceRegistry.register(serial, {
          socketId: socket.id,
          storeId: data.storeId || null,
          status: 'ONLINE',
          info: data.info || null,
          printerConnected: data.printerConnected || false,
        });
      }

      appLogger.info('Device registered', {
        serial,
        storeId: data.storeId,
        hostname: data.info?.hostname,
        clientId: socket.id,
      });

      // Confirm back to device
      socket.emit('device:registered', { serial, status: 'ONLINE' });
    });

    // ── Heartbeat (POS sends every 30s) ──────────────────────────────
    socket.on('device:heartbeat', (data) => {
      if (!deviceRegistry) return;

      // Find serial by socketId
      let serial = data?.serial;
      if (!serial) {
        serial = deviceRegistry.findBySocketId(socket.id);
      }
      if (!serial) return;

      deviceRegistry.update(serial, {
        status: data.status || 'ONLINE',
        printerConnected: data.printerConnected,
      });
    });

    // ── Print result callback (POS sends after printing) ─────────────
    socket.on('device:printResult', (data) => {
      const { jobId, status, error, serial } = data || {};
      appLogger.info('Device print result received', { jobId, status, error, serial });

      // Mark device back to ONLINE after printing
      if (deviceRegistry && serial) {
        deviceRegistry.update(serial, { status: 'ONLINE' });
      }

      // Forward to Print Service via HTTP POST (more reliable than nested WS)
      const http = require('http');
      const body = JSON.stringify({
        jobId,
        status,
        error,
        serial,
        completedAt: new Date().toISOString(),
      });

      const req = http.request(
        {
          hostname: 'localhost',
          port: config.PRINT_SERVICE_PORT,
          path: `/jobs/${jobId}/result`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'X-Gateway-Callback': 'true',
          },
        },
        (res) => {
          appLogger.debug('Print result forwarded to print service', {
            jobId,
            status: res.statusCode,
          });
        },
      );

      req.on('error', (e) => {
        appLogger.error('Failed to forward print result to print service', {
          jobId,
          error: e.message,
        });
      });

      req.write(body);
      req.end();
    });

    // ── Disconnect ──────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      appLogger.info('WebSocket client disconnected', {
        clientId: socket.id,
        username: socket.user.username,
        reason,
      });

      // Mark device offline if it was registered
      if (deviceRegistry) {
        const serial = deviceRegistry.markOffline(socket.id);
        if (serial) {
          appLogger.info('Device marked offline', { serial });
        }
      }
    });
  });

  appLogger.info('WebSocket server ready');
  return io;
}

/**
 * Broadcast event to all authenticated clients
 */
function broadcast(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Send event to a specific user
 */
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Get connected client count
 */
function getConnectedCount() {
  return io ? io.engine.clientsCount : 0;
}

function getIO() {
  return io;
}

module.exports = { initWebSocket, broadcast, emitToUser, getConnectedCount, getIO };

