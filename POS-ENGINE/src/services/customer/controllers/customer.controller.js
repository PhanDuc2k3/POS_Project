const service = require('../services/customer.service');

function getStoreId(req) {
  return parseInt(req.query.storeId || req.headers['x-store-id'], 10) || 1;
}

async function getMenu(req, res) {
  const result = await service.getMenu(getStoreId(req));
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json(result.data);
}

async function getBootstrap(req, res) {
  const storeId = getStoreId(req);
  const [menu, sessions] = await Promise.all([
    service.getMenu(storeId),
    service.listDiningSessions(storeId, req.query),
  ]);
  if (menu.error) return res.status(menu.status || 400).json({ error: menu.error });
  if (sessions.error) return res.status(sessions.status || 400).json({ error: sessions.error });
  res.json({ menu: menu.data, sessions: sessions.data, storeId });
}

async function getDiningSessions(req, res) {
  const result = await service.listDiningSessions(getStoreId(req), req.query);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json(result.data);
}

async function createDiningSession(req, res) {
  const result = await service.createDiningSession(getStoreId(req), req.body);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.status(201).json(result.data);
}

async function getDiningSession(req, res) {
  const result = await service.getDiningSession(getStoreId(req), req.params.id);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json(result.data);
}

async function createSessionOrder(req, res) {
  const result = await service.createSessionOrder(getStoreId(req), req.params.id, req.body);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.status(201).json(result.data);
}

async function closeDiningSession(req, res) {
  const result = await service.closeDiningSession(getStoreId(req), req.params.id);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json(result.data);
}

module.exports = {
  getBootstrap,
  getMenu,
  getDiningSessions,
  createDiningSession,
  getDiningSession,
  createSessionOrder,
  closeDiningSession,
};
