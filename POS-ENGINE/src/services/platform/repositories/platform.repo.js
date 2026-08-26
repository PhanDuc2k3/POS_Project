const { getDatabase, saveDatabase } = require('../database');

const ACTIONABLE_ORDER_STATUSES = new Set(['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT', 'PAID', 'APPROVED', 'PROVISIONING', 'PROVISIONING_FAILED', 'ON_HOLD']);
const ACTIONABLE_LEAD_STATUSES = new Set(['NEW', 'CONTACTED']);

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
    betaAnalytics: Boolean(row[11]),
    waiveSetupFee: row[12] !== 0,
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

function rowToMarketingSignup(row) {
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    status: row[3],
    createdAt: row[4],
    updatedAt: row[5],
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
  const result = db.exec('SELECT id, name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date, beta_analytics, waive_setup_fee FROM platform_tenants ORDER BY id ASC');
  return result[0]?.values?.map(rowToTenant) || [];
}

function findTenantById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date, beta_analytics, waive_setup_fee FROM platform_tenants WHERE id = ?', [id]);
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
  const result = db.exec('SELECT id, name, owner_name, owner_email, package_tier, operating_mode, status, branches, users, monthly_revenue, renewal_date, beta_analytics, waive_setup_fee FROM platform_tenants ORDER BY id DESC LIMIT 1');
  return result[0]?.values?.[0] ? rowToTenant(result[0].values[0]) : null;
}

function updateTenantPackage(id, packageTier, operatingMode, overrides = {}) {
  const db = getDatabase();
  db.run(
    'UPDATE platform_tenants SET package_tier = ?, operating_mode = ?, beta_analytics = ?, waive_setup_fee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [packageTier, operatingMode, overrides.betaAnalytics ? 1 : 0, overrides.waiveSetupFee === false ? 0 : 1, id]
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

function updateTenantStatus(id, status) {
  const tenant = findTenantById(id);
  if (!tenant) return null;
  const db = getDatabase();
  db.run(
    'UPDATE platform_tenants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id]
  );
  saveDatabase();
  return findTenantById(id);
}

function listAccounts() {
  const db = getDatabase();
  const result = db.exec('SELECT id, tenant_id, name, email, role, status, activation_token, activation_sent_at FROM platform_accounts ORDER BY id DESC');
  return result[0]?.values?.map(rowToAccount) || [];
}

function findAccountById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT id, tenant_id, name, email, role, status, activation_token, activation_sent_at FROM platform_accounts WHERE id = ?', [id]);
  return result[0]?.values?.[0] ? rowToAccount(result[0].values[0]) : null;
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

function listMarketingSignups() {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, name, email, status, created_at, updated_at
     FROM platform_marketing_signups
     ORDER BY created_at DESC`
  );
  return result[0]?.values?.map(rowToMarketingSignup) || [];
}

function findMarketingSignupByEmail(email) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, name, email, status, created_at, updated_at
     FROM platform_marketing_signups
     WHERE lower(email) = lower(?)`,
    [email]
  );
  return result[0]?.values?.[0] ? rowToMarketingSignup(result[0].values[0]) : null;
}

function findMarketingSignupCredentialsByEmail(email) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, name, email, status, created_at, updated_at, password_hash
     FROM platform_marketing_signups
     WHERE lower(email) = lower(?)`,
    [email]
  );
  const row = result[0]?.values?.[0];
  if (!row) return null;
  return {
    ...rowToMarketingSignup(row),
    passwordHash: row[6],
  };
}

function findMarketingSignupById(id) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, name, email, status, created_at, updated_at
     FROM platform_marketing_signups
     WHERE id = ?`,
    [id]
  );
  return result[0]?.values?.[0] ? rowToMarketingSignup(result[0].values[0]) : null;
}

