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
    activationToken: row[6],
    activationSentAt: row[7],
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
    orderCode: row[6] || row[0],
    customerName: row[7],
    companyName: row[8],
    email: row[9],
    phone: row[10],
    requestedStoreCount: row[11] || 1,
    requestedDeviceCount: row[12] || 1,
    businessType: row[13],
    note: row[14],
    paymentStatus: row[15] || 'UNPAID',
    orderType: row[16] || 'MANAGED',
    approvedBy: row[17],
    approvedAt: row[18],
    rejectedBy: row[19],
    rejectedAt: row[20],
    rejectionReason: row[21],
    contactedAt: row[22],
    quotedAt: row[23],
    paidAt: row[24],
    provisionedAt: row[25],
    provisioningStep: row[26],
    failureReason: row[27],
    updatedAt: row[28],
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

function rowToTrialRequest(row) {
  return {
    id: row[0],
    restaurantName: row[1],
    contactName: row[2],
    email: row[3],
    phone: row[4],
    packageTier: row[5],
    operatingMode: row[6],
    message: row[7],
    submittedByUserId: row[8],
    submittedByUsername: row[9],
    status: row[10],
    tenantId: row[11],
    accountId: row[12],
    portalUsername: row[13],
    portalPassword: row[14],
    reviewedBy: row[15],
    reviewedAt: row[16],
    createdAt: row[17],
    updatedAt: row[18],
  };
}

function rowToSalesLead(row) {
  return {
    id: row[0],
    name: row[1],
    phone: row[2],
    email: row[3],
    message: row[4],
    status: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  };
}

function createId(prefix) {
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${Date.now().toString().slice(-6)}-${random}`;
}

function createOrderCode() {
  const year = new Date().getFullYear();
  const count = listOrders().filter((order) => String(order.orderCode || '').includes(`ORD-${year}`)).length + 1;
  return `ORD-${year}-${String(count).padStart(6, '0')}`;
}

function createPassword() {
  return `POS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`;
}

function listPackages() {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, level, price, modules, sort_order FROM platform_packages ORDER BY sort_order ASC, price ASC');
  return result[0]?.values?.map(rowToPackage) || [];
}

function findPackageById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, level, price, modules, sort_order FROM platform_packages WHERE id = ?', [id]);
  return result[0]?.values?.[0] ? rowToPackage(result[0].values[0]) : null;
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

function createTenant({ name, ownerName, ownerEmail, packageTier, operatingMode, status = 'trial', renewalDate = null }) {
  const db = getDatabase();
  db.run(
    `INSERT INTO platform_tenants (name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, ?)`,
    [name, ownerName, ownerEmail, packageTier, operatingMode, status, renewalDate]
  );
  saveDatabase();
  const result = db.exec('SELECT id, name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date FROM platform_tenants ORDER BY id DESC LIMIT 1');
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
  const result = db.exec('SELECT id, tenant_id, name, email, role, status, activation_token, activation_sent_at FROM platform_accounts ORDER BY id DESC');
  return result[0]?.values?.map(rowToAccount) || [];
}

function createAccount({ tenantId, name, email, role, status = 'invited' }) {
  const db = getDatabase();
  db.run(
    'INSERT INTO platform_accounts (tenant_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)',
    [tenantId, name, email, role, status]
  );
  saveDatabase();
  const result = db.exec('SELECT id, tenant_id, name, email, role, status, activation_token, activation_sent_at FROM platform_accounts ORDER BY id DESC LIMIT 1');
  return result[0]?.values?.[0] ? rowToAccount(result[0].values[0]) : null;
}

function updateAccountActivation(accountId, activationToken) {
  const db = getDatabase();
  db.run(
    'UPDATE platform_accounts SET activation_token = ?, activation_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [activationToken, accountId]
  );
  saveDatabase();
  const result = db.exec('SELECT id, tenant_id, name, email, role, status, activation_token, activation_sent_at FROM platform_accounts WHERE id = ?', [accountId]);
  return result[0]?.values?.[0] ? rowToAccount(result[0].values[0]) : null;
}

function listTrialRequests() {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, restaurant_name, contact_name, email, phone, package_tier, operating_mode, message, submitted_by_user_id, submitted_by_username, status, tenant_id, account_id, portal_username, portal_password, reviewed_by, reviewed_at, created_at, updated_at
     FROM platform_trial_requests
     ORDER BY created_at DESC`
  );
  return result[0]?.values?.map(rowToTrialRequest) || [];
}

