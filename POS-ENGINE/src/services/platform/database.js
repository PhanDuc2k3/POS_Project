const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { startAutoSave } = require('../../shared/db');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'platform.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      price REAL NOT NULL,
      modules TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      package_tier TEXT NOT NULL,
      operating_mode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      branches INTEGER DEFAULT 1,
      users INTEGER DEFAULT 1,
      monthly_revenue REAL DEFAULT 0,
      renewal_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      activation_token TEXT,
      activation_sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_subscription_orders (
      id TEXT PRIMARY KEY,
      tenant_id INTEGER,
      package_tier TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      order_code TEXT,
      customer_name TEXT,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      requested_store_count INTEGER DEFAULT 1,
      requested_device_count INTEGER DEFAULT 1,
      business_type TEXT,
      note TEXT,
      payment_status TEXT NOT NULL DEFAULT 'UNPAID',
      order_type TEXT NOT NULL DEFAULT 'MANAGED',
      approved_by TEXT,
      approved_at DATETIME,
      rejected_by TEXT,
      rejected_at DATETIME,
      rejection_reason TEXT,
      contacted_at DATETIME,
      quoted_at DATETIME,
      paid_at DATETIME,
      provisioned_at DATETIME,
      provisioning_step TEXT,
      failure_reason TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      package_tier TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      max_store INTEGER NOT NULL DEFAULT 1,
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_tenant_stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      owner_account_id INTEGER,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_permissions (
      role TEXT PRIMARY KEY,
      permissions TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS platform_trial_requests (
      id TEXT PRIMARY KEY,
      restaurant_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      package_tier TEXT NOT NULL,
      operating_mode TEXT NOT NULL,
      message TEXT,
      submitted_by_user_id INTEGER,
      submitted_by_username TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      tenant_id INTEGER,
      account_id INTEGER,
      portal_username TEXT,
      portal_password TEXT,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    db.run(`ALTER TABLE platform_trial_requests ADD COLUMN submitted_by_user_id INTEGER`);
  } catch (e) {}

  try {
    db.run(`ALTER TABLE platform_trial_requests ADD COLUMN submitted_by_username TEXT`);
  } catch (e) {}

  [
    `ALTER TABLE platform_accounts ADD COLUMN activation_token TEXT`,
    `ALTER TABLE platform_accounts ADD COLUMN activation_sent_at DATETIME`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN order_code TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN customer_name TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN company_name TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN email TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN phone TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN requested_store_count INTEGER DEFAULT 1`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN requested_device_count INTEGER DEFAULT 1`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN business_type TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN note TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'UNPAID'`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'MANAGED'`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN approved_by TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN approved_at DATETIME`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN rejected_by TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN rejected_at DATETIME`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN rejection_reason TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN contacted_at DATETIME`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN quoted_at DATETIME`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN paid_at DATETIME`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN provisioned_at DATETIME`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN provisioning_step TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN failure_reason TEXT`,
    `ALTER TABLE platform_subscription_orders ADD COLUMN updated_at DATETIME`,
  ].forEach((sql) => {
    try {
      db.run(sql);
    } catch (e) {}
  });

  seedIfEmpty();
  saveDatabase();
  startAutoSave(db, DB_PATH);
  return db;
}

function seedIfEmpty() {
  const packageCount = db.exec('SELECT COUNT(*) FROM platform_packages')[0]?.values[0]?.[0] || 0;
  if (packageCount === 0) {
    const packages = [
      ['plus', 'PLUS', '2 cap', 290000, '["POS Electron","Portal","Products","Transactions","Receipt"]', 1],
      ['pro', 'PRO', '4 cap', 1900000, '["Customer Order App","Kitchen App","Staff POS","Portal","Dining session"]', 2],
      ['starter', 'Starter', '2 cap', 290000, '["POS direct sale","Basic portal","Receipt"]', 3],
      ['restaurant', 'Restaurant', '4 cap', 1900000, '["Customer order","Kitchen display","Table session","Staff billing"]', 4],
      ['chain', 'Chain', '4 cap+', 5900000, '["Multi-branch","Chain dashboard","Central menu","Advanced roles"]', 5],
    ];
    packages.forEach((row) => {
      db.run(
        `INSERT INTO platform_packages (id, name, level, price, modules, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        row
      );
    });
  }

  const plusExists = db.exec('SELECT id FROM platform_packages WHERE id = ?', ['plus']);
  if (!plusExists.length || !plusExists[0].values.length) {
    db.run(
      `INSERT INTO platform_packages (id, name, level, price, modules, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      ['plus', 'PLUS', '2 cap', 290000, '["POS Electron","Portal","Products","Transactions","Receipt"]', 1]
    );
  }

  db.run(
    `UPDATE platform_packages SET name = ?, level = ?, price = ?, modules = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ['PRO', '4 cap', 1900000, '["Customer Order App","Kitchen App","Staff POS","Portal","Dining session"]', 2, 'pro']
  );

  const tenantCount = db.exec('SELECT COUNT(*) FROM platform_tenants')[0]?.values[0]?.[0] || 0;
  if (tenantCount === 0) {
    const tenants = [
      ['Demo Coffee', 'Nguyen Van A', 'owner@demo-coffee.local', 'restaurant', 'restaurant', 'active', 2, 8, 12400000, '2026-09-12'],
      ['Mini Mart 24h', 'Tran Thi B', 'ops@minimart.local', 'pro', 'simple', 'trial', 1, 3, 4200000, '2026-08-28'],
      ['City BBQ Chain', 'Le Minh C', 'admin@citybbq.local', 'chain', 'restaurant', 'active', 6, 42, 76400000, '2026-09-30'],
    ];
    tenants.forEach((row) => {
      db.run(
        `INSERT INTO platform_tenants (name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    });
  }

  const accountCount = db.exec('SELECT COUNT(*) FROM platform_accounts')[0]?.values[0]?.[0] || 0;
  if (accountCount === 0) {
    const accounts = [
      [1, 'Nguyen Van A', 'owner@demo-coffee.local', 'store_owner', 'active'],
      [1, 'Manager Demo', 'manager@demo-coffee.local', 'manager', 'active'],
      [3, 'Chain Admin', 'admin@citybbq.local', 'chain_admin', 'active'],
    ];
    accounts.forEach((row) => {
      db.run(
        `INSERT INTO platform_accounts (tenant_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)`,
        row
      );
    });
  }

  const orderCount = db.exec('SELECT COUNT(*) FROM platform_subscription_orders')[0]?.values[0]?.[0] || 0;
  if (orderCount === 0) {
    const orders = [
      ['SUB-1008', 3, 'chain', 5900000, 'paid'],
      ['SUB-1007', 1, 'restaurant', 1900000, 'paid'],
      ['SUB-1006', 2, 'pro', 790000, 'pending'],
    ];
    orders.forEach((row) => {
      db.run(
        `INSERT INTO platform_subscription_orders (id, tenant_id, package_tier, amount, status) VALUES (?, ?, ?, ?, ?)`,
        row
      );
    });
  }

  const permCount = db.exec('SELECT COUNT(*) FROM platform_permissions')[0]?.values[0]?.[0] || 0;
  if (permCount === 0) {
    const permissions = {
      platform_admin: ['tenant.manage', 'package.assign', 'order.manage', 'account.manage', 'permission.manage', 'audit.view'],
      store_owner: ['store.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'billing.view'],
      chain_admin: ['branch.manage', 'store.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'billing.view'],
      manager: ['menu.manage', 'transaction.view', 'staff.view'],
      cashier: ['pos.sell', 'payment.collect'],
      kitchen: ['kitchen.view', 'kitchen.update'],
    };
    Object.entries(permissions).forEach(([role, perms]) => {
      db.run(
        `INSERT INTO platform_permissions (role, permissions) VALUES (?, ?)`,
        [role, JSON.stringify(perms)]
      );
    });
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
