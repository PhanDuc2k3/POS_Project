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
  updateTenantPackage,
  toggleTenantStatus,
  listPackages,
  listAccounts,
  inviteAccount,
  listOrders,
  createOrder,
  getPermission,
  toggleRolePermission,
};
