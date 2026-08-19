/**
 * API Gateway
 *
 * Responsibilities:
 * - Single entry point cho Portal/POS clients (port 4000)
 * - Route requests tới các microservice (auth/store/transaction/product)
 * - JWT verification (forward user context tới services qua headers)
 * - CORS, request logging
 * - General rate-limit (per IP)
 * - Strict rate-limit cho login/forgot-password
 * - Device Agent management (POS Electron registration, heartbeat)
 * - Print job dispatch to registered devices
 * - Graceful shutdown
 *
 * Routes:
 *   /api/auth/*           → Auth Service (port 4001)
 *   /api/store/*         → Store Service (port 4002)
 *   /api/txn/*           → Transaction Service (port 4003)
 *   /api/product/*       → Product Service (port 4004)
 *   /api/print/*         → Print Service (port 4005)
 *   /api/realtime/status → Device + WS status
 *   /uploads/avatars/*   → Static (proxy to auth service)
 *   /internal/print-job  → Print Service → Device dispatch
 */

process.env.SERVICE_NAME = 'gateway';
process.env.LOG_DIR = require('path').join(__dirname, '..', '..', 'logs');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const config = require('../shared/config');
const logger = require('../shared/logger');
const { generalLimiter, strictLimiter } = require('../shared/rate-limit');
const { initWebSocket, getConnectedCount, getIO } = require('../shared/websocket');
const { gracefulShutdown } = require('../shared/graceful-shutdown');
const deviceRegistry = require('./device-registry');

const app = express();

// ─── HTTP Server (must be created before initWebSocket) ───────────────
const server = http.createServer(app);

// ─── CORS ────────────────────────────────────────────────────────────

const corsOrigins = [
  ...new Set([
    config.PORTAL_ORIGIN,
    config.ADMIN_APP_ORIGIN,
    ...config.ADMIN_APP_ORIGINS,
    ...config.PUBLIC_APP_ORIGINS,
  ]),
];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Body parser chỉ áp dụng cho non-proxied routes
app.use(express.json({ limit: '5mb' }));

// ─── Request logging ─────────────────────────────────────────────────

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
});

// ─── General rate-limit (áp dụng cho tất cả /api/*) ──────────────────

app.use('/api', generalLimiter);

// ─── Health ──────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    service: 'POS API Gateway',
    version: '1.0.0',
    services: {
      auth: config.AUTH_SERVICE_URL,
      store: config.STORE_SERVICE_URL,
      transaction: config.TRANSACTION_SERVICE_URL,
      product: config.PRODUCT_SERVICE_URL,
      print: config.PRINT_SERVICE_URL,
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', gateway: true });
});

// ─── JWT verification ────────────────────────────────────────────────

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET);
    req.headers['x-user-id'] = String(payload.id);
    req.headers['x-user-role'] = payload.role;
    req.headers['x-user-name'] = payload.username;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Forward helper: direct JSON forwarding avoids parsed-body proxy hangs ───

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.ip || req.connection?.remoteAddress || 'unknown';
}

function buildForwardHeaders(req, includeAuthContext = false) {
  const headers = {
    'Content-Type': req.headers['content-type'] || 'application/json',
    'X-Forwarded-For': getClientIP(req),
    'X-Real-IP': getClientIP(req),
  };

  if (req.headers['user-agent']) headers['User-Agent'] = req.headers['user-agent'];
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.headers['x-store-id']) headers['X-Store-Id'] = req.headers['x-store-id'];

  if (includeAuthContext) {
    headers['X-User-Id'] = req.headers['x-user-id'] || '';
    headers['X-User-Role'] = req.headers['x-user-role'] || '';
    headers['X-User-Name'] = req.headers['x-user-name'] || '';
  }

  return headers;
}

