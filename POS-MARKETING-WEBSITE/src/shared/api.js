export const API_URL = 'http://localhost:4000/api';

export function getStoredAuth() {
  try {
    return {
      accessToken: localStorage.getItem('pos_marketing_access_token') || '',
      refreshToken: localStorage.getItem('pos_marketing_refresh_token') || '',
    };
  } catch (err) {
    return { accessToken: '', refreshToken: '' };
  }
}

export function setStoredAuth({ accessToken, refreshToken }) {
  localStorage.setItem('pos_marketing_access_token', accessToken || '');
  localStorage.setItem('pos_marketing_refresh_token', refreshToken || '');
}

export function clearStoredAuth() {
  localStorage.removeItem('pos_marketing_access_token');
  localStorage.removeItem('pos_marketing_refresh_token');
}

export function getStoredOrder() {
  try {
    return JSON.parse(localStorage.getItem('pos_marketing_order') || 'null');
  } catch {
    return null;
  }
}

export function setStoredOrder(order) {
  localStorage.setItem('pos_marketing_order', JSON.stringify(order || null));
}

export async function login(payload) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not sign in');
  return data;
}

export async function getMe(accessToken) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load session');
  return data;
}

export async function getMyTrialRequest(accessToken) {
  const response = await fetch(`${API_URL}/platform/trial-requests/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load trial status');
  return data;
}

export async function submitTrialRequest(accessToken, payload) {
  const response = await fetch(`${API_URL}/platform/trial-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not submit trial request');
  return data;
}

export async function submitPublicOrder(payload) {
  const response = await fetch(`${API_URL}/public/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not submit order');
  return data;
}

export async function getPublicOrderStatus(orderCode) {
  const response = await fetch(`${API_URL}/public/orders/${encodeURIComponent(orderCode)}/status`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load order status');
  return data;
}

export async function submitSalesLead(payload) {
  const response = await fetch(`${API_URL}/public/sales-leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not submit contact request');
  return data;
}
