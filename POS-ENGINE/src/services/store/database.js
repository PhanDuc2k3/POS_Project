const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { startAutoSave } = require('../../shared/db');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'store.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Store info
  db.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL DEFAULT 'Cửa hàng của tôi',
      phone TEXT,
      address TEXT,
      logo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bank config
  db.run(`
    CREATE TABLE IF NOT EXISTS bank_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      bank_name TEXT,
      bank_bin TEXT,
      account_name TEXT,
      account_number TEXT,
      qr_provider TEXT DEFAULT 'VietQR',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // Receipt config
  db.run(`
    CREATE TABLE IF NOT EXISTS receipt_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      header TEXT,
      footer TEXT DEFAULT 'Xin cảm ơn quý khách',
      show_qr INTEGER DEFAULT 1,
      show_logo INTEGER DEFAULT 0,
      show_time INTEGER DEFAULT 1,
      show_txn_id INTEGER DEFAULT 1,
      show_store_info INTEGER DEFAULT 1,
      paper_width TEXT DEFAULT '58mm',
      blocks TEXT DEFAULT '["header","storeInfo","divider","orderInfo","divider","items","total","divider","footer"]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // Migration: Add blocks column if not exists (for existing databases)
  try {
    db.run(`ALTER TABLE receipt_configs ADD COLUMN blocks TEXT DEFAULT '["header","storeInfo","divider","orderInfo","divider","items","total","divider","footer"]'`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: Add bank BIN for real VietQR generation.
  try {
    db.run('ALTER TABLE bank_configs ADD COLUMN bank_bin TEXT');
  } catch (e) {
    // Column already exists, ignore
  }

  // Save lần đầu + bật auto-save
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
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
