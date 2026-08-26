import { getAccessToken } from './session.js';

export const API_URL = window.POS_API_URL || 'http://localhost:4000/api';

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}