async function forwardJson(req, res, targetUrl, targetPath, { includeAuthContext = false } = {}) {
  try {
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const response = await fetch(`${targetUrl}${targetPath}`, {
      method: req.method,
      headers: buildForwardHeaders(req, includeAuthContext),
      ...(hasBody ? { body: JSON.stringify(req.body || {}) } : {}),
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    res.status(response.status).type(response.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    logger.error('Forward failed', {
      target: targetUrl,
      path: targetPath,
      method: req.method,
      error: err.message,
    });
    res.status(502).json({ error: 'Service unavailable' });
  }
}

// ─── Public auth endpoints (no JWT required, strict rate-limit) ────────

const loginLimiter = strictLimiter('login', 10, 15 * 60 * 1000);
const forgotLimiter = strictLimiter('forgot-password', 5, 15 * 60 * 1000);

async function forwardAuthPost(req, res, path) {
  return forwardJson(req, res, config.AUTH_SERVICE_URL, path);
}

app.post('/api/auth/login', loginLimiter, (req, res) => {
  forwardAuthPost(req, res, '/auth/login');
});

app.post('/api/auth/refresh', (req, res) => {
  forwardAuthPost(req, res, '/auth/refresh');
});

app.post('/api/auth/activate', (req, res) => {
  forwardAuthPost(req, res, '/auth/activate');
});

app.post('/api/auth/forgot-password/question', forgotLimiter, (req, res) => {
  forwardAuthPost(req, res, '/auth/forgot-password/question');
});

app.post('/api/auth/forgot-password/verify', forgotLimiter, (req, res) => {
  forwardAuthPost(req, res, '/auth/forgot-password/verify');
});

app.post('/api/auth/forgot-password/reset', forgotLimiter, (req, res) => {
  forwardAuthPost(req, res, '/auth/forgot-password/reset');
});

app.post('/api/payment-webhooks/sepay', async (req, res) => {
  try {
    const response = await fetch(`${config.TRANSACTION_SERVICE_URL}/txn/payment-webhooks/sepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        ...(req.headers['x-api-key'] ? { 'X-Api-Key': req.headers['x-api-key'] } : {}),
        ...(req.headers['x-sepay-api-key'] ? { 'X-Sepay-Api-Key': req.headers['x-sepay-api-key'] } : {}),
        ...(req.headers['x-sepay-signature'] ? { 'X-Sepay-Signature': req.headers['x-sepay-signature'] } : {}),
        ...(req.headers['x-signature'] ? { 'X-Signature': req.headers['x-signature'] } : {}),
        ...(req.headers['x-sepay-timestamp'] ? { 'X-Sepay-Timestamp': req.headers['x-sepay-timestamp'] } : {}),
      },
      body: JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    res.status(response.status).type(response.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    logger.error('SePay webhook forward failed', { error: err.message });
    res.status(502).json({ success: false, error: 'Webhook forward failed' });
  }
});

// ─── Protected routes (require JWT) ──────────────────────────────────

app.use('/api/public', (req, res) => {
  const path = req.path || '/';
  if (path === '/orders' || path.startsWith('/orders/')) {
    return forwardJson(req, res, config.PLATFORM_SERVICE_URL, `/public${req.url}`);
  }
  if (path.startsWith('/menu')) {
    return forwardJson(req, res, config.PRODUCT_SERVICE_URL, `/product/public/menu${req.url.replace('/menu', '')}`);
  }
  if (path.startsWith('/dining-sessions')) {
    return forwardJson(req, res, config.TRANSACTION_SERVICE_URL, `/txn/public${req.url}`);
  }
  return res.status(404).json({ error: 'Route not found' });
});

app.use('/api/customer', (req, res) => {
  return forwardJson(req, res, config.CUSTOMER_SERVICE_URL, `/customer${req.url}`);
});

app.use('/api/kitchen', (req, res) => {
  return forwardJson(req, res, config.KITCHEN_SERVICE_URL, `/kitchen${req.url}`);
});

app.get('/api/platform/trial-requests/me', verifyJwt, (req, res) => {
  return forwardJson(req, res, config.PLATFORM_SERVICE_URL, '/platform/trial-requests/me', { includeAuthContext: true });
});

app.post('/api/platform/trial-requests', verifyJwt, (req, res) => {
  return forwardJson(req, res, config.PLATFORM_SERVICE_URL, '/platform/trial-requests', { includeAuthContext: true });
});

app.use('/api/platform', verifyJwt, (req, res) => {
  if (req.headers['x-user-role'] !== 'platform_admin') {
    return res.status(403).json({ error: 'Platform admin required' });
  }
  return forwardJson(req, res, config.PLATFORM_SERVICE_URL, `/platform${req.url}`, { includeAuthContext: true });
});

app.use('/api/auth', verifyJwt, (req, res, next) => {
  forwardJson(req, res, config.AUTH_SERVICE_URL, '/auth' + req.url, { includeAuthContext: true });
});

app.use('/api/store', verifyJwt, (req, res, next) => {
  forwardJson(req, res, config.STORE_SERVICE_URL, '/store' + req.url, { includeAuthContext: true });
});

app.use('/api/txn', verifyJwt, (req, res, next) => {
  forwardJson(req, res, config.TRANSACTION_SERVICE_URL, '/txn' + req.url, { includeAuthContext: true });
});

app.use('/api/product', verifyJwt, (req, res, next) => {
  forwardJson(req, res, config.PRODUCT_SERVICE_URL, '/product' + req.url, { includeAuthContext: true });
});

app.use('/api/print', verifyJwt, (req, res, next) => {
  forwardJson(req, res, config.PRINT_SERVICE_URL, req.url, { includeAuthContext: true });
});

// ─── Avatar files ────────────────────────────────────────────────────

app.get('/uploads/avatars/*', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  logLevel: 'warn',
}));

// ─── Device & Realtime status ─────────────────────────────────────────

app.get('/api/realtime/status', (req, res) => {
  res.json({
    connectedDevices: getConnectedCount(),
    devices: deviceRegistry.getStats(),
  });
});

// ─── Internal service-to-service endpoints ────────────────────────────

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'pos-internal-token';

/**
 * POST /internal/print-job
 * Called by Print Service to dispatch a print job to a registered POS device.
 * Requires internal service token (prevents external access).
 */
app.post('/internal/print-job', (req, res) => {
  const token = req.headers['x-internal-token'];
  if (token !== INTERNAL_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { jobId, storeId, type, payload } = req.body || {};
  if (!jobId || !payload) {
    return res.status(400).json({ error: 'jobId and payload required' });
  }

  const io = getIO();
  if (!io) return res.status(503).json({ error: 'WebSocket not available' });

  // Find devices registered for this store
  const devices = deviceRegistry.getByStoreId(storeId);
  let delivered = false;

  if (devices.length === 0) {
    // No device registered for this store — try any online device (for dev)
    const allDevices = deviceRegistry.getAll();
    for (const device of allDevices) {
      if (device.socketId && (device.status === 'ONLINE' || device.status === 'PRINTING')) {
        io.to(device.socketId).emit('print:job', { jobId, storeId, type, payload });
        delivered = true;
        logger.info('Print job dispatched to device (fallback)', { jobId, serial: device.serial, storeId });
        break;
      }
    }
  } else {
    for (const device of devices) {
      if (device.socketId && device.status === 'ONLINE') {
        io.to(device.socketId).emit('print:job', { jobId, storeId, type, payload });
        deviceRegistry.update(device.serial, { status: 'PRINTING' });
        delivered = true;
        logger.info('Print job dispatched to device', { jobId, serial: device.serial, storeId });
        break;
      }
    }
  }

  if (!delivered) {
    logger.warn('No available device for print job', { jobId, storeId });
    return res.status(404).json({ error: 'No registered device available for this store' });
  }

  return res.json({ delivered: true });
});

// ─── 404 ─────────────────────────────────────────────────────────────

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Start ───────────────────────────────────────────────────────────

initWebSocket(server, { deviceRegistry, logger });

server.listen(config.GATEWAY_PORT, () => {
  logger.info('Gateway started', {
    port: config.GATEWAY_PORT,
    authService: config.AUTH_SERVICE_URL,
    storeService: config.STORE_SERVICE_URL,
    transactionService: config.TRANSACTION_SERVICE_URL,
    productService: config.PRODUCT_SERVICE_URL,
    printService: config.PRINT_SERVICE_URL,
    corsOrigin: corsOrigins,
  });
});

gracefulShutdown('Gateway', server, {
  closeWebSocket: true,
});
