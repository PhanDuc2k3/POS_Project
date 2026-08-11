import { API_URL } from './config';

let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let onTokenRefreshFailed = null;

export function setAuthCallbacks({ onRefreshFailed }) {
  onTokenRefreshFailed = onRefreshFailed;
}

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;

  if (access) localStorage.setItem('accessToken', access);
  else localStorage.removeItem('accessToken');

  if (refresh) localStorage.setItem('refreshToken', refresh);
  else localStorage.removeItem('refreshToken');
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  const data = localStorage.getItem('user');
  return data ? JSON.parse(data) : null;
}

export function storeUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (refreshToken) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        handleAuthFailure();
        throw new Error('Session expired');
      }
    } else {
      handleAuthFailure();
      throw new Error('Unauthorized');
    }
  }

  return response;
}

function handleAuthFailure() {
  clearTokens();
  if (onTokenRefreshFailed) onTokenRefreshFailed();
}

async function attemptRefresh() {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    if (data.user) storeUser(data.user);
    return true;
  } catch {
    return false;
  }
}

export default apiFetch;
