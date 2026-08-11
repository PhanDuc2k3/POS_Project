/**
 * Graceful Shutdown Handler
 *
 * Bắt SIGTERM / SIGINT (Ctrl+C):
 *  1. Dừng nhận request mới (server.close)
 *  2. Đợi request đang xử lý hoàn tất (timeout 10s)
 *  3. Flush database xuống disk (nếu có)
 *  4. Đóng WebSocket (nếu có)
 *  5. Exit với code 0
 *
 * Mỗi service gọi gracefulShutdown('Auth', server) ở cuối file index.js.
 */

const { stopAutoSave, flushNow } = require('./db');
const logger = require('./logger');

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_FORCE_MS = 3000;

function gracefulShutdown(serviceName, server, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    forceMs = DEFAULT_FORCE_MS,
    db,
    dbPath,
    closeWebSocket = false,
  } = options;

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) {
      logger.warn(`${serviceName} already shutting down, ignoring signal`, { signal });
      return;
    }
    shuttingDown = true;
    logger.info(`${serviceName} shutting down gracefully`, { signal });

    // Force-exit nếu shutdown quá lâu
    const forceTimer = setTimeout(() => {
      logger.error(`${serviceName} forced exit after ${forceMs}ms`);
      process.exit(1);
    }, timeoutMs + forceMs);
    if (forceTimer.unref) forceTimer.unref();

    try {
      // 1. Dừng nhận connection mới
      if (server && typeof server.close === 'function') {
        await new Promise((resolve) => {
          server.close((err) => {
            if (err) logger.error(`${serviceName} server close error`, { error: err.message });
            else logger.info(`${serviceName} HTTP server closed`);
            resolve();
          });

          // Timeout nếu có request treo
          setTimeout(() => {
            logger.warn(`${serviceName} HTTP close timeout, forcing`);
            resolve();
          }, timeoutMs).unref?.();
        });
      }

      // 2. Flush database
      if (db && dbPath) {
        logger.info(`${serviceName} flushing database`);
        const ok = flushNow(db, dbPath);
        if (ok) logger.info(`${serviceName} database flushed`);
      }

      // 3. Dừng auto-save
      stopAutoSave();

      // 4. Đóng WebSocket
      if (closeWebSocket) {
        try {
          const { getIO } = require('./websocket');
          const io = getIO?.();
          if (io) {
            io.close();
            logger.info(`${serviceName} WebSocket closed`);
          }
        } catch (e) {
          // websocket chưa init hoặc lỗi - bỏ qua
        }
      }

      // 5. Đóng Kafka
      try {
        const { disconnect } = require('./event-bus');
        await disconnect();
        logger.info(`${serviceName} event bus disconnected`);
      } catch (e) {
        // ignore
      }

      logger.info(`${serviceName} shutdown complete`);
      clearTimeout(forceTimer);
      process.exit(0);
    } catch (err) {
      logger.error(`${serviceName} shutdown error`, { error: err.message });
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch uncaught errors
  process.on('uncaughtException', (err) => {
    logger.error(`${serviceName} uncaught exception`, { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error(`${serviceName} unhandled rejection`, { reason: String(reason) });
  });
}

module.exports = { gracefulShutdown };