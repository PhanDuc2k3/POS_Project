const { getDatabase, saveDatabase } = require('../database');

function rowToTenant(row) {
  return {
    id: row[0],
    name: row[1],
    ownerName: row[2],
    ownerEmail: row[3],
    packageTier: row[4],
    operatingMode: row[5],
    status: row[6],
    branches: row[7],
    users: row[8],
    monthlyRevenue: row[9],
    renewalDate: row[10],
  };
}

function rowToAccount(row) {
  return {
    id: row[0],
    tenantId: row[1],
    name: row[2],
    email: row[3],
    role: row[4],
    status: row[5],
  };
}

function rowToOrder(row) {
  return {
    id: row[0],
    tenantId: row[1],
    packageTier: row[2],
    amount: row[3],
    status: row[4],
    createdAt: row[5],
  };
}

function rowToPackage(row) {
  return {
    id: row[0],
    name: row[1],
    level: row[2],
    price: row[3],
    modules: JSON.parse(row[4] || '[]'),
    sortOrder: row[5],
  };
}

function rowToPermission(row) {
  return {
    role: row[0],
    permissions: JSON.parse(row[1] || '[]'),
  };
}

function listPackages() {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, level, price, modules, sort_order FROM platform_packages ORDER BY sort_order ASC, price ASC');
  return result[0]?.values?.map(rowToPackage) || [];
}

function listTenants() {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date FROM platform_tenants ORDER BY id ASC');
  return result[0]?.values?.map(rowToTenant) || [];
}

function findTenantById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date FROM platform_tenants WHERE id = ?', [id]);
  return result[0]?.values?.[0] ? rowToTenant(result[0].values[0]) : null;
}

function updateTenantPackage(id, packageTier, operatingMode) {
  const db = getDatabase();
  db.run(
    'UPDATE platform_tenants SET package_tier = ?, operating_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [packageTier, operatingMode, id]
  );
  saveDatabase();
  return findTenantById(id);
}

function toggleTenantStatus(id) {
  const tenant = findTenantById(id);
  if (!tenant) return null;
  const next = tenant.status === 'active' ? 'suspended' : 'active';
  const db = getDatabase();
  db.run(
    'UPDATE platform_tenants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [next, id]
  );
  saveDatabase();
  return findTenantById(id);
}

function listAccounts() {
  const db = getDatabase();
  const result = db.exec('SELECT id, tenant_id, name, email, role, status FROM platform_accounts ORDER BY id DESC');
  return result[0]?.values?.map(rowToAccount) || [];
}

function createAccount({ tenantId, name, email, role }) {
  const db = getDatabase();
  db.run(
    'INSERT INTO platform_accounts (tenant_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)',
    [tenantId, name, email, role, 'invited']
  );
  saveDatabase();
  const result = db.exec('SELECT id, tenant_id, name, email, role, status FROM platform_accounts ORDER BY id DESC LIMIT 1');
  return result[0]?.values?.[0] ? rowToAccount(result[0].values[0]) : null;
}

function listOrders() {
  const db = getDatabase();
  const result = db.exec('SELECT id, tenant_id, package_tier, amount, status, created_at FROM platform_subscription_orders ORDER BY created_at DESC');
  return result[0]?.values?.map(rowToOrder) || [];
}

function createOrder({ tenantId, packageTier, amount, status = 'pending' }) {
  const db = getDatabase();
  const id = `SUB-${1000 + listOrders().length + 1}`;
  db.run(
    'INSERT INTO platform_subscription_orders (id, tenant_id, package_tier, amount, status) VALUES (?, ?, ?, ?, ?)',
    [id, tenantId, packageTier, amount, status]
  );
  saveDatabase();
  return { id, tenantId, packageTier, amount, status };
}

function getPermissionRole(role) {
  const db = getDatabase();
  const result = db.exec('SELECT role, permissions FROM platform_permissions WHERE role = ?', [role]);
  return result[0]?.values?.[0] ? rowToPermission(result[0].values[0]) : { role, permissions: [] };
}

function togglePermission(role, permission) {
  const current = getPermissionRole(role);
  const permissions = new Set(current.permissions);
  if (permissions.has(permission)) permissions.delete(permission);
  else permissions.add(permission);
  const next = [...permissions];
  const db = getDatabase();
  db.run(
    'UPDATE platform_permissions SET permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE role = ?',
    [JSON.stringify(next), role]
  );
  saveDatabase();
  return { role, permissions: next };
}

function getSummary() {
  const tenants = listTenants();
  const orders = listOrders();
  const activeMrr = tenants.reduce((sum, tenant) => {
    if (tenant.status !== 'active') return sum;
    const pkg = listPackages().find((item) => item.id === tenant.packageTier);
    return sum + (pkg?.price || 0);
  }, 0);

  return {
    tenants: tenants.length,
    activeMrr,
    paidOrders: orders.filter((order) => order.status === 'paid').length,
    roles: 6,
  };
}

function bootstrap() {
  const tenants = listTenants();
  const packages = listPackages();
  const orders = listOrders();
  const accounts = listAccounts();
  const permissions = ['platform_admin', 'store_owner', 'chain_admin', 'manager', 'cashier', 'kitchen'].map((role) => getPermissionRole(role));
  return {
    summary: getSummary(),
    tenants,
    packages,
    orders,
    accounts,
    permissions,
  };
}

module.exports = {
  bootstrap,
  getSummary,
  listTenants,
  findTenantById,
  updateTenantPackage,
  toggleTenantStatus,
  listPackages,
  listAccounts,
  createAccount,
  listOrders,
  createOrder,
  getPermissionRole,
  togglePermission,
};
