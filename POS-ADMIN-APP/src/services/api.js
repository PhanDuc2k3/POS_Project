import { clearSession, getAccessToken, getRefreshToken, setSession } from './session.js';

export const API_URL = window.POS_API_URL || 'http://localhost:4000/api';

let refreshPromise = null;

function buildHeaders(options = {}, accessToken = getAccessToken()) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function readRefreshResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Session expired');
  }
  return data.data || data;
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(readRefreshResponse)
      .then((session) => {
        setSession(session);
        return session.accessToken || null;
      })
      .catch((err) => {
        clearSession();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(path, options = {}, retryOnUnauthorized = true) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (response.status !== 401 || !retryOnUnauthorized || path === '/auth/refresh') {
    return response;
  }

  try {
    const accessToken = await refreshSession();
    if (!accessToken) return response;

    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: buildHeaders(options, accessToken),
    });
  } catch {
    return response;
  }
}
