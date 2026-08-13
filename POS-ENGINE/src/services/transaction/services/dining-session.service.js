/**
 * Dining Session Service - Restaurant session workflow
 */

const { publish } = require('../../../shared/event-bus');
const { nowVietnamSql } = require('../../../shared/time');
const sessionRepo = require('../repositories/dining-session.repo');
const orderRepo = require('../repositories/order.repo');
const orderService = require('./order.service');

function createDiningSession(storeId, fields = {}, actor = {}) {
  const { tableCode, guestCount, note } = fields;
  const session = sessionRepo.create(storeId, {
    tableCode,
    guestCount: normalizePositiveInt(guestCount, 1),
    note: note || null,
    openedById: actor.id || null,
    openedByName: actor.username || null,
  });
  if (!session) return { error: 'Không thể tạo phiên bàn', status: 500 };

  publish('dashboard.refresh', {
    key: String(storeId),
    storeId,
    scope: 'restaurant-session',
  });

  return { data: buildSessionDetail(storeId, session) };
}

function listDiningSessions(storeId, filters = {}) {
  const result = sessionRepo.findAll(storeId, filters);
  return {
    ...result,
    items: result.items.map(session => buildSessionSummary(storeId, session)),
  };
}

function getDiningSession(storeId, id) {
  const session = sessionRepo.findById(id, storeId);
  if (!session) return { error: 'Phiên bàn không tồn tại', status: 404 };
  return { data: buildSessionDetail(storeId, session) };
}

function createSessionOrder(storeId, sessionId, fields = {}, actor = {}) {
  const session = sessionRepo.findById(sessionId, storeId);
  if (!session) return { error: 'Phiên bàn không tồn tại', status: 404 };
  if (session.status !== 'open') return { error: 'Phiên bàn đã đóng', status: 400 };

  const result = orderService.createOrder(storeId, {
    ...fields,
    sourceApp: fields.sourceApp || 'customer',
    serviceMode: 'restaurant',
    diningSessionId: session.sessionCode,
    tableCode: fields.tableCode || session.tableCode || null,
    cashierId: actor.id || fields.cashierId || null,
    cashierName: actor.username || fields.cashierName || null,
  });

  if (result.error) return result;

  publish('transaction.created', {
    key: String(storeId),
    storeId,
    sessionCode: session.sessionCode,
    orderId: result.data.id,
    orderNumber: result.data.orderNumber,
    tableCode: result.data.tableCode || session.tableCode || null,
    serviceMode: 'restaurant',
  });

  return result;
}

function closeDiningSession(storeId, id) {
  const session = sessionRepo.findById(id, storeId);
  if (!session) return { error: 'Phiên bàn không tồn tại', status: 404 };
  if (session.status === 'closed') return { data: buildSessionDetail(storeId, session) };

  sessionRepo.updateStatus(id, storeId, 'closed');
  publish('dashboard.refresh', { key: String(storeId), storeId, scope: 'restaurant-session', sessionId: id });

  const closed = sessionRepo.findById(id, storeId);
  return { data: buildSessionDetail(storeId, closed) };
}

function buildSessionSummary(storeId, session) {
  const orders = orderRepo.findByDiningSessionId(storeId, session.sessionCode);
  const totals = summarizeOrders(orders);
  return {
    ...session,
    orderCount: totals.orderCount,
    totalAmount: totals.totalAmount,
    pendingAmount: totals.pendingAmount,
    paidAmount: totals.paidAmount,
  };
}

function buildSessionDetail(storeId, session) {
  const orders = orderRepo.findByDiningSessionId(storeId, session.sessionCode);
  const totals = summarizeOrders(orders);
  return {
    ...session,
    orders,
    ...totals,
  };
}

function summarizeOrders(orders) {
  return orders.reduce((acc, order) => {
    acc.orderCount += 1;
    acc.totalAmount += Number(order.finalTotal || order.total || 0);
    if (order.status === 'completed') acc.paidAmount += Number(order.finalTotal || order.total || 0);
    else acc.pendingAmount += Number(order.finalTotal || order.total || 0);
    return acc;
  }, { orderCount: 0, totalAmount: 0, pendingAmount: 0, paidAmount: 0 });
}

function normalizePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
  createDiningSession,
  listDiningSessions,
  getDiningSession,
  createSessionOrder,
  closeDiningSession,
};
