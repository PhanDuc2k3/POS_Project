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

export async function getOrder(id) {
  return readJson(await apiFetch(`/platform/orders/${id}`));
}

export async function markOrderContacted(id) {
  return readJson(await apiFetch(`/platform/orders/${id}/contact`, { method: 'POST' }));
}

export async function quoteOrder(id) {
  return readJson(await apiFetch(`/platform/orders/${id}/quote`, { method: 'POST' }));
}

export async function waitOrderPayment(id) {
  return readJson(await apiFetch(`/platform/orders/${id}/wait-payment`, { method: 'POST' }));
}

export async function confirmOrderPayment(id) {
  return readJson(await apiFetch(`/platform/orders/${id}/confirm-payment`, { method: 'POST' }));
}

export async function approveOrder(id) {
  return readJson(await apiFetch(`/platform/orders/${id}/approve`, { method: 'POST' }));
}

export async function rejectOrder(id, reason = '') {
  return readJson(await apiFetch(`/platform/orders/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }));
}

export async function cancelOrder(id) {
  return readJson(await apiFetch(`/platform/orders/${id}/cancel`, { method: 'POST' }));
}

export async function provisionOrder(id) {
  return readJson(await apiFetch(`/platform/orders/${id}/provision`, { method: 'POST' }));
}

export async function inviteAccount(tenantId, email, role) {
  return readJson(await apiFetch('/platform/accounts/invite', {
    method: 'POST',
    body: JSON.stringify({ tenantId, email, role }),
  }));
}

export async function approveTrialRequest(id) {
  return readJson(await apiFetch(`/platform/trial-requests/${id}/approve`, {
    method: 'POST',
  }));
}

export async function rejectTrialRequest(id) {
  return readJson(await apiFetch(`/platform/trial-requests/${id}/reject`, {
    method: 'POST',
  }));
}

export async function togglePermission(role, permission) {
  return readJson(await apiFetch(`/platform/permissions/${role}`, {
    method: 'PATCH',
    body: JSON.stringify({ permission }),
  }));
}
