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
const receiptRepo = require('../../store/repositories/receipt.repo');
const bankRepo = require('../../store/repositories/bank.repo');

const DEFAULT_BLOCKS = ['header','storeInfo','divider','orderInfo','divider','items','total','qr','footer'];

function findStoreById(storeId) {
  const db = require('../../store/database').getDatabase();
  const result = db.exec(
    'SELECT id, owner_id, name, phone, address, logo, created_at, updated_at FROM stores WHERE id = ?',
    [storeId]
  );
  if (!result.length || !result[0].values.length) return null;
  const r = result[0].values[0];
  return {
    id: r[0],
    ownerId: r[1],
    name: r[2],
    phone: r[3],
    address: r[4],
    logo: r[5],
    createdAt: r[6],
    updatedAt: r[7],
  };
}

function buildStoreContext(storeId) {
  const fallbackStore = {
    id: storeId,
    name: process.env.STORE_NAME || 'POS Store',
    address: process.env.STORE_ADDRESS || '',
    phone: process.env.STORE_PHONE || '',
  };

  let store = fallbackStore;
  let receipt = null;
  let bank = null;

  try {
    store = findStoreById(storeId) || fallbackStore;
    receipt = receiptRepo.findByStoreId(storeId);
    bank = bankRepo.findActiveByStoreId(storeId);
  } catch (err) {
    logger.warn('Failed to load store receipt context for print job', { storeId, error: err.message });
  }

  return {
    store,
    bank,
    receipt: receipt || {
      header: store.name,
      footer: 'Xin c\u1ea3m \u01a1n qu\u00fd kh\u00e1ch!',
      showQR: true,
      showLogo: false,
      showTime: true,
      showTxnId: true,
      showStoreInfo: true,
      paperWidth: '58mm',
      blocks: DEFAULT_BLOCKS,
    },
  };
}

function normalizeItem(item) {
  const quantity = Number(item.quantity || 1);
  const total = Number(item.total || item.subtotal || 0);
  const unitPrice = Number(item.unitPrice || item.price || (quantity ? total / quantity : total));

  return {
    ...item,
    productName: item.productName || item.name || '',
    name: item.name || item.productName || '',
    quantity,
    unitPrice,
    total: total || unitPrice * quantity,
  };
}

function buildOrderPayload(event) {
  const e = event.data || event;
  const sourceOrder = e.order || e;
  const items = sourceOrder.items || e.items || [];

  return {
    order: {
      ...sourceOrder,
      id: sourceOrder.id || e.orderId,
      orderNumber: sourceOrder.orderNumber || e.orderNumber || e.id || String(e.orderId || ''),
      createdAt: sourceOrder.createdAt || e.createdAt || e.paidAt || nowVietnamSql(),
      paidAt: sourceOrder.paidAt || e.paidAt || null,
      items: items.map(normalizeItem),
      total: Number(sourceOrder.total || e.total || e.subtotal || e.totalBeforeDiscount || e.finalTotal || e.amount || 0),
      discount: Number(sourceOrder.discount || e.discount || 0),
      finalTotal: Number(sourceOrder.finalTotal || e.finalTotal || e.total || e.amount || 0),
      paymentMethod: sourceOrder.paymentMethod || e.paymentMethod || 'cash',
      cashierName: sourceOrder.cashierName || e.cashierName || e.cashier || 'system',
      customer: sourceOrder.customerName || sourceOrder.customer || e.customerName || e.customer || null,
    },
  };
}

async function handleTransactionPaid(event) {
  if (!config.AUTO_PRINT_ON_ORDER_COMPLETED) return;
  const status = event.status || event.data?.status || event.order?.status || event.data?.order?.status;
  if (status && status !== 'completed') return;

  const storeId = Number(event.storeId || event.data?.storeId || event.key || 1);
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
  await subscribe('transaction.paid', 'print-service', handleTransactionPaid);
  logger.info('Subscribed to transaction.paid for auto-print');
}

module.exports = { initSubscriptions };
