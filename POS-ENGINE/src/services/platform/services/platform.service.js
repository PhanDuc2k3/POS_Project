const repo = require('../repositories/platform.repo');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../../shared/config');
const orderStatus = require('./order-status.service');
const provisioningService = require('./provisioning.service');

function requirePlatformAdmin(user) {
  if (!user || user.role !== 'platform_admin') {
    return { error: 'Platform admin required', status: 403 };
  }
  return null;
}

function getBootstrap(user) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.bootstrap() };
}

function getSummary(user) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.getSummary() };
}

function listTenants(user) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.listTenants() };
}

function createTenant(user, payload) {
  const access = requirePlatformAdmin(user);
  if (access) return access;

  const name = String(payload?.name || '').trim();
  const ownerName = String(payload?.ownerName || '').trim();
  const ownerEmail = String(payload?.ownerEmail || '').trim();
  const packageTier = String(payload?.packageTier || 'trial').trim();
  const operatingMode = String(payload?.operatingMode || 'simple').trim();
  const status = String(payload?.status || 'active').trim().toLowerCase();
  const renewalDate = String(payload?.renewalDate || '').trim() || null;

  if (!name || !ownerName || !ownerEmail) {
    return { error: 'name, ownerName and ownerEmail required', status: 400 };
  }
  if (!repo.findPackageById(packageTier)) {
    return { error: 'Package not found', status: 404 };
  }
  if (!['active', 'trial', 'suspended'].includes(status)) {
    return { error: 'Invalid tenant status', status: 400 };
  }

  const tenant = repo.createTenant({ name, ownerName, ownerEmail, packageTier, operatingMode, status, renewalDate });
  const account = repo.createAccount({ tenantId: tenant.id, name: ownerName, email: ownerEmail, role: 'store_owner', status: 'active' });
  return { data: { tenant, account } };
}

function listTrialRequests(user) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.listTrialRequests() };
}

function getMyTrialRequest(user) {
  if (!user?.id) return { error: 'Login required', status: 401 };
  return { data: repo.findLatestTrialRequestByUserId(user.id) };
}

function updateTenantPackage(user, tenantId, payload) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const { packageTier, operatingMode } = payload || {};
  if (!packageTier || !operatingMode) {
    return { error: 'packageTier and operatingMode required', status: 400 };
  }
  if (!repo.findPackageById(packageTier)) {
    return { error: 'Package not found', status: 404 };
  }
  const tenant = repo.updateTenantPackage(tenantId, packageTier, operatingMode, {
    betaAnalytics: Boolean(payload?.betaAnalytics),
    waiveSetupFee: payload?.waiveSetupFee !== false,
  });
  if (!tenant) return { error: 'Tenant not found', status: 404 };
  return { data: tenant };
}

function toggleTenantStatus(user, tenantId) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const tenant = repo.toggleTenantStatus(tenantId);
  if (!tenant) return { error: 'Tenant not found', status: 404 };
  return { data: tenant };
}

function updateTenantStatus(user, tenantId, payload) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const status = String(payload?.status || '').trim().toLowerCase();
  if (!['active', 'trial', 'suspended'].includes(status)) {
    return { error: 'Invalid tenant status', status: 400 };
  }
  const tenant = repo.updateTenantStatus(tenantId, status);
  if (!tenant) return { error: 'Tenant not found', status: 404 };
  return { data: tenant };
}

function listPackages(user) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.listPackages() };
}

function listAccounts(user) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.listAccounts() };
}

function inviteAccount(user, payload) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const { tenantId, email, role } = payload || {};
  if (!tenantId || !email || !role) {
    return { error: 'tenantId, email, role required', status: 400 };
  }
  const name = String(email).split('@')[0];
  return { data: repo.createAccount({ tenantId, name, email, role }) };
}

function resendAccountInvite(user, accountId) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const account = repo.findAccountById(accountId);
  if (!account) return { error: 'Account not found', status: 404 };
  const token = repo.createPassword();
  return { data: repo.updateAccountActivation(account.id, token) };
}

