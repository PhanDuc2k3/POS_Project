import { apiFetch } from './api.js';
import { clearSession, getRefreshToken, setSession } from './session.js';

export async function login(username, password, rememberMe = true) {
  const response = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  setSession(data);
  return data.user;
}

export async function getProfile() {
  const response = await apiFetch('/auth/me');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
  return data;
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
  } catch {
    // ignore
  }
  clearSession();
}