function listSalesLeads() {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, name, phone, email, message, status, created_at, updated_at
     FROM platform_sales_leads
     ORDER BY created_at DESC`
  );
  return result[0]?.values?.map(rowToSalesLead) || [];
}

function createSalesLead({ name, phone, email, message }) {
  const id = createId('LEAD');
  const db = getDatabase();
  db.run(
    `INSERT INTO platform_sales_leads (id, name, phone, email, message, status)
     VALUES (?, ?, ?, ?, ?, 'NEW')`,
    [id, name, phone, email || '', message || '']
  );
  saveDatabase();
  return listSalesLeads().find((lead) => lead.id === id) || null;
}

function listTrialRequestsByUserId(userId) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, restaurant_name, contact_name, email, phone, package_tier, operating_mode, message, submitted_by_user_id, submitted_by_username, status, tenant_id, account_id, portal_username, portal_password, reviewed_by, reviewed_at, created_at, updated_at
     FROM platform_trial_requests
     WHERE submitted_by_user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return result[0]?.values?.map(rowToTrialRequest) || [];
}

function findTrialRequestById(id) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, restaurant_name, contact_name, email, phone, package_tier, operating_mode, message, submitted_by_user_id, submitted_by_username, status, tenant_id, account_id, portal_username, portal_password, reviewed_by, reviewed_at, created_at, updated_at
     FROM platform_trial_requests
     WHERE id = ?`,
    [id]
  );
  return result[0]?.values?.[0] ? rowToTrialRequest(result[0].values[0]) : null;
}

function createTrialRequest({ restaurantName, contactName, email, phone, packageTier, operatingMode, message, submittedByUserId = null, submittedByUsername = null }) {
  const id = createId('TR');
  const db = getDatabase();
  db.run(
    `INSERT INTO platform_trial_requests (id, restaurant_name, contact_name, email, phone, package_tier, operating_mode, message, submitted_by_user_id, submitted_by_username, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [id, restaurantName, contactName, email, phone || '', packageTier, operatingMode, message || '', submittedByUserId, submittedByUsername]
  );
  saveDatabase();
  return findTrialRequestById(id);
}

function updateTrialRequest(id, updates) {
  const current = findTrialRequestById(id);
  if (!current) return null;
  const next = { ...current, ...updates };
  const db = getDatabase();
  db.run(
    `UPDATE platform_trial_requests
     SET status = ?, tenant_id = ?, account_id = ?, portal_username = ?, portal_password = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      next.status,
      next.tenantId || null,
      next.accountId || null,
      next.portalUsername || null,
      next.portalPassword || null,
      next.reviewedBy || null,
      id,
    ]
  );
  saveDatabase();
  return findTrialRequestById(id);
}

function findLatestTrialRequestByUserId(userId) {
  const requests = listTrialRequestsByUserId(userId);
  return requests[0] || null;
}

function listOrders() {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, tenant_id, package_tier, amount, status, created_at, order_code, customer_name, company_name, email, phone,
            requested_store_count, requested_device_count, business_type, note, payment_status, order_type, approved_by,
            approved_at, rejected_by, rejected_at, rejection_reason, contacted_at, quoted_at, paid_at, provisioned_at,
            provisioning_step, failure_reason, updated_at
     FROM platform_subscription_orders
     ORDER BY created_at DESC`
  );
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

function findOrderById(id) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, tenant_id, package_tier, amount, status, created_at, order_code, customer_name, company_name, email, phone,
            requested_store_count, requested_device_count, business_type, note, payment_status, order_type, approved_by,
            approved_at, rejected_by, rejected_at, rejection_reason, contacted_at, quoted_at, paid_at, provisioned_at,
            provisioning_step, failure_reason, updated_at
     FROM platform_subscription_orders
     WHERE id = ? OR order_code = ?`,
    [id, id]
  );
  return result[0]?.values?.[0] ? rowToOrder(result[0].values[0]) : null;
}

function createPurchaseOrder(payload) {
  const pkg = findPackageById(payload.packageTier);
  const orderCode = createOrderCode();
  const db = getDatabase();
  db.run(
    `INSERT INTO platform_subscription_orders (
      id, order_code, tenant_id, package_tier, amount, status, customer_name, company_name, email, phone,
      requested_store_count, requested_device_count, business_type, note, payment_status, order_type
    ) VALUES (?, ?, 0, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', ?)`,
    [
      orderCode,
      orderCode,
      payload.packageTier,
      pkg?.price || 0,
      payload.customerName,
      payload.companyName,
      payload.email,
      payload.phone || '',
      payload.requestedStoreCount,
      payload.requestedDeviceCount,
      payload.businessType || '',
      payload.note || '',
      payload.orderType || 'MANAGED',
    ]
  );
  saveDatabase();
  return findOrderById(orderCode);
}

