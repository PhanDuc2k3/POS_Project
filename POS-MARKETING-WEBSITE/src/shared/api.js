export const API_URL = window.POS_API_URL || 'http://localhost:4000/api';

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

export async function registerMarketingSignup(payload) {
  const response = await fetch(`${API_URL}/public/marketing-signups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not register');
  return data;
}

export async function loginMarketingSignup(payload) {
  const response = await fetch(`${API_URL}/public/marketing-signups/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not sign in');
  return data;
}

export async function getMarketingSession(signupToken) {
  const response = await fetch(`${API_URL}/public/marketing-signups/session`, {
    headers: { Authorization: `Bearer ${signupToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load marketing session');
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

export async function submitSupportTicket(payload) {
  const response = await fetch(`${API_URL}/public/support-tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not submit support ticket');
  return data;
}
