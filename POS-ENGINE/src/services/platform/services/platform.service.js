const repo = require('../repositories/platform.repo');

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
  const tenant = repo.updateTenantPackage(tenantId, packageTier, operatingMode);
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
  listTrialRequests,
  getMyTrialRequest,
  updateTenantPackage,
  toggleTenantStatus,
  listPackages,
  listAccounts,
  inviteAccount,
  submitTrialRequest,
  approveTrialRequest,
  rejectTrialRequest,
  listOrders,
  createOrder,
  getPermission,
  toggleRolePermission,
};
