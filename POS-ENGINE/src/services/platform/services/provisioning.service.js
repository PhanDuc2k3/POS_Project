const repo = require('../repositories/platform.repo');
const orderStatus = require('./order-status.service');
const config = require('../../../shared/config');

const INTERNAL_HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
};

function packageToOperatingMode(packageTier) {
  return packageTier === 'pro' ? 'restaurant' : 'simple';
}

function markFailed(order, step, message) {
  repo.updateOrder(order.id, {
    status: 'PROVISIONING_FAILED',
    provisioningStep: step,
    failureReason: message,
  });
  return { error: message, status: 500 };
}

async function callInternal(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: INTERNAL_HEADERS,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Internal request failed: ${url}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function provisionOrder(orderId, actor) {
  const order = repo.findOrderById(orderId);
  if (!order) return { error: 'Order not found', status: 404 };
  if (order.tenantId) return { error: 'Order already provisioned', status: 409 };

  const transition = orderStatus.validateTransition(order.status, 'PROVISIONING');
  if (transition) return transition;

  const pkg = repo.findPackageById(order.packageTier);
  if (!pkg) return { error: 'Package not found', status: 404 };

  const storeLimit = Number(order.requestedStoreCount || 0);
  if (!Number.isInteger(storeLimit) || storeLimit < 1) {
    return { error: 'requestedStoreCount invalid', status: 400 };
  }

  let current = repo.updateOrder(order.id, {
    status: 'PROVISIONING',
    provisioningStep: 'STARTED',
    failureReason: null,
  });

  try {
    const tenant = repo.createTenant({
      name: order.companyName,
      ownerName: order.customerName,
      ownerEmail: order.email,
      packageTier: order.packageTier,
      operatingMode: packageToOperatingMode(order.packageTier),
      status: 'active',
      renewalDate: null,
    });
    if (!tenant) return markFailed(current, 'TENANT_CREATED', 'Tenant creation failed');

    repo.updateOrder(order.id, { status: 'PROVISIONING', tenantId: tenant.id, provisioningStep: 'TENANT_CREATED' });

    const subscription = repo.createSubscription({
      tenantId: tenant.id,
      packageTier: order.packageTier,
      maxStore: storeLimit,
    });
    if (!subscription) return markFailed(repo.findOrderById(order.id), 'SUBSCRIPTION_CREATED', 'Subscription creation failed');

    const account = repo.createAccount({
      tenantId: tenant.id,
      name: order.customerName,
      email: order.email,
      role: 'store_owner',
      status: 'pending_activation',
    });
    if (!account) return markFailed(repo.findOrderById(order.id), 'OWNER_CREATED', 'Owner account creation failed');

    const store = repo.createTenantStore({
      tenantId: tenant.id,
      ownerAccountId: account.id,
      name: `${order.companyName} - Main Store`,
    });
    if (!store) return markFailed(repo.findOrderById(order.id), 'STORE_CREATED', 'Store creation failed');

    const authProvision = await callInternal(`${config.AUTH_SERVICE_URL}/internal/auth/owners`, {
      email: order.email,
      displayName: order.customerName,
      tenantId: tenant.id,
      platformAccountId: account.id,
    });
    if (!authProvision?.user?.id) {
      return markFailed(repo.findOrderById(order.id), 'OWNER_AUTH_CREATED', 'Auth owner creation failed');
    }

    const storeProvision = await callInternal(`${config.STORE_SERVICE_URL}/internal/stores/provision`, {
      ownerId: authProvision.user.id,
      tenantId: tenant.id,
      platformStoreId: store.id,
      name: store.name,
      packageTier: order.packageTier,
      operatingMode: packageToOperatingMode(order.packageTier),
      maxStore: storeLimit,
    });
    if (!storeProvision?.store?.id) {
      return markFailed(repo.findOrderById(order.id), 'PORTAL_STORE_CREATED', 'Portal store creation failed');
    }

    const activatedAccount = repo.updateAccountActivation(account.id, authProvision.activationToken || null);

    current = repo.updateOrder(order.id, {
      tenantId: tenant.id,
      status: 'ACTIVE',
      provisionedAt: new Date().toISOString(),
      provisioningStep: 'COMPLETED',
      failureReason: null,
    });

    return {
      data: {
        order: current,
        tenant,
        subscription,
        account: activatedAccount || account,
        store,
        authUser: authProvision.user,
        portalStore: storeProvision.store,
        activationEmail: {
          status: authProvision.activationLink ? 'READY' : 'ALREADY_EXISTS',
          portalUrl: 'http://localhost:3000',
          activationLink: authProvision.activationLink,
          sentBy: actor?.username || 'platform',
        },
      },
    };
  } catch (err) {
    return markFailed(repo.findOrderById(order.id) || order, 'FAILED', err.message);
  }
}

module.exports = {
  provisionOrder,
};
