const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../../shared/config');
const { startAutoSave } = require('../../shared/db');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'auth.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      avatar TEXT,
      security_question TEXT,
      security_answer_hash TEXT,
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Refresh tokens / sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      jti TEXT,
      ip_address TEXT,
      device_id TEXT,
      device_name TEXT,
      device_type TEXT,
      client_type TEXT DEFAULT 'portal',
      browser TEXT,
      os TEXT,
      screen_resolution TEXT,
      is_trusted INTEGER DEFAULT 0,
      expires_at DATETIME NOT NULL,
      last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Migration: add jti column for existing databases
  try {
    db.run(`ALTER TABLE refresh_tokens ADD COLUMN jti TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: classify sessions by client source (portal vs POS app)
  try {
    db.run(`ALTER TABLE refresh_tokens ADD COLUMN client_type TEXT DEFAULT 'portal'`);
  } catch (e) {
    // Column already exists
  }

  // Backfill legacy POS app sessions. Browser portal used generated DEV-* ids;
  // Electron/POS app uses the machine serial, so keep only real serials as POS devices.
  db.run(`
    UPDATE refresh_tokens
    SET client_type = 'pos_app',
        device_type = 'pos',
        browser = 'POS App'
    WHERE device_id IS NOT NULL
      AND device_id NOT LIKE 'DEV-%'
  `);

  // Login attempts (rate limiting)
  db.run(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      username TEXT,
      success INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Password reset tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      used INTEGER DEFAULT 0,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Audit log
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default admin
  const result = db.exec('SELECT COUNT(*) FROM users');
  const count = result[0]?.values[0]?.[0] || 0;
  if (count === 0) {
    const hash = bcrypt.hashSync('admin123', config.BCRYPT_ROUNDS);
    const securityAnswer = bcrypt.hashSync('bunbo', config.BCRYPT_ROUNDS);
    db.run(
      `INSERT INTO users (username, password_hash, display_name, email, role, security_question, security_answer_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin', hash, 'Admin', 'admin@pos.local', 'admin', 'Món ăn yêu thích của bạn là gì?', securityAnswer]
    );
    console.log('[Auth] Default admin created: admin / admin123');
    console.log('[Auth] Security question: "Món ăn yêu thích của bạn là gì?" → answer: "bunbo"');
  }

  saveDatabase();
  startAutoSave(db, DB_PATH);
  return db;
}

function saveDatabase() {
  const { flushNow } = require('../../shared/db');
  flushNow(db, DB_PATH);
}

function getDatabase() {
  return db;
}

module.exports = { initDatabase, getDatabase, saveDatabase };
