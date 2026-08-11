/**
 * SePay webhook handling for bank transfer auto-confirmation.
 */

const crypto = require('crypto');
const { publish } = require('../../../shared/event-bus');
const orderRepo = require('../repositories/order.repo');

function handleWebhook(payload, headers = {}) {
  const authError = verifyWebhookAuth(payload, headers);
  if (authError) return { error: authError, status: 401 };

  const event = normalizeSePayPayload(payload);
  const inserted = orderRepo.recordPaymentWebhook({
    provider: 'sepay',
    providerEventId: event.providerEventId,
    referenceCode: event.referenceCode,
    paymentCode: event.paymentCode,
    transferAmount: event.transferAmount,
    accountNumber: event.accountNumber,
    transferType: event.transferType,
    status: 'received',
    rawPayload: payload,
  });

  if (!inserted) {
    return { data: { success: true, duplicate: true } };
  }

  const failure = validateEvent(event);
  if (failure) {
    markEventFailed(event, failure);
    return { data: { success: true, ignored: true, reason: failure } };
  }

  const order = orderRepo.findByPaymentCode(event.paymentCode);
  if (!order) {
    markEventFailed(event, 'ORDER_NOT_FOUND');
    return { data: { success: true, matched: false, reason: 'ORDER_NOT_FOUND' } };
  }

  const matchError = validateOrderMatch(order, event);
  if (matchError) {
    markEventFailed(event, matchError, order.id);
    return { data: { success: true, matched: false, reason: matchError, orderId: order.id } };
  }

  if (order.status === 'completed') {
    orderRepo.updatePaymentWebhookStatus('sepay', event.providerEventId, {
      status: 'already_paid',
      orderId: order.id,
    });
    return { data: { success: true, alreadyPaid: true, orderId: order.id } };
  }

  const changed = orderRepo.markPaid(order.id, order.storeId, {
    provider: 'sepay',
    paymentReference: event.referenceCode || event.providerEventId,
    rawPayload: payload,
  });

  if (!changed) {
    markEventFailed(event, 'ORDER_NOT_PENDING', order.id);
    return { data: { success: true, matched: false, reason: 'ORDER_NOT_PENDING', orderId: order.id } };
  }

  const paidOrder = orderRepo.findById(order.id, order.storeId);
  const items = orderRepo.findItems(order.id);
  const orderPayload = { ...paidOrder, items };

  orderRepo.updatePaymentWebhookStatus('sepay', event.providerEventId, {
    status: 'matched',
    orderId: order.id,
  });

  publish('transaction.paid', {
    key: String(order.storeId),
    storeId: order.storeId,
    orderId: order.id,
    orderNumber: paidOrder.orderNumber,
    paymentCode: paidOrder.paymentCode,
    finalTotal: paidOrder.finalTotal,
    paymentMethod: paidOrder.paymentMethod,
    paymentReference: event.referenceCode || event.providerEventId,
    order: orderPayload,
  });
  publish('dashboard.refresh', { key: String(order.storeId), storeId: order.storeId });

  return { data: { success: true, matched: true, orderId: order.id } };
}

function normalizeSePayPayload(payload) {
  const providerEventId = String(payload.id || payload.transaction_id || payload.referenceCode || payload.reference_code || '');
  return {
    providerEventId,
    gateway: payload.gateway || '',
    transactionDate: payload.transactionDate || payload.transaction_date || '',
    accountNumber: String(payload.accountNumber || payload.account_number || ''),
    paymentCode: normalizeCode(payload.code || payload.payment_code || extractPaymentCode(payload.content)),
    content: payload.content || '',
    transferType: payload.transferType || payload.transfer_type || '',
    transferAmount: Number(payload.transferAmount ?? payload.amount ?? 0),
    referenceCode: String(payload.referenceCode || payload.reference_code || providerEventId),
  };
}

function validateEvent(event) {
  if (!event.providerEventId) return 'MISSING_EVENT_ID';
  if (!['in', 'credit'].includes(String(event.transferType).toLowerCase())) return 'NOT_INCOMING_TRANSFER';
  if (!event.paymentCode) return 'MISSING_PAYMENT_CODE';
  if (!event.transferAmount || event.transferAmount <= 0) return 'INVALID_AMOUNT';
  return null;
}

function validateOrderMatch(order, event) {
  if (order.paymentMethod !== 'transfer') return 'ORDER_NOT_TRANSFER';
  if (Math.round(Number(order.finalTotal)) !== Math.round(Number(event.transferAmount))) return 'AMOUNT_MISMATCH';

  const expectedAccount = process.env.SEPAY_ACCOUNT_NUMBER || order.paymentAccountNumber;
  if (expectedAccount && normalizeAccount(expectedAccount) !== normalizeAccount(event.accountNumber)) {
    return 'ACCOUNT_MISMATCH';
  }

  return null;
}

function verifyWebhookAuth(payload, headers) {
  const apiKey = process.env.SEPAY_WEBHOOK_API_KEY;
  const secret = process.env.SEPAY_WEBHOOK_HMAC_SECRET;

  if (secret) {
    const signature = headers['x-sepay-signature'] || headers['x-signature'] || '';
    const timestamp = headers['x-sepay-timestamp'];
    if (timestamp && Math.abs(Date.now() - Number(timestamp) * 1000) > 5 * 60 * 1000) {
      return 'Webhook timestamp expired';
    }
    const body = JSON.stringify(payload || {});
    const expected = crypto.createHmac('sha256', secret).update(timestamp ? `${timestamp}.${body}` : body).digest('hex');
    if (!safeEqual(signature, expected)) return 'Invalid webhook signature';
    return null;
  }

  if (apiKey) {
    const authorization = headers.authorization || '';
    const headerKey = headers['x-api-key'] || headers['x-sepay-api-key'] || '';
    const provided = authorization.replace(/^Apikey\s+/i, '').replace(/^Bearer\s+/i, '') || headerKey;
    if (provided !== apiKey) return 'Invalid webhook API key';
  }

  return null;
}

function markEventFailed(event, error, orderId = null) {
  orderRepo.updatePaymentWebhookStatus('sepay', event.providerEventId, {
    status: 'ignored',
    orderId,
    error,
  });
}

function extractPaymentCode(content) {
  const match = String(content || '').match(/\bPOS[0-9A-Z]{6,24}\b/i);
  return match ? match[0] : '';
}

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function normalizeAccount(value) {
  return String(value || '').replace(/\s+/g, '');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = { handleWebhook, normalizeSePayPayload };
