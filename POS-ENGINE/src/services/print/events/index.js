/**
 * Print Service - Event Subscriptions
 *
 * Subscribes to paid transaction events to auto-print receipts.
 */

const config = require('../config');
const logger = require('../../../shared/logger');
const { subscribe } = require('../../../shared/event-bus');
const { nowVietnamSql } = require('../../../shared/time');
const printService = require('../services/print.service');

/**
 * Fetch store info (best effort) — in production this would call store-service HTTP.
 * For now, populate minimal defaults so the receipt template renders.
 */
function buildStoreContext(storeId) {
  return {
    store: {
      name: process.env.STORE_NAME || 'POS Store',
      address: process.env.STORE_ADDRESS || 'Địa chỉ cửa hàng',
      phone: process.env.STORE_PHONE || '0123 456 789',
    },
  };
}

function buildOrderPayload(event) {
  const e = event.data || event;
  return {
    order: {
      orderNumber: e.orderNumber || e.id || String(e.orderId),
      createdAt: e.createdAt || e.paidAt || nowVietnamSql(),
      items: (e.items || []).map((it) => ({
        name: it.name || it.productName,
        quantity: it.quantity || 1,
        subtotal: it.subtotal || it.total || 0,
      })),
      subtotal: e.subtotal || e.totalBeforeDiscount || 0,
      discount: e.discount || 0,
      tax: e.tax || 0,
      total: e.finalTotal || e.total || e.amount || 0,
      paymentMethod: e.paymentMethod || 'Tiền mặt',
      cashier: e.cashier || 'system',
      customer: e.customerName || e.customer || null,
    },
  };
}

async function handleTransactionCreated(event) {
  if (!config.AUTO_PRINT_ON_ORDER_COMPLETED) return;
  const status = event.status || event.data?.status;
  if (status && status !== 'completed') return;

  const storeId = event.storeId || event.key || 1;
  try {
    await printService.submit({
      storeId,
      type: 'receipt',
      payload: { ...buildStoreContext(storeId), ...buildOrderPayload(event) },
      triggeredBy: 'event:transaction.paid',
    });
  } catch (err) {
    logger.error('Failed to enqueue auto-print', { storeId, error: err.message });
  }
}

async function initSubscriptions() {
  await subscribe('transaction.paid', 'print-service', handleTransactionCreated);
  logger.info('Subscribed to transaction.paid for auto-print');
}

module.exports = { initSubscriptions };
