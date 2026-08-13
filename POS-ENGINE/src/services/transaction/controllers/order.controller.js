/**
 * Order Controller - HTTP handlers for transactions
 */

const orderService = require('../services/order.service');
const { getUserFromHeaders } = require('../helpers/request.helper');

function createOrder(req, res) {
  const user = getUserFromHeaders(req);
  const storeId = parseInt(req.headers['x-store-id']) || 1; // Default store 1 for single-store setup

  const result = orderService.createOrder(storeId, {
    ...req.body,
    cashierId: user.id,
    cashierName: user.username,
  });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
}

function getOrder(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const result = orderService.getOrder(parseInt(req.params.id), storeId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function getOrders(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const { status, date, paymentMethod, search, page, limit } = req.query;
  const result = orderService.getOrders(storeId, { status, date, paymentMethod, search, page, limit });
  res.json(result);
}

function cancelOrder(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const result = orderService.cancelOrder(parseInt(req.params.id), storeId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function refundOrder(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const result = orderService.refundOrder(parseInt(req.params.id), storeId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function markOrderPaid(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const result = orderService.markOrderPaid(parseInt(req.params.id), storeId, {
    provider: 'manual',
    paymentReference: 'manual-confirm',
  });
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function getRecentOrders(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const result = orderService.getRecentOrders(storeId, req.query.limit);
  res.json(result);
}

module.exports = { createOrder, getOrder, getOrders, cancelOrder, markOrderPaid, refundOrder, getRecentOrders };
