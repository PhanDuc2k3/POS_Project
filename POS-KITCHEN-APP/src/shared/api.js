export const API_BASE = 'http://localhost:4000/api/kitchen';

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