function submitTrialRequest(payload) {
  const userId = payload?.submittedByUserId;
  const username = String(payload?.submittedByUsername || '').trim();
  const restaurantName = String(payload?.restaurantName || '').trim();
  const contactName = String(payload?.contactName || '').trim();
  const email = String(payload?.email || '').trim();
  if (!restaurantName || !contactName || !email) {
    return { error: 'restaurantName, contactName and email required', status: 400 };
  }

  if (!userId) {
    return { error: 'Login required', status: 401 };
  }

  const existing = repo.findLatestTrialRequestByUserId(userId);
  if (existing && existing.status === 'pending') {
    return { error: 'You already have a pending trial request', status: 409 };
  }
  if (existing && existing.status === 'approved') {
    return { error: 'Your trial request has already been approved', status: 409 };
  }

  return {
    data: repo.createTrialRequest({
      restaurantName,
      contactName,
      email,
      phone: String(payload?.phone || '').trim(),
      packageTier: String(payload?.packageTier || 'restaurant').trim(),
      operatingMode: String(payload?.operatingMode || 'restaurant').trim(),
      message: String(payload?.message || '').trim(),
      submittedByUserId: userId,
      submittedByUsername: username || null,
    }),
  };
}

function approveTrialRequest(user, requestId) {
  const access = requirePlatformAdmin(user);
  if (access) return access;

  const request = repo.findTrialRequestById(requestId);
  if (!request) return { error: 'Trial request not found', status: 404 };
  if (request.status === 'approved') return { data: request };
  if (request.status === 'rejected') return { error: 'Trial request already rejected', status: 409 };

  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + 14);

  const tenant = repo.createTenant({
    name: request.restaurantName,
    ownerName: request.contactName,
    ownerEmail: request.email,
    packageTier: request.packageTier,
    operatingMode: request.operatingMode,
    status: 'trial',
    renewalDate: renewalDate.toISOString().slice(0, 10),
  });

  const account = repo.createAccount({
    tenantId: tenant.id,
    name: request.contactName,
    email: request.email,
    role: 'store_owner',
    status: 'active',
  });

  const portalUsername = `trial_${request.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase()}`;
  const updated = repo.updateTrialRequest(requestId, {
    status: 'approved',
    tenantId: tenant.id,
    accountId: account.id,
    portalUsername,
    portalPassword: repo.createPassword(),
    reviewedBy: user.username || 'platform',
  });

  return { data: { ...updated, tenant, account } };
}

function rejectTrialRequest(user, requestId) {
  const access = requirePlatformAdmin(user);
  if (access) return access;

  const request = repo.findTrialRequestById(requestId);
  if (!request) return { error: 'Trial request not found', status: 404 };
  if (request.status === 'approved') return { error: 'Trial request already approved', status: 409 };

  return {
    data: repo.updateTrialRequest(requestId, {
      status: 'rejected',
      reviewedBy: user.username || 'platform',
    }),
  };
}

function listOrders(user) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.listOrders() };
}

function getOrder(user, orderId) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const order = repo.findOrderById(orderId);
  if (!order) return { error: 'Order not found', status: 404 };
  return { data: order };
}

function normalizePackageTier(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'plus') return 'plus';
  if (raw === 'pro') return 'pro';
  return raw;
}

function signMarketingSignup(signup) {
  return jwt.sign(
    { type: 'marketing_signup', signupId: signup.id, email: signup.email },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '30d' }
  );
}

function publicSignupResponse(signup) {
  return {
    signupId: signup.id,
    name: signup.name,
    email: signup.email,
    status: signup.status,
    signupToken: signMarketingSignup(signup),
    createdAt: signup.createdAt,
  };
}

function createPublicMarketingSignup(payload) {
  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '');

  if (!name || !email || !password) {
    return { error: 'name, email and password required', status: 400 };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Invalid email', status: 400 };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters', status: 400 };
  }

  const existing = repo.findMarketingSignupByEmail(email);
  if (existing) {
    const credentials = repo.findMarketingSignupCredentialsByEmail(email);
    if (!credentials || !bcrypt.compareSync(password, credentials.passwordHash || '')) {
      return { error: 'Email already registered', status: 409 };
    }
    return { data: publicSignupResponse(credentials) };
  }

  const signup = repo.createMarketingSignup({
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
  });

  return { data: publicSignupResponse(signup) };
}

function decodeMarketingSignupToken(token) {
  if (!token) {
    return { error: 'Marketing signup required before submitting form', status: 401 };
  }

  let decoded = null;
  try {
    decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
  } catch {
    return { error: 'Marketing signup expired. Please sign up again.', status: 401 };
  }

  if (decoded?.type !== 'marketing_signup' || !decoded.signupId || !decoded.email) {
    return { error: 'Invalid marketing signup', status: 401 };
  }

  const signup = repo.findMarketingSignupById(decoded.signupId);
  if (!signup || String(signup.email || '').toLowerCase() !== String(decoded.email || '').toLowerCase()) {
    return { error: 'Invalid marketing signup', status: 401 };
  }

  return { signup };
}

