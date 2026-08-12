/**
 * Order Service - Business logic for creating/managing orders
 */

const { publish } = require('../../../shared/event-bus');
const { nowVietnamSql } = require('../../../shared/time');
const { generateOrderNumber } = require('../models/order.model');
const orderRepo = require('../repositories/order.repo');

function createOrder(storeId, { items, paymentMethod, discount, note, deviceId, deviceName, cashierId, cashierName, paymentAccountNumber }) {
  if (!items || !items.length) {
    return { error: 'Đơn hàng phải có ít nhất 1 sản phẩm', status: 400 };
  }

  // Calculate totals
  const orderItems = items.map(item => ({
    productId: item.productId || null,
    productName: item.productName || item.name,
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || item.price,
    total: (item.quantity || 1) * (item.unitPrice || item.price),
    note: item.note || null,
  }));

  const total = orderItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discount || 0;
  const finalTotal = total - discountAmount;

  if (finalTotal < 0) {
    return { error: 'Tổng đơn hàng không thể âm', status: 400 };
  }

  // Generate order number
  const todayCount = orderRepo.countTodayOrders(storeId);
  const orderNumber = generateOrderNumber(todayCount + 1);
  const normalizedPaymentMethod = paymentMethod || 'cash';
  const isTransfer = normalizedPaymentMethod === 'transfer';
  const paymentCode = isTransfer ? generatePaymentCode(orderNumber) : null;
  const createdAt = nowVietnamSql();

  // Create order
  const orderId = orderRepo.create({
    storeId,
    orderNumber,
    total,
    discount: discountAmount,
    finalTotal,
    paymentMethod: normalizedPaymentMethod,
    status: isTransfer ? 'pending' : 'completed',
    note: note || null,
    deviceId,
    deviceName,
    cashierId,
    cashierName,
    paymentCode,
    paymentProvider: isTransfer ? 'sepay' : null,
    paymentAccountNumber: paymentAccountNumber || null,
    createdAt,
  });

  // Create items
  orderRepo.createItems(orderId, orderItems);

  // Publish event
  publish('transaction.created', {
    key: String(storeId),
    storeId,
    orderId,
    orderNumber,
    paymentCode,
    finalTotal,
    paymentMethod: normalizedPaymentMethod,
    status: isTransfer ? 'pending' : 'completed',
    itemCount: orderItems.length,
  });

  if (!isTransfer) {
    const payload = {
      id: orderId,
      orderNumber,
      total,
      discount: discountAmount,
      finalTotal,
      paymentMethod: normalizedPaymentMethod,
      status: 'completed',
      items: orderItems,
      createdAt,
      deviceId,
      deviceName,
      cashierId,
      cashierName,
    };

    publish('transaction.paid', {
      key: String(storeId),
      storeId,
      orderId,
      orderNumber,
      finalTotal,
      paymentMethod: normalizedPaymentMethod,
      paymentReference: 'cash',
      order: payload,
    });
    publish('dashboard.refresh', { key: String(storeId), storeId });
  }

  return {
    data: {
      id: orderId,
      orderNumber,
      total,
      discount: discountAmount,
      finalTotal,
      paymentMethod: normalizedPaymentMethod,
      paymentCode,
      paymentProvider: isTransfer ? 'sepay' : null,
      paymentAccountNumber: paymentAccountNumber || null,
      status: isTransfer ? 'pending' : 'completed',
      items: orderItems,
      createdAt,
    },
  };
}

function getOrder(id, storeId) {
  const order = orderRepo.findById(id, storeId);
  if (!order) return { error: 'Giao dịch không tồn tại', status: 404 };
  const items = orderRepo.findItems(id);
  return { data: { ...order, items } };
}

function getOrders(storeId, filters) {
  return orderRepo.findAll(storeId, filters);
}

function cancelOrder(id, storeId) {
  const order = orderRepo.findById(id, storeId);
  if (!order) return { error: 'Giao dịch không tồn tại', status: 404 };
  if (order.status === 'cancelled') return { error: 'Giao dịch đã bị hủy', status: 400 };

  orderRepo.updateStatus(id, storeId, 'cancelled');
  publish('transaction.cancelled', { key: String(storeId), storeId, orderId: id, orderNumber: order.orderNumber });
  return { data: { message: 'Đã hủy giao dịch' } };
}

function markOrderPaid(id, storeId, { provider = 'manual', paymentReference = 'manual-confirm' } = {}) {
  const order = orderRepo.findById(id, storeId);
  if (!order) return { error: 'Giao dịch không tồn tại', status: 404 };
  if (order.status === 'completed') {
    const items = orderRepo.findItems(id);
    return { data: { ...order, items } };
  }
  if (order.status !== 'pending') {
    return { error: 'Chỉ có thể xác nhận đơn đang chờ thanh toán', status: 400 };
  }

  const changed = orderRepo.markPaid(id, storeId, { provider, paymentReference });
  if (!changed) return { error: 'Không thể xác nhận thanh toán', status: 409 };

  const paidOrder = orderRepo.findById(id, storeId);
  const items = orderRepo.findItems(id);
  const payload = { ...paidOrder, items };

  publish('transaction.paid', {
    key: String(storeId),
    storeId,
    orderId: id,
    orderNumber: paidOrder.orderNumber,
    paymentCode: paidOrder.paymentCode,
    finalTotal: paidOrder.finalTotal,
    paymentMethod: paidOrder.paymentMethod,
    paymentReference,
    order: payload,
  });
  publish('dashboard.refresh', { key: String(storeId), storeId });

  return { data: payload };
}

function refundOrder(id, storeId) {
  const order = orderRepo.findById(id, storeId);
  if (!order) return { error: 'Giao dịch không tồn tại', status: 404 };
  if (order.status !== 'completed') return { error: 'Chỉ có thể hoàn tiền giao dịch đã hoàn thành', status: 400 };

  orderRepo.updateStatus(id, storeId, 'refunded');
  publish('transaction.refunded', { key: String(storeId), storeId, orderId: id, amount: order.finalTotal });
  return { data: { message: 'Đã hoàn tiền giao dịch' } };
}

function getRecentOrders(storeId, limit = 20) {
  const orders = orderRepo.findRecentWithItems(storeId, limit);
  return { items: orders };
}

function generatePaymentCode(orderNumber) {
  return orderNumber.replace(/[^0-9A-Za-z]/g, '').replace(/^ORD/i, 'POS').slice(0, 24);
}

module.exports = { createOrder, getOrder, getOrders, cancelOrder, markOrderPaid, refundOrder, getRecentOrders };
