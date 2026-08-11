/**
 * Print Service Database (sql.js)
 *
 * Tables:
 *  - printers        : registered physical printers (USB)
 *  - print_templates : per-store ESC/POS template content
 *  - print_jobs      : queue + history of print jobs
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { startAutoSave } = require('../../shared/db');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', config.PRINT_DB_FILENAME);

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // ─── Printers ───────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'usb',
      interface_path TEXT,
      vendor_id INTEGER,
      product_id INTEGER,
      paper_width INTEGER DEFAULT 80,
      charset TEXT DEFAULT 'CP437',
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── Templates ──────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS print_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'receipt',
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      paper_width INTEGER DEFAULT 80,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── Jobs ────────────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      printer_id INTEGER,
      template_id INTEGER,
      type TEXT NOT NULL DEFAULT 'receipt',
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      next_retry_at DATETIME,
      error_message TEXT,
      triggered_by TEXT,
      triggered_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status, next_retry_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_print_jobs_store ON print_jobs(store_id)`);

  // ─── Seed default template (global, store_id=0) ──────────────────────
  const result = db.exec(`SELECT COUNT(*) as c FROM print_templates WHERE store_id = 0`);
  const count = result.length ? result[0].values[0][0] : 0;
  if (count === 0) {
    const defaultContent = fs.readFileSync(
      path.join(__dirname, 'templates', 'default-receipt.esj'),
      'utf8',
    );
    db.run(
      `INSERT INTO print_templates (store_id, type, name, content, paper_width, is_default)
       VALUES (0, 'receipt', 'Default Receipt', ?, 80, 1)`,
      [defaultContent],
    );
    console.log('[Print] Seeded default template (store_id=0)');
  }

  // Persist every 30s if dirty
  startAutoSave(db, DB_PATH);
}

function getDatabase() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { initDatabase, getDatabase, saveDatabase };
