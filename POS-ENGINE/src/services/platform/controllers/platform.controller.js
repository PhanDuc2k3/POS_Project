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

function getTrialRequests(req, res) {
  return send(res, service.listTrialRequests(getUser(req)));
}

function getMyTrialRequest(req, res) {
  return send(res, service.getMyTrialRequest(getUser(req)));
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

function submitTrialRequest(req, res) {
  return send(res, service.submitTrialRequest({ ...req.body, submittedByUserId: getUser(req).id, submittedByUsername: getUser(req).username }), true);
}

function approveTrialRequest(req, res) {
  return send(res, service.approveTrialRequest(getUser(req), req.params.id), true);
}

function rejectTrialRequest(req, res) {
  return send(res, service.rejectTrialRequest(getUser(req), req.params.id), true);
}

function getOrders(req, res) {
  return send(res, service.listOrders(getUser(req)));
}

function getOrder(req, res) {
  return send(res, service.getOrder(getUser(req), req.params.id));
}

function createPublicOrder(req, res) {
  return send(res, service.createPublicOrder(req.body), true);
}

function getPublicOrderStatus(req, res) {
  return send(res, service.getPublicOrderStatus(req.params.orderCode));
}

function createPublicSalesLead(req, res) {
  return send(res, service.createPublicSalesLead(req.body), true);
}

function createOrder(req, res) {
  return send(res, service.createOrder(getUser(req), req.body), true);
}

function markOrderContacted(req, res) {
  return send(res, service.markOrderContacted(getUser(req), req.params.id));
}

function quoteOrder(req, res) {
  return send(res, service.quoteOrder(getUser(req), req.params.id));
}

function waitOrderPayment(req, res) {
  return send(res, service.waitOrderPayment(getUser(req), req.params.id));
}

function confirmOrderPayment(req, res) {
  return send(res, service.confirmOrderPayment(getUser(req), req.params.id));
}

function approveOrder(req, res) {
  return send(res, service.approveOrder(getUser(req), req.params.id));
}

function rejectOrder(req, res) {
  return send(res, service.rejectOrder(getUser(req), req.params.id, req.body));
}

function cancelOrder(req, res) {
  return send(res, service.cancelOrder(getUser(req), req.params.id));
}

async function provisionOrder(req, res) {
  return send(res, await service.provisionOrder(getUser(req), req.params.id), true);
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
  getTrialRequests,
  getMyTrialRequest,
  updateTenantPackage,
  toggleTenantStatus,
  getPackages,
  getAccounts,
  inviteAccount,
  submitTrialRequest,
  approveTrialRequest,
  rejectTrialRequest,
  getOrders,
  getOrder,
  createPublicOrder,
  getPublicOrderStatus,
  createPublicSalesLead,
  createOrder,
  markOrderContacted,
  quoteOrder,
  waitOrderPayment,
  confirmOrderPayment,
  approveOrder,
  rejectOrder,
  cancelOrder,
  provisionOrder,
  getPermission,
  togglePermission,
};