function createMarketingSignup({ name, email, passwordHash }) {
  const id = createId('MSU');
  const db = getDatabase();
  db.run(
    `INSERT INTO platform_marketing_signups (id, name, email, password_hash, status)
     VALUES (?, ?, ?, ?, 'REGISTERED')`,
    [id, name, email, passwordHash]
  );
  saveDatabase();
  return findMarketingSignupByEmail(email);
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

function findSalesLeadById(id) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, name, phone, email, message, status, created_at, updated_at
     FROM platform_sales_leads
     WHERE id = ?`,
    [id]
  );
  return result[0]?.values?.[0] ? rowToSalesLead(result[0].values[0]) : null;
}

function updateSalesLeadStatus(id, status) {
  const current = findSalesLeadById(id);
  if (!current) return null;
  const db = getDatabase();
  db.run(
    'UPDATE platform_sales_leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id]
  );
  saveDatabase();
  return findSalesLeadById(id);
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
  const salesLeads = listSalesLeads();
  const packages = listPackages();
  const activeMrr = tenants.reduce((sum, tenant) => {
    if (tenant.status !== 'active') return sum;
    const pkg = packages.find((item) => item.id === tenant.packageTier);
    return sum + (pkg?.price || 0);
  }, 0);
  const packageLabels = Object.fromEntries(packages.map((pkg) => [pkg.id, pkg.name || pkg.id]));
  const tenantById = new Map(tenants.map((tenant) => [String(tenant.id), tenant]));

  return {
    tenants: tenants.length,
    activeMrr,
    paidOrders: orders.filter((order) => isPaidOrder(order)).length,
    pendingTrials: trialRequests.filter((request) => request.status === 'pending').length,
    roles: 6,
    tenantHealth: buildTenantHealth(tenants),
    packageDistribution: buildPackageDistribution(tenants, packageLabels),
    recentOrders: buildRecentOrders(orders, tenantById),
    actionRequired: buildActionRequired({ orders, trialRequests, salesLeads, tenantById }),
    mrrTrend: buildMrrTrend(activeMrr),
  };
}

function isPaidOrder(order) {
  const status = String(order.status || '').toUpperCase();
  const paymentStatus = String(order.paymentStatus || '').toUpperCase();
  return paymentStatus === 'PAID' || ['PAID', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(status);
}

function buildTenantHealth(tenants) {
  const countByStatus = tenants.reduce((items, tenant) => {
    const status = String(tenant.status || 'active').toLowerCase();
    items[status] = (items[status] || 0) + 1;
    return items;
  }, {});
  const countByTier = tenants.reduce((items, tenant) => {
    const tier = String(tenant.packageTier || 'unknown').toLowerCase();
    items[tier] = (items[tier] || 0) + 1;
    return items;
  }, {});

  return {
    total: tenants.length,
    active: countByStatus.active || 0,
    trial: countByStatus.trial || 0,
    suspended: countByStatus.suspended || 0,
    tiers: countByTier,
  };
}

function buildPackageDistribution(tenants, packageLabels) {
  const counts = tenants.reduce((items, tenant) => {
    const tier = tenant.packageTier || 'unknown';
    items[tier] = (items[tier] || 0) + 1;
    return items;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .map(([tier, value]) => ({
      tier,
      label: packageLabels[tier] || tier,
      value,
    }));
}

function buildRecentOrders(orders, tenantById) {
  return [...orders]
    .sort((left, right) => (new Date(right.createdAt).getTime() || 0) - (new Date(left.createdAt).getTime() || 0))
    .slice(0, 4)
    .map((order) => {
      const tenant = tenantById.get(String(order.tenantId));
      return {
        id: order.id,
        orderCode: order.orderCode || order.id,
        tenantId: order.tenantId,
        tenantName: order.companyName || tenant?.name || order.customerName || '',
        amount: order.amount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      };
    });
}

function buildActionRequired({ orders, trialRequests, salesLeads, tenantById }) {
  const actions = [];
  orders
    .filter((order) => ACTIONABLE_ORDER_STATUSES.has(String(order.status || '').toUpperCase()))
    .forEach((order) => {
      const status = String(order.status || '').toUpperCase();
      const tenant = tenantById.get(String(order.tenantId));
      actions.push({
        type: 'order',
        id: order.id,
        view: 'orders',
        status,
        title: `${order.orderCode || order.id} - ${status.replaceAll('_', ' ')}`,
        detail: order.companyName || tenant?.name || order.customerName || 'Subscription order',
        tone: status === 'PROVISIONING_FAILED' ? 'danger' : '',
      });
    });

  const pendingTrial = trialRequests.find((request) => String(request.status || '').toLowerCase() === 'pending');
  if (pendingTrial) {
    actions.push({
      type: 'trial',
      id: pendingTrial.id,
      view: 'requests',
      status: pendingTrial.status || 'pending',
      title: `Pending Trial Request - ${pendingTrial.id}`,
      detail: pendingTrial.restaurantName || pendingTrial.contactName || 'Trial request',
      tone: '',
    });
  }

  salesLeads
    .filter((lead) => ACTIONABLE_LEAD_STATUSES.has(String(lead.status || '').toUpperCase()))
    .forEach((newLead) => {
      actions.push({
        type: 'lead',
        id: newLead.id,
        view: 'requests',
        status: newLead.status || 'NEW',
        title: `New Sales Lead - ${newLead.id}`,
        detail: newLead.name || newLead.phone || 'Sales lead',
        tone: '',
      });
    });

  return actions;
}

function buildMrrTrend(activeMrr) {
  const current = Number(activeMrr || 0);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!current) {
    return months.map((month) => ({ month, value: 0 }));
  }
  return months.map((month, index) => ({
    month,
    value: Math.round(current * (0.72 + index * 0.028)),
  }));
}

function bootstrap() {
  const tenants = listTenants();
  const packages = listPackages();
  const orders = listOrders();
  const accounts = listAccounts();
  const trialRequests = listTrialRequests();
  const salesLeads = listSalesLeads();
  const marketingSignups = listMarketingSignups();
  const permissions = ['platform_admin', 'store_owner', 'chain_admin', 'manager', 'cashier', 'kitchen'].map((role) => getPermissionRole(role));
  return {
    summary: getSummary(),
    tenants,
    packages,
    orders,
    accounts,
    trialRequests,
    salesLeads,
    marketingSignups,
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
  updateTenantStatus,
  listPackages,
  findPackageById,
  listAccounts,
  findAccountById,
  createAccount,
  updateAccountActivation,
  listTrialRequests,
  listSalesLeads,
  listMarketingSignups,
  findMarketingSignupByEmail,
  findMarketingSignupCredentialsByEmail,
  findMarketingSignupById,
  createMarketingSignup,
  createSalesLead,
  findSalesLeadById,
  updateSalesLeadStatus,
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