function updateOrder(id, updates) {
  const current = findOrderById(id);
  if (!current) return null;
  const next = { ...current, ...updates };
  const db = getDatabase();
  db.run(
    `UPDATE platform_subscription_orders
     SET tenant_id = ?, status = ?, payment_status = ?, approved_by = ?, approved_at = ?, rejected_by = ?, rejected_at = ?,
         rejection_reason = ?, contacted_at = ?, quoted_at = ?, paid_at = ?, provisioned_at = ?, provisioning_step = ?,
         failure_reason = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      next.tenantId || 0,
      next.status,
      next.paymentStatus || 'UNPAID',
      next.approvedBy || null,
      next.approvedAt || null,
      next.rejectedBy || null,
      next.rejectedAt || null,
      next.rejectionReason || null,
      next.contactedAt || null,
      next.quotedAt || null,
      next.paidAt || null,
      next.provisionedAt || null,
      next.provisioningStep || null,
      next.failureReason || null,
      current.id,
    ]
  );
  saveDatabase();
  return findOrderById(current.id);
}

function createSubscription({ tenantId, packageTier, maxStore }) {
  const db = getDatabase();
  db.run(
    `INSERT INTO platform_subscriptions (tenant_id, package_tier, status, max_store, start_date)
     VALUES (?, ?, 'ACTIVE', ?, ?)`,
    [tenantId, packageTier, maxStore, new Date().toISOString().slice(0, 10)]
  );
  saveDatabase();
  const result = db.exec(
    'SELECT id, tenant_id, package_tier, status, max_store, billing_cycle, start_date, end_date, created_at, updated_at FROM platform_subscriptions WHERE tenant_id = ? ORDER BY id DESC LIMIT 1',
    [tenantId]
  );
  if (!result[0]?.values?.[0]) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    tenantId: row[1],
    packageTier: row[2],
    status: row[3],
    maxStore: row[4],
    billingCycle: row[5],
    startDate: row[6],
    endDate: row[7],
    createdAt: row[8],
    updatedAt: row[9],
  };
}

function createTenantStore({ tenantId, ownerAccountId, name }) {
  const db = getDatabase();
  db.run(
    `INSERT INTO platform_tenant_stores (tenant_id, owner_account_id, name, status) VALUES (?, ?, ?, 'active')`,
    [tenantId, ownerAccountId || null, name]
  );
  saveDatabase();
  const result = db.exec(
    'SELECT id, tenant_id, owner_account_id, name, status, created_at, updated_at FROM platform_tenant_stores WHERE tenant_id = ? ORDER BY id DESC LIMIT 1',
    [tenantId]
  );
  if (!result[0]?.values?.[0]) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    tenantId: row[1],
    ownerAccountId: row[2],
    name: row[3],
    status: row[4],
    createdAt: row[5],
    updatedAt: row[6],
  };
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
  const trialRequests = listTrialRequests();
  const activeMrr = tenants.reduce((sum, tenant) => {
    if (tenant.status !== 'active') return sum;
    const pkg = listPackages().find((item) => item.id === tenant.packageTier);
    return sum + (pkg?.price || 0);
  }, 0);

  return {
    tenants: tenants.length,
    activeMrr,
    paidOrders: orders.filter((order) => order.paymentStatus === 'PAID' || order.status === 'PAID').length,
    pendingTrials: trialRequests.filter((request) => request.status === 'pending').length,
    roles: 6,
  };
}

function bootstrap() {
  const tenants = listTenants();
  const packages = listPackages();
  const orders = listOrders();
  const accounts = listAccounts();
  const trialRequests = listTrialRequests();
  const salesLeads = listSalesLeads();
  const permissions = ['platform_admin', 'store_owner', 'chain_admin', 'manager', 'cashier', 'kitchen'].map((role) => getPermissionRole(role));
  return {
    summary: getSummary(),
    tenants,
    packages,
    orders,
    accounts,
    trialRequests,
    salesLeads,
    permissions,
  };
}

module.exports = {
  bootstrap,
  getSummary,
  listTenants,
  findTenantById,
  createTenant,
  updateTenantPackage,
  toggleTenantStatus,
  listPackages,
  findPackageById,
  listAccounts,
  createAccount,
  updateAccountActivation,
  listTrialRequests,
  listSalesLeads,
  createSalesLead,
  listTrialRequestsByUserId,
  findTrialRequestById,
  findLatestTrialRequestByUserId,
  createTrialRequest,
  updateTrialRequest,
  createPassword,
  listOrders,
  createOrder,
  findOrderById,
  createPurchaseOrder,
  updateOrder,
  createSubscription,
  createTenantStore,
  getPermissionRole,
  togglePermission,
};