function verifyMarketingSignup(payload) {
  const token = String(payload?.marketingSignupToken || '').trim();
  const result = decodeMarketingSignupToken(token);
  if (result.error) return result;
  return null;
}

function loginPublicMarketingSignup(payload) {
  const email = String(payload?.email || payload?.username || '').trim().toLowerCase();
  const password = String(payload?.password || '');

  if (!email || !password) {
    return { error: 'email and password required', status: 400 };
  }

  const signup = repo.findMarketingSignupCredentialsByEmail(email);
  if (!signup || !bcrypt.compareSync(password, signup.passwordHash || '')) {
    return { error: 'Invalid email or password', status: 401 };
  }

  return { data: publicSignupResponse(signup) };
}

async function getPublicMarketingSession(authorization = '') {
  const token = String(authorization || '').startsWith('Bearer ')
    ? String(authorization).slice(7)
    : String(authorization || '');
  const result = decodeMarketingSignupToken(token.trim());
  if (result.error) return result;
  const signup = result.signup;
  const email = String(signup.email || '').toLowerCase();
  const orderItems = repo.listOrders()
    .filter((order) => String(order.email || '').toLowerCase() === email)
    .slice(0, 10);
  const orders = await Promise.all(orderItems.map(async (order) => {
      const status = String(order.status || 'PENDING').toUpperCase();
      return {
        orderCode: order.orderCode || order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        packageTier: order.packageTier,
        requestedStoreCount: order.requestedStoreCount,
        requestedDeviceCount: order.requestedDeviceCount,
        companyName: order.companyName,
        customerName: order.customerName,
        amount: order.amount,
        nextStep: publicOrderNextStep(status),
        message: publicOrderMessage(status),
        account: await publicOrderAccountInfo(order),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    }));
  const salesLeads = repo.listSalesLeads()
    .filter((lead) => String(lead.email || '').toLowerCase() === email)
    .slice(0, 10);
  return {
    data: {
      ...publicSignupResponse(signup),
      orders,
      salesLeads,
    },
  };
}

async function publicOrderAccountInfo(order) {
  const status = String(order.status || '').toUpperCase();
  if (!order.tenantId || !['ACTIVE', 'COMPLETED'].includes(status)) return null;

  const account = repo.listAccounts().find((item) => (
    String(item.tenantId) === String(order.tenantId)
    && String(item.email || '').toLowerCase() === String(order.email || '').toLowerCase()
  ));
  if (!account) return null;

  const authUser = await getInternalOwnerByPlatformAccount(account.id);
  const activationUsable = Boolean(authUser?.activationUsable);
  const activationLink = account.activationToken && activationUsable
    ? `${config.PORTAL_ORIGIN}/activate?token=${encodeURIComponent(account.activationToken)}`
    : null;

  return {
    name: account.name,
    email: authUser?.email || account.email,
    username: authUser?.username || account.email,
    role: authUser?.role || account.role,
    status: authUser?.isActive ? 'active' : account.status,
    isActive: Boolean(authUser?.isActive),
    activationUsedAt: authUser?.activationUsedAt || null,
    activationExpiresAt: authUser?.activationExpiresAt || null,
    portalUrl: config.PORTAL_ORIGIN,
    activationLink,
    passwordHint: activationLink
      ? 'Chủ cửa hàng tự đặt mật khẩu qua link kích hoạt.'
      : 'Dùng mật khẩu đã đặt khi kích hoạt tài khoản Portal.',
  };
}

async function getInternalOwnerByPlatformAccount(platformAccountId) {
  try {
    const response = await fetch(`${config.AUTH_SERVICE_URL}/internal/auth/platform-accounts/${encodeURIComponent(platformAccountId)}/owner`, {
      headers: {
        'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function createPublicOrder(payload) {
  const signupError = verifyMarketingSignup(payload);
  if (signupError) return signupError;

  const customerName = String(payload?.customerName || payload?.contactName || '').trim();
  const companyName = String(payload?.companyName || payload?.businessName || payload?.restaurantName || '').trim();
  const email = String(payload?.email || '').trim();
  const phone = String(payload?.phone || '').trim();
  const packageTier = normalizePackageTier(payload?.package || payload?.packageTier || payload?.packageCode);
  const requestedStoreCount = Number(payload?.requestedStoreCount || payload?.requestedStores || 1);
  const requestedDeviceCount = Number(payload?.requestedDeviceCount || 1);
  const businessType = String(payload?.businessType || '').trim();
  const note = String(payload?.note || payload?.message || '').trim();

  if (!customerName || !companyName || !email || !phone || !packageTier) {
    return { error: 'customerName, companyName, email, phone and package required', status: 400 };
  }
  if (!Number.isInteger(requestedStoreCount) || requestedStoreCount < 1) {
    return { error: 'requestedStoreCount invalid', status: 400 };
  }
  if (!Number.isInteger(requestedDeviceCount) || requestedDeviceCount < 0) {
    return { error: 'requestedDeviceCount invalid', status: 400 };
  }

  const pkg = repo.findPackageById(packageTier);
  if (!pkg) return { error: 'Package not found', status: 404 };

  const orderType = packageTier === 'plus' && requestedStoreCount === 1 ? 'STANDARD' : 'MANAGED';
  const order = repo.createPurchaseOrder({
    customerName,
    companyName,
    email,
    phone,
    packageTier,
    requestedStoreCount,
    requestedDeviceCount,
    businessType,
    note,
    orderType,
  });

  return {
    data: {
      orderCode: order.orderCode,
      status: order.status,
      nextStep: publicOrderNextStep(String(order.status || 'PENDING').toUpperCase()),
      message: publicOrderMessage(String(order.status || 'PENDING').toUpperCase()),
      createdAt: order.createdAt,
    },
  };
}

function getPublicOrderStatus(orderCode) {
  const order = repo.findOrderById(String(orderCode || '').trim());
  if (!order) return { error: 'Order not found', status: 404 };
  const status = String(order.status || 'PENDING').toUpperCase();
  return {
    data: {
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      packageTier: order.packageTier,
      requestedStoreCount: order.requestedStoreCount,
      nextStep: publicOrderNextStep(status),
      message: publicOrderMessage(status),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  };
}

function publicOrderNextStep(status) {
  const steps = {
    PENDING: 'Admin review',
    CONTACTED: 'Sales qualification',
    QUOTED: 'Quote confirmation',
    WAITING_PAYMENT: 'Payment confirmation',
    PAID: 'Platform approval',
    APPROVED: 'Tenant provisioning',
    PROVISIONING: 'Tenant provisioning',
    ACTIVE: 'Ready to activate',
    REJECTED: 'Request closed',
    CANCELLED: 'Request cancelled',
  };
  return steps[status] || 'Admin review';
}

function publicOrderMessage(status) {
  if (status === 'ACTIVE') return 'Your POS workspace is ready. Please check the activation instructions from our team.';
  if (['REJECTED', 'CANCELLED'].includes(status)) return 'This request is closed. Contact sales if you need help reopening it.';
  if (['WAITING_PAYMENT', 'PAID'].includes(status)) return 'We are validating payment and preparing the next activation step.';
  return 'We have received your request and will contact you with the next step.';
}

function createPublicSalesLead(payload) {
  const signupError = verifyMarketingSignup(payload);
  if (signupError) return signupError;

  const name = String(payload?.name || '').trim();
  const phone = String(payload?.phone || '').trim();
  const email = String(payload?.email || '').trim();
  const message = String(payload?.message || '').trim();

  if (!name || !phone) {
    return { error: 'name and phone required', status: 400 };
  }

  const lead = repo.createSalesLead({ name, phone, email, message });
  return {
    data: {
      leadCode: lead.id,
      status: lead.status,
      createdAt: lead.createdAt,
    },
  };
}

function updateSalesLeadStatus(user, leadId, payload) {
  const access = requirePlatformAdmin(user);
  if (access) return access;

  const status = String(payload?.status || '').trim().toUpperCase();
  const allowed = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'];
  if (!allowed.includes(status)) {
    return { error: 'Invalid sales lead status', status: 400 };
  }

  const lead = repo.updateSalesLeadStatus(leadId, status);
  if (!lead) return { error: 'Sales lead not found', status: 404 };
  return { data: lead };
}

function createOrder(user, payload) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const { tenantId, packageTier } = payload || {};
  if (!tenantId || !packageTier) {
    return { error: 'tenantId and packageTier required', status: 400 };
  }
  const packages = repo.listPackages();
  const pkg = packages.find((item) => item.id === packageTier);
  if (!pkg) return { error: 'Package not found', status: 404 };
  return { data: repo.createOrder({ tenantId, packageTier, amount: pkg.price }) };
}

function transitionOrder(user, orderId, nextStatus, extra = {}) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const order = repo.findOrderById(orderId);
  if (!order) return { error: 'Order not found', status: 404 };

  const status = String(nextStatus || '').trim().toUpperCase();
  const transition = orderStatus.validateTransition(order.status, status);
  if (transition) return transition;

  const now = new Date().toISOString();
  const updates = { status };
  if (status === 'CONTACTED') updates.contactedAt = now;
  if (status === 'QUOTED') updates.quotedAt = now;
  if (status === 'WAITING_PAYMENT') updates.paymentStatus = 'PENDING';
  if (status === 'PAID') {
    updates.paymentStatus = 'PAID';
    updates.paidAt = now;
  }
  if (status === 'APPROVED') {
    if (order.paymentStatus !== 'PAID') return { error: 'Payment required before approval', status: 409 };
    updates.approvedBy = user.username || 'platform';
    updates.approvedAt = now;
  }
  if (status === 'REJECTED') {
    updates.rejectedBy = user.username || 'platform';
    updates.rejectedAt = now;
    updates.rejectionReason = String(extra.reason || '').trim();
  }

  return { data: repo.updateOrder(order.id, updates) };
}

function markOrderContacted(user, orderId) {
  return transitionOrder(user, orderId, 'CONTACTED');
}

function quoteOrder(user, orderId) {
  return transitionOrder(user, orderId, 'QUOTED');
}

function waitOrderPayment(user, orderId) {
  return transitionOrder(user, orderId, 'WAITING_PAYMENT');
}

function confirmOrderPayment(user, orderId) {
  return transitionOrder(user, orderId, 'PAID');
}

function approveOrder(user, orderId) {
  return transitionOrder(user, orderId, 'APPROVED');
}

function rejectOrder(user, orderId, payload) {
  if (!String(payload?.reason || '').trim()) {
    return { error: 'Rejection reason required', status: 400 };
  }
  return transitionOrder(user, orderId, 'REJECTED', payload);
}

function cancelOrder(user, orderId) {
  return transitionOrder(user, orderId, 'CANCELLED');
}

function holdOrderProvisioning(user, orderId) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  const order = repo.findOrderById(orderId);
  if (!order) return { error: 'Order not found', status: 404 };
  const status = String(order.status || '').toUpperCase();
  if (!['APPROVED', 'PROVISIONING', 'PROVISIONING_FAILED'].includes(status)) {
    return { error: 'Only approved or provisioning orders can be held', status: 409 };
  }
  return {
    data: repo.updateOrder(order.id, {
      status: 'ON_HOLD',
      provisioningStep: 'ON_HOLD_BY_ADMIN',
      failureReason: null,
    }),
  };
}

async function provisionOrder(user, orderId) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return provisioningService.provisionOrder(orderId, user);
}

function getPermission(user, role) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  return { data: repo.getPermissionRole(role) };
}

function toggleRolePermission(user, role, permission) {
  const access = requirePlatformAdmin(user);
  if (access) return access;
  if (!role || !permission) {
    return { error: 'role and permission required', status: 400 };
  }
  return { data: repo.togglePermission(role, permission) };
}

module.exports = {
  getBootstrap,
  getSummary,
  listTenants,
  createTenant,
  listTrialRequests,
  getMyTrialRequest,
  updateTenantPackage,
  toggleTenantStatus,
  updateTenantStatus,
  listPackages,
  listAccounts,
  inviteAccount,
  resendAccountInvite,
  submitTrialRequest,
  approveTrialRequest,
  rejectTrialRequest,
  listOrders,
  getOrder,
  createPublicOrder,
  createPublicMarketingSignup,
  loginPublicMarketingSignup,
  getPublicMarketingSession,
  getPublicOrderStatus,
  createPublicSalesLead,
  updateSalesLeadStatus,
  createOrder,
  markOrderContacted,
  quoteOrder,
  waitOrderPayment,
  confirmOrderPayment,
  approveOrder,
  rejectOrder,
  cancelOrder,
  holdOrderProvisioning,
  provisionOrder,
  getPermission,
  toggleRolePermission,
};
