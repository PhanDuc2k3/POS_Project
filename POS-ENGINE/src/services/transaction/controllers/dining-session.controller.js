/**
 * Dining Session Controller - HTTP handlers for restaurant mode
 */

const { getUserFromHeaders } = require('../helpers/request.helper');
const diningSessionService = require('../services/dining-session.service');

function getStoreId(req) {
  return parseInt(req.headers['x-store-id'] || req.query.storeId) || 1;
}

function getDiningSessions(req, res) {
  const storeId = getStoreId(req);
  const { status, page, limit } = req.query;
  const result = diningSessionService.listDiningSessions(storeId, { status, page, limit });
  res.json(result);
}

function createDiningSession(req, res) {
  const storeId = getStoreId(req);
  const user = getUserFromHeaders(req);
  const result = diningSessionService.createDiningSession(storeId, req.body, user);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
}

function getDiningSession(req, res) {
  const storeId = getStoreId(req);
  const result = diningSessionService.getDiningSession(storeId, parseInt(req.params.id));
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function createSessionOrder(req, res) {
  const storeId = getStoreId(req);
  const user = getUserFromHeaders(req);
  const result = diningSessionService.createSessionOrder(storeId, parseInt(req.params.id), req.body, user);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
}

function closeDiningSession(req, res) {
  const storeId = getStoreId(req);
  const result = diningSessionService.closeDiningSession(storeId, parseInt(req.params.id));
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function getPublicDiningSessions(req, res) {
  const storeId = getStoreId(req);
  const { status, page, limit } = req.query;
  const result = diningSessionService.listDiningSessions(storeId, { status, page, limit });
  res.json(result);
}

function createPublicDiningSession(req, res) {
  const storeId = getStoreId(req);
  const result = diningSessionService.createDiningSession(storeId, req.body, {});
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
}

function getPublicDiningSession(req, res) {
  const storeId = getStoreId(req);
  const result = diningSessionService.getDiningSession(storeId, parseInt(req.params.id));
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function createPublicSessionOrder(req, res) {
  const storeId = getStoreId(req);
  const result = diningSessionService.createSessionOrder(storeId, parseInt(req.params.id), req.body, {});
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
}

function closePublicDiningSession(req, res) {
  const storeId = getStoreId(req);
  const result = diningSessionService.closeDiningSession(storeId, parseInt(req.params.id));
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

module.exports = {
  getDiningSessions,
  createDiningSession,
  getDiningSession,
  createSessionOrder,
  closeDiningSession,
  getPublicDiningSessions,
  createPublicDiningSession,
  getPublicDiningSession,
  createPublicSessionOrder,
  closePublicDiningSession,
};
