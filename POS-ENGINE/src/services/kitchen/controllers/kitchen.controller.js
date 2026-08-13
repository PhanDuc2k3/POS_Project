const service = require('../services/kitchen.service');

function getStoreId(req) {
  return parseInt(req.query.storeId || req.headers['x-store-id'], 10) || 1;
}

function send(res, result, created = false) {
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  return created ? res.status(201).json(result.data) : res.json(result.data);
}

async function getBootstrap(req, res) {
  return send(res, await service.bootstrap(getStoreId(req), req.query));
}

async function getSessions(req, res) {
  return send(res, await service.listOpenSessions(getStoreId(req), req.query));
}

async function getSession(req, res) {
  return send(res, await service.getSession(getStoreId(req), req.params.id));
}

module.exports = {
  getBootstrap,
  getSessions,
  getSession,
};
