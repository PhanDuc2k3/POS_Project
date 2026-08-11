/**
 * Shared Logger (Winston)
 *
 * Structured logging cho tất cả services.
 * - Console: human-readable (dev)
 * - File: JSON (production)
 * - Request ID propagation
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const SERVICE_NAME = process.env.SERVICE_NAME || 'pos-engine';
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs');
const NODE_ENV = process.env.NODE_ENV || 'development';

// Tạo thư mục logs nếu chưa có
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Console format: màu sắc + timestamp + service name
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${SERVICE_NAME}] ${level}: ${message}${metaStr}`;
  }),
);

// File format: JSON cho log aggregation
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: { service: SERVICE_NAME },
  transports: [
    // Console luôn luôn
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File info
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,   // 5MB
      maxFiles: 5,
    }),
    // File error riêng
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Silent mode cho test
if (process.env.LOG_SILENT === 'true') {
  logger.transports.forEach((t) => {
    t.silent = true;
  });
}

/**
 * Tạo child logger với thêm metadata cố định
 */
function child(meta) {
  return logger.child(meta);
}

module.exports = logger;
module.exports.child = child;
