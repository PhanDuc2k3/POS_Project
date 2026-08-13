const service = require('../services/platform.service');

function getUser(req) {
  return {
    id: req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null,
    role: req.headers['x-user-role'] || null,
    username: req.headers['x-user-name'] || null,
  };
}

function send(res, result, created = false) {
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  return created ? res.status(201).json(result.data) : res.json(result.data);
}

function getBootstrap(req, res) {
  return send(res, service.getBootstrap(getUser(req)));
}

function getSummary(req, res) {
  return send(res, service.getSummary(getUser(req)));
}

function getTenants(req, res) {
  return send(res, service.listTenants(getUser(req)));
}

function updateTenantPackage(req, res) {
  return send(res, service.updateTenantPackage(getUser(req), parseInt(req.params.id, 10), req.body));
}

function toggleTenantStatus(req, res) {
  return send(res, service.toggleTenantStatus(getUser(req), parseInt(req.params.id, 10)));
}

function getPackages(req, res) {
  return send(res, service.listPackages(getUser(req)));
}

function getAccounts(req, res) {
  return send(res, service.listAccounts(getUser(req)));
}

function inviteAccount(req, res) {
  return send(res, service.inviteAccount(getUser(req), req.body), true);
}

function getOrders(req, res) {
  return send(res, service.listOrders(getUser(req)));
}

function createOrder(req, res) {
  return send(res, service.createOrder(getUser(req), req.body), true);
}

function getPermission(req, res) {
  return send(res, service.getPermission(getUser(req), req.params.role));
}

function togglePermission(req, res) {
  return send(res, service.toggleRolePermission(getUser(req), req.params.role, req.body.permission));
}

module.exports = {
  getBootstrap,
  getSummary,
  getTenants,
  updateTenantPackage,
  toggleTenantStatus,
  getPackages,
  getAccounts,
  inviteAccount,
  getOrders,
  createOrder,
  getPermission,
  togglePermission,
};
