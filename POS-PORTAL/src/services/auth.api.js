import { API_URL } from './config';
import {
  apiFetch,
  clearTokens,
  getRefreshToken,
  setTokens,
  storeUser,
} from './client';

export const authAPI = {
  async login(username, password, deviceInfo = null, rememberMe = false) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, deviceInfo, rememberMe }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
    return data;
  },

  async logout() {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      });
    } catch {
      // Logout should still clear local state if the server is unavailable.
    }
    clearTokens();
  },

  async logoutAll() {
    await apiFetch('/auth/logout-all', { method: 'POST' });
    clearTokens();
  },

  async getProfile() {
    const response = await apiFetch('/auth/me');
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  async updateProfile(data) {
    const response = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async setSecurityQuestion(question, answer, currentPassword) {
    const response = await apiFetch('/auth/security-question', {
      method: 'PUT',
      body: JSON.stringify({ question, answer, currentPassword }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async uploadAvatar(base64Data) {
    const response = await apiFetch('/auth/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar: base64Data }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async deleteAvatar() {
    const response = await apiFetch('/auth/avatar', { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getActivity(page = 1, limit = 30) {
    const response = await apiFetch(`/auth/activity?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch activity');
    return response.json();
  },

  async getSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await apiFetch(`/auth/sessions${query ? '?' + query : ''}`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  async revokeSession(sessionId) {
    const response = await apiFetch(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to revoke session');
    return response.json();
  },

  async forgotPasswordQuestion(username) {
    const response = await fetch(`${API_URL}/auth/forgot-password/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async forgotPasswordVerify(username, answer) {
    const response = await fetch(`${API_URL}/auth/forgot-password/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, answer }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async forgotPasswordReset(resetToken, newPassword) {
    const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },
};
