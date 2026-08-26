import { API_URL, apiFetch } from './api.js';
import { clearSession, getRefreshToken, setSession } from './session.js';

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || 'Request failed');
  return data.data || data;
}

export async function login(username, password, rememberMe = true) {
  const response = await fetch(`${API_URL}/auth/login`, {
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
  return readJson(response);
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

export async function logoutAllDevices() {
  try {
    await readJson(await apiFetch('/auth/logout-all', {
      method: 'POST',
    }));
  } finally {
    clearSession();
  }
}

export async function updateProfile(displayName, email) {
  return readJson(await apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ displayName, email }),
  }));
}

export async function setSecurityQuestion(question, answer, currentPassword) {
  return readJson(await apiFetch('/auth/security-question', {
    method: 'PUT',
    body: JSON.stringify({ question, answer, currentPassword }),
  }));
}

export async function changePassword(currentPassword, newPassword) {
  return readJson(await apiFetch('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  }));
}

export async function requestSecurityQuestion(username) {
  return readJson(await apiFetch('/auth/forgot-password/question', {
    method: 'POST',
    body: JSON.stringify({ username }),
  }));
}

export async function verifySecurityAnswer(username, answer) {
  return readJson(await apiFetch('/auth/forgot-password/verify', {
    method: 'POST',
    body: JSON.stringify({ username, answer }),
  }));
}

export async function resetPassword(resetToken, newPassword) {
  return readJson(await apiFetch('/auth/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword }),
  }));
}

export async function activateAccount(activationToken, newPassword) {
  return readJson(await apiFetch('/auth/activate', {
    method: 'POST',
    body: JSON.stringify({ activationToken, newPassword }),
  }));
}

export async function uploadAvatar(avatar) {
  return readJson(await apiFetch('/auth/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatar }),
  }));
}

export async function deleteAvatar() {
  return readJson(await apiFetch('/auth/avatar', {
    method: 'DELETE',
  }));
}

export async function getSessions() {
  return readJson(await apiFetch('/auth/sessions'));
}

export async function revokeSession(id) {
  return readJson(await apiFetch(`/auth/sessions/${id}`, {
    method: 'DELETE',
  }));
}

export async function getActivity() {
  return readJson(await apiFetch('/auth/activity?limit=12'));
}
