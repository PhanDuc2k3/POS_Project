/**
 * Product Service - Database initialization
 * Uses sql.js (SQLite compiled to WebAssembly)
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { startAutoSave } = require('../../shared/db');
const { ensureEnhancedDemoMenu } = require('./seed-demo-menu');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'product.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Categories
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      category_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      description TEXT,
      is_available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Topping groups
  db.run(`
    CREATE TABLE IF NOT EXISTS topping_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_required INTEGER DEFAULT 0,
      max_select INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Toppings
  db.run(`
    CREATE TABLE IF NOT EXISTS toppings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (group_id) REFERENCES topping_groups(id)
    )
  `);

  // Product-topping group link (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS product_topping_groups (
      product_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      PRIMARY KEY (product_id, group_id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (group_id) REFERENCES topping_groups(id)
    )
  `);

  // Seed demo data if tables are empty
  seedDemoData();
  ensureEnhancedDemoMenu(db);

  saveDatabase();
  startAutoSave(db, DB_PATH);
  return db;
}

function seedDemoData() {
  if (!db) return;

  const catCount = db.exec('SELECT COUNT(*) FROM categories');
  if (catCount[0]?.values[0]?.[0] > 0) return; // Already has data

  const storeId = 1;

  // Categories
  db.run('INSERT INTO categories (store_id, name, sort_order) VALUES (?, ?, ?)', [storeId, '\u0110\u1ED3 \u0103n', 1]);
  db.run('INSERT INTO categories (store_id, name, sort_order) VALUES (?, ?, ?)', [storeId, '\u0110\u1ED3 u\u1ED1ng', 2]);

  // Products - category 1 (food)
  db.run('INSERT INTO products (store_id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, 1, 'B\u00FAn ri\u00EAu', 35000, 1]);
  db.run('INSERT INTO products (store_id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, 1, 'B\u00FAn b\u00F2', 37000, 2]);
  db.run('INSERT INTO products (store_id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, 1, 'B\u00FAn b\u00F2 \u0111\u1EB7c bi\u1EC7t', 50000, 3]);
  db.run('INSERT INTO products (store_id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, 1, 'Ph\u1EDF t\u00E1i', 45000, 4]);

  // Products - category 2 (drinks)
  db.run('INSERT INTO products (store_id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, 2, 'Tr\u00E0 \u0111\u00E1', 5000, 1]);
  db.run('INSERT INTO products (store_id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, 2, 'N\u01B0\u1EDBc m\u00EDa', 15000, 2]);
  db.run('INSERT INTO products (store_id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, 2, 'C\u00E0 ph\u00EA s\u1EEFa', 20000, 3]);

  // Topping group
  db.run('INSERT INTO topping_groups (store_id, name, is_required, max_select, sort_order) VALUES (?, ?, ?, ?, ?)', [storeId, '\u0110\u1ED3 th\u00EAm', 0, 0, 1]);

  // Toppings (group_id = 1)
  db.run('INSERT INTO toppings (group_id, store_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [1, storeId, '\u1ED0c', 10000, 1]);
  db.run('INSERT INTO toppings (group_id, store_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [1, storeId, 'Gi\u00F2', 8000, 2]);
  db.run('INSERT INTO toppings (group_id, store_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [1, storeId, 'B\u00F2', 15000, 3]);
  db.run('INSERT INTO toppings (group_id, store_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [1, storeId, '\u0110\u1EADu', 5000, 4]);
  db.run('INSERT INTO toppings (group_id, store_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)', [1, storeId, 'Tr\u1EE9ng', 5000, 5]);

  // Link products to topping group: Bún riêu (id=1) and Bún bò (id=2) → group 1
  db.run('INSERT INTO product_topping_groups (product_id, group_id) VALUES (?, ?)', [1, 1]);
  db.run('INSERT INTO product_topping_groups (product_id, group_id) VALUES (?, ?)', [2, 1]);

  console.log('[Product] Demo data seeded (2 categories, 7 products, 1 topping group, 5 toppings)');
}

function saveDatabase() {
  const { flushNow } = require('../../shared/db');
  flushNow(db, DB_PATH);
}

function getDatabase() {
  return db;
}

module.exports = { initDatabase, getDatabase, saveDatabase };
