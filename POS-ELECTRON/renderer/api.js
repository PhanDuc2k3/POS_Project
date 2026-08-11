/**
 * POS API Client
 */

const API_URL = 'http://localhost:4000/api';

let accessToken = null;
let refreshToken = null;

function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
}

function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;

  let response = await fetch(API_URL + endpoint, { ...options, headers });

  if (response.status === 401) {
    const body = await response.json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED' && refreshToken) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        headers['Authorization'] = 'Bearer ' + accessToken;
        response = await fetch(API_URL + endpoint, { ...options, headers });
      }
    }
  }
  return response;
}

async function attemptRefresh() {
  try {
    const res = await fetch(API_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch { return false; }
}

async function login(username, password) {
  let deviceInfo = null;
  if (window.posAPI) {
    const info = await window.posAPI.getDeviceInfo();
    const serial = await window.posAPI.getDeviceSerial();
    deviceInfo = {
      clientType: 'pos_app',
      deviceId: serial,
      deviceName: info?.hostname || 'POS Terminal',
      screenResolution: screen.width + 'x' + screen.height,
      platform: info?.platform || 'unknown',
      isElectron: true,
      appVersion: info?.appVersion || null,
    };
  }
  const res = await fetch(API_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, deviceInfo, rememberMe: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

async function getMenu() {
  const res = await apiFetch('/product/menu');
  if (!res.ok) throw new Error('Failed to load menu');
  return res.json();
}

async function getStoreConfig() {
  const res = await apiFetch('/store/pos-config');
  if (!res.ok) throw new Error('Failed to load store config');
  return res.json();
}

async function createOrder(items, paymentMethod, paymentAccountNumber) {
  let deviceId = null;
  let deviceName = null;
  if (window.posAPI) {
    deviceId = await window.posAPI.getDeviceSerial();
    const info = await window.posAPI.getDeviceInfo();
    deviceName = info?.hostname || 'POS';
  }
  const res = await apiFetch('/txn/orders', {
    method: 'POST',
    body: JSON.stringify({ items, paymentMethod, deviceId, deviceName, paymentAccountNumber }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

async function getOrder(orderId) {
  const res = await apiFetch('/txn/orders/' + orderId);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

async function confirmTransferOrder(orderId) {
  const res = await apiFetch('/txn/orders/' + orderId + '/mark-paid', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

async function cancelOrder(orderId) {
  const res = await apiFetch('/txn/orders/' + orderId + '/cancel', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

window.POS_API = {
  login,
  getMenu,
  getStoreConfig,
  createOrder,
  getOrder,
  confirmTransferOrder,
  cancelOrder,
  clearTokens,
  getToken: () => accessToken,
};
