import { apiFetch } from './api.js';

async function readJson(response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function bootstrap() {
  return readJson(await apiFetch('/platform/bootstrap'));
}

export async function updateTenantPackage(id, packageTier, operatingMode) {
  return readJson(await apiFetch(`/platform/tenants/${id}/package`, {
    method: 'PUT',
    body: JSON.stringify({ packageTier, operatingMode }),
  }));
}

export async function toggleTenantStatus(id) {
  return readJson(await apiFetch(`/platform/tenants/${id}/toggle-status`, {
    method: 'POST',
  }));
}

export async function createOrder(tenantId, packageTier) {
  return readJson(await apiFetch('/platform/orders', {
    method: 'POST',
    body: JSON.stringify({ tenantId, packageTier }),
  }));
}

export async function inviteAccount(tenantId, email, role) {
  return readJson(await apiFetch('/platform/accounts/invite', {
    method: 'POST',
    body: JSON.stringify({ tenantId, email, role }),
  }));
}

export async function togglePermission(role, permission) {
  return readJson(await apiFetch(`/platform/permissions/${role}`, {
    method: 'PATCH',
    body: JSON.stringify({ permission }),
  }));
}
