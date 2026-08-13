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

function listOpenSessions(storeId, query = {}) {
  const params = new URLSearchParams();
  params.set('storeId', storeId || 1);
  params.set('status', query.status || 'open');
  params.set('limit', query.limit || 50);
  if (query.page) params.set('page', query.page);
  return fetchJson(`${config.TRANSACTION_SERVICE_URL}/txn/public/dining-sessions?${params.toString()}`);
}

function getSession(storeId, id) {
  return fetchJson(`${config.TRANSACTION_SERVICE_URL}/txn/public/dining-sessions/${id}?storeId=${storeId || 1}`);
}

async function bootstrap(storeId, query = {}) {
  const sessions = await listOpenSessions(storeId, query);
  if (sessions.error) return sessions;
  const firstId = sessions.data?.items?.[0]?.id;
  const activeSession = firstId ? await getSession(storeId, firstId) : { data: null };
  if (activeSession.error) return activeSession;
  return {
    data: {
      storeId: storeId || 1,
      sessions: sessions.data,
      activeSession: activeSession.data,
    },
  };
}

module.exports = {
  bootstrap,
  listOpenSessions,
  getSession,
};
