const config = require('../../../shared/config');

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;
  if (!response.ok) {
    return { error: data?.error || 'Request failed', status: response.status };
  }
  return { data };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getMenu(storeId) {
  return fetchJson(`${config.PRODUCT_SERVICE_URL}/product/public/menu?storeId=${storeId || 1}`);
}

function listDiningSessions(storeId, query = {}) {
  const params = new URLSearchParams();
  params.set('storeId', storeId || 1);
  if (query.status) params.set('status', query.status);
  if (query.page) params.set('page', query.page);
  if (query.limit) params.set('limit', query.limit);
  return fetchJson(`${config.TRANSACTION_SERVICE_URL}/txn/public/dining-sessions?${params.toString()}`);
}

function createDiningSession(storeId, body) {
  return fetchJson(`${config.TRANSACTION_SERVICE_URL}/txn/public/dining-sessions?storeId=${storeId || 1}`, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  });
}

function getDiningSession(storeId, id) {
  return fetchJson(`${config.TRANSACTION_SERVICE_URL}/txn/public/dining-sessions/${id}?storeId=${storeId || 1}`);
}

function createSessionOrder(storeId, id, body) {
  return fetchJson(`${config.TRANSACTION_SERVICE_URL}/txn/public/dining-sessions/${id}/orders?storeId=${storeId || 1}`, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  });
}

function closeDiningSession(storeId, id) {
  return fetchJson(`${config.TRANSACTION_SERVICE_URL}/txn/public/dining-sessions/${id}/close?storeId=${storeId || 1}`, {
    method: 'POST',
  });
}

module.exports = {
  getMenu,
  listDiningSessions,
  createDiningSession,
  getDiningSession,
  createSessionOrder,
  closeDiningSession,
};
