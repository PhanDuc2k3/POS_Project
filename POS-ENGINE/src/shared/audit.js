/**
 * Shared Audit Module
 *
 * Unified audit logging cho tất cả services.
 * Mỗi service gọi audit.init(myDb) để setup, rồi audit.log() cho mỗi action.
 *
 * Audit records được lưu vào DB của service gọi.
 * Nếu DB chưa sẵn sàng, records được buffer trong memory.
 *
 * Cách dùng:
 *   // Trong service index.js, sau khi init database:
 *   audit.init(getDatabase());
 *
 *   // Trong controller hoặc service:
 *   const audit = require('../../shared/audit');
 *   audit.log({ userId, action: 'product.created', resourceId, details: { name }, ip });
 *
 * Actions chuẩn:
 *   user.login | user.loginFailed | user.logout | user.logoutAll | user.passwordChanged
 *   product.created | product.updated | product.deleted
 *   category.created | category.updated | category.deleted
 *   topping.created | topping.updated | topping.deleted
 *   order.created | order.cancelled | order.refunded
 *   store.updated | store.receiptUpdated | store.bankUpdated
 *   device.registered | device.heartbeat | device.printResult
 */

const { markDirty } = require('./db');
const logger = require('./logger');

// In-memory buffer khi DB chưa init
const _buffer = [];
let _db = null;
let _ready = false;

/**
 * Initialize audit module with the service's database.
 * Call once per service after DB is ready.
 */
function init(db) {
  if (!db) return;
  _db = db;
  try {
    _db.run(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    _db.run(`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)`);
    _db.run(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)`);
    _db.run(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC)`);
    _ready = true;
    logger.info('Audit module initialized');

    // Flush any buffered records
    _flushBuffer();
  } catch (err) {
    logger.error('Audit init failed', { error: err.message });
  }
}

function _flushBuffer() {
  if (!_ready || !_db || _buffer.length === 0) return;
  const toFlush = _buffer.splice(0, _buffer.length);
  for (const record of toFlush) {
    _insert(record);
  }
  markDirty();
}

function _insert(record) {
  if (!_db) return;
  try {
    _db.run(
      `INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`,
      [
        record.userId || null,
        record.action || 'unknown',
        record.details ? JSON.stringify(record.details) : null,
        record.ip || null,
      ],
    );
  } catch (err) {
    logger.error('Audit insert failed', { error: err.message, action: record.action });
  }
}

/**
 * Log an audit event.
 *
 * @param {object} opts
 * @param {number|null} opts.userId
 * @param {string} opts.action       - dot-separated: 'product.created'
 * @param {object|string} [opts.details]
 * @param {string} [opts.ip]
 */
function log(opts) {
  const entry = {
    userId: opts.userId || null,
    action: opts.action || 'unknown',
    details: opts.details || null,
    ip: opts.ip || null,
  };

  if (_ready && _db) {
    _insert(entry);
    markDirty();
    logger.debug('Audit logged', { action: entry.action, userId: entry.userId });
  } else {
    // Buffer if not ready
    _buffer.push(entry);
    if (_buffer.length > 1000) {
      _buffer.shift();
      logger.warn('Audit buffer overflow, dropped oldest record');
    }
  }
}

/**
 * Query audit logs from the current service's DB.
 */
function query({ action, userId, limit = 50, offset = 0 }) {
  if (!_db) return { items: [], total: 0 };

  const conditions = [];
  const params = [];

  if (action) {
    conditions.push('action LIKE ?');
    params.push(`${action}%`);
  }
  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = _db.exec(`SELECT COUNT(*) FROM audit_log ${where}`, params);
  const total = countResult[0]?.values[0]?.[0] || 0;

  const result = _db.exec(
    `SELECT id, user_id, action, details, ip_address, created_at
     FROM audit_log ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  if (!result.length) return { items: [], total: 0 };

  const items = result[0].values.map((row) => ({
    id: row[0],
    userId: row[1],
    action: row[2],
    details: row[3] ? (() => { try { return JSON.parse(row[3]); } catch { return row[3]; } })() : null,
    ipAddress: row[4],
    createdAt: row[5],
  }));

  return { items, total };
}

module.exports = { init, log, query };
