const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { startAutoSave } = require('../../shared/db');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'transaction.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Orders (giao dịch)
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      order_number TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      final_total REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      status TEXT NOT NULL DEFAULT 'completed',
      note TEXT,
      source_app TEXT NOT NULL DEFAULT 'pos',
      service_mode TEXT NOT NULL DEFAULT 'simple',
      dining_session_id TEXT,
      table_code TEXT,
      device_id TEXT,
      device_name TEXT,
      cashier_id INTEGER,
      cashier_name TEXT,
      payment_code TEXT,
      payment_provider TEXT,
      payment_account_number TEXT,
      paid_at DATETIME,
      payment_reference TEXT,
      payment_raw TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Order items (chi tiết đơn hàng)
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      note TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  // Daily summaries (cache cho dashboard, tính sẵn mỗi ngày)
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      total_revenue REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_items INTEGER DEFAULT 0,
      avg_order_value REAL DEFAULT 0,
      payment_cash REAL DEFAULT 0,
      payment_transfer REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, date)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dining_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      session_code TEXT NOT NULL,
      table_code TEXT,
      guest_count INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'open',
      note TEXT,
      opened_by_id INTEGER,
      opened_by_name TEXT,
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, session_code)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payment_webhook_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      provider_event_id TEXT,
      reference_code TEXT,
      payment_code TEXT,
      transfer_amount REAL,
      account_number TEXT,
      transfer_type TEXT,
      status TEXT NOT NULL DEFAULT 'received',
      order_id INTEGER,
      error TEXT,
      raw_payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, provider_event_id)
    )
  `);

  addColumnIfMissing('orders', 'payment_code TEXT');
  addColumnIfMissing('orders', 'payment_provider TEXT');
  addColumnIfMissing('orders', 'payment_account_number TEXT');
  addColumnIfMissing('orders', 'paid_at DATETIME');
  addColumnIfMissing('orders', 'payment_reference TEXT');
  addColumnIfMissing('orders', 'payment_raw TEXT');
  addColumnIfMissing('orders', "source_app TEXT NOT NULL DEFAULT 'pos'");
  addColumnIfMissing('orders', "service_mode TEXT NOT NULL DEFAULT 'simple'");
  addColumnIfMissing('orders', 'dining_session_id TEXT');
  addColumnIfMissing('orders', 'table_code TEXT');

  addColumnIfMissing('dining_sessions', 'table_code TEXT');
  addColumnIfMissing('dining_sessions', 'guest_count INTEGER DEFAULT 1');
  addColumnIfMissing('dining_sessions', "status TEXT NOT NULL DEFAULT 'open'");
  addColumnIfMissing('dining_sessions', 'note TEXT');
  addColumnIfMissing('dining_sessions', 'opened_by_id INTEGER');
  addColumnIfMissing('dining_sessions', 'opened_by_name TEXT');
  addColumnIfMissing('dining_sessions', 'opened_at DATETIME');
  addColumnIfMissing('dining_sessions', 'closed_at DATETIME');

  saveDatabase();
  startAutoSave(db, DB_PATH);
  return db;
}

function addColumnIfMissing(table, columnDefinition) {
  try {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`);
  } catch (e) {
    // Column already exists, ignore.
  }
}

function saveDatabase() {
  const { flushNow } = require('../../shared/db');
  flushNow(db, DB_PATH);
}

function getDatabase() {
  return db;
}

module.exports = { initDatabase, getDatabase, saveDatabase };
