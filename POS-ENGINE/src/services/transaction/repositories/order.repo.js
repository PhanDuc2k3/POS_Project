/**
 * Order Repository - DB queries for orders
 */

const { getDatabase, saveDatabase } = require('../database');
const { nowVietnamSql, todayVietnamDate } = require('../../../shared/time');

function create(order) {
  const db = getDatabase();
  db.run(
    `INSERT INTO orders (
       store_id, order_number, total, discount, final_total, payment_method, status, note,
       source_app, service_mode, dining_session_id, table_code,
       device_id, device_name, cashier_id, cashier_name, payment_code, payment_provider, payment_account_number, created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.storeId,
      order.orderNumber,
      order.total,
      order.discount || 0,
      order.finalTotal,
      order.paymentMethod || 'cash',
      order.status || 'completed',
      order.note || null,
      order.sourceApp || 'pos',
      order.serviceMode || 'simple',
      order.diningSessionId || null,
      order.tableCode || null,
      order.deviceId || null,
      order.deviceName || null,
      order.cashierId || null,
      order.cashierName || null,
      order.paymentCode || null,
      order.paymentProvider || null,
      order.paymentAccountNumber || null,
      order.createdAt || nowVietnamSql(),
    ]
  );
  saveDatabase();

  const result = db.exec('SELECT MAX(id) FROM orders WHERE store_id = ?', [order.storeId]);
  return result[0].values[0][0];
}

function createItems(orderId, items) {
  const db = getDatabase();
  for (const item of items) {
    db.run(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, item.productId || null, item.productName, item.quantity, item.unitPrice, item.total, item.note || null]
    );
  }
  saveDatabase();
}

function mapOrderRow(r) {
  return {
    id: r[0],
    storeId: r[1],
    orderNumber: r[2],
    total: r[3],
    discount: r[4],
    finalTotal: r[5],
    paymentMethod: r[6],
    status: r[7],
    note: r[8],
    sourceApp: r[9],
    serviceMode: r[10],
    diningSessionId: r[11],
    tableCode: r[12],
    deviceId: r[13],
    deviceName: r[14],
    cashierId: r[15],
    cashierName: r[16],
    createdAt: r[17],
    paymentCode: r[18],
    paymentProvider: r[19],
    paymentAccountNumber: r[20],
    paidAt: r[21],
    paymentReference: r[22],
  };
}

function findById(id, storeId) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, store_id, order_number, total, discount, final_total, payment_method, status, note,
            source_app, service_mode, dining_session_id, table_code,
            device_id, device_name, cashier_id, cashier_name, created_at, payment_code,
            payment_provider, payment_account_number, paid_at, payment_reference
     FROM orders WHERE id = ? AND store_id = ?`,
    [id, storeId]
  );
  if (!result.length || !result[0].values.length) return null;
  return mapOrderRow(result[0].values[0]);
}

function findByPaymentCode(paymentCode) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, store_id, order_number, total, discount, final_total, payment_method, status, note,
            source_app, service_mode, dining_session_id, table_code,
            device_id, device_name, cashier_id, cashier_name, created_at, payment_code,
            payment_provider, payment_account_number, paid_at, payment_reference
     FROM orders
     WHERE payment_code = ?
     ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, id DESC
     LIMIT 1`,
    [paymentCode]
  );
  if (!result.length || !result[0].values.length) return null;
  return mapOrderRow(result[0].values[0]);
}

function findItems(orderId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, product_id, product_name, quantity, unit_price, total, note FROM order_items WHERE order_id = ?',
    [orderId]
  );
  if (!result.length) return [];
  return result[0].values.map(r => ({
    id: r[0], productId: r[1], productName: r[2], quantity: r[3], unitPrice: r[4], total: r[5], note: r[6],
  }));
}

function findAll(storeId, { status, date, paymentMethod, search, page = 1, limit = 50 } = {}) {
  const db = getDatabase();
  let sql = 'SELECT id, order_number, total, discount, final_total, payment_method, status, device_name, cashier_name, created_at FROM orders WHERE store_id = ?';
  const params = [storeId];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (date) { sql += ' AND date(created_at) = ?'; params.push(date); }
  if (paymentMethod) { sql += ' AND payment_method = ?'; params.push(paymentMethod); }
  if (search) { sql += ' AND (order_number LIKE ? OR CAST(final_total AS TEXT) LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) FROM');
  const countResult = db.exec(countSql, params);
  const total = countResult[0]?.values[0]?.[0] || 0;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const result = db.exec(sql, params);
  const items = result.length ? result[0].values.map(r => ({
    id: r[0], orderNumber: r[1], total: r[2], discount: r[3], finalTotal: r[4],
    paymentMethod: r[5], status: r[6], deviceName: r[7], cashierName: r[8], createdAt: r[9],
  })) : [];

  return { items, total, page: parseInt(page), limit: parseInt(limit) };
}

function updateStatus(id, storeId, status) {
  const db = getDatabase();
  db.run('UPDATE orders SET status = ? WHERE id = ? AND store_id = ?', [status, id, storeId]);
  saveDatabase();
}

function markPaid(id, storeId, { paymentReference, rawPayload, provider = 'manual' } = {}) {
  const db = getDatabase();
  db.run(
    `UPDATE orders
     SET status = 'completed',
         paid_at = ?,
         payment_reference = ?,
         payment_raw = ?,
         payment_provider = COALESCE(payment_provider, ?)
     WHERE id = ? AND store_id = ? AND status = 'pending'`,
    [nowVietnamSql(), paymentReference || null, rawPayload ? JSON.stringify(rawPayload) : null, provider, id, storeId]
  );
  const changed = getChanges(db) > 0;
  saveDatabase();
  return changed;
}

function recordPaymentWebhook(event) {
  const db = getDatabase();
  try {
    db.run(
      `INSERT INTO payment_webhook_events (
         provider, provider_event_id, reference_code, payment_code, transfer_amount,
         account_number, transfer_type, status, order_id, error, raw_payload
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.provider,
        event.providerEventId || null,
        event.referenceCode || null,
        event.paymentCode || null,
        event.transferAmount || null,
        event.accountNumber || null,
        event.transferType || null,
        event.status || 'received',
        event.orderId || null,
        event.error || null,
        JSON.stringify(event.rawPayload || {}),
      ]
    );
    saveDatabase();
    return true;
  } catch (e) {
    return false;
  }
}

function updatePaymentWebhookStatus(provider, providerEventId, fields) {
  const db = getDatabase();
  const updates = [];
  const params = [];
  if (fields.status !== undefined) { updates.push('status = ?'); params.push(fields.status); }
  if (fields.orderId !== undefined) { updates.push('order_id = ?'); params.push(fields.orderId); }
  if (fields.error !== undefined) { updates.push('error = ?'); params.push(fields.error); }
  if (!updates.length || !providerEventId) return false;
  params.push(provider, providerEventId);
  db.run(
    `UPDATE payment_webhook_events SET ${updates.join(', ')} WHERE provider = ? AND provider_event_id = ?`,
    params
  );
  saveDatabase();
  return true;
}

function getChanges(db) {
  const result = db.exec('SELECT changes()');
  return result[0]?.values[0]?.[0] || 0;
}

function countTodayOrders(storeId) {
  const db = getDatabase();
  const today = todayVietnamDate();
  const result = db.exec(
    "SELECT COUNT(*) FROM orders WHERE store_id = ? AND date(created_at) = ?",
    [storeId, today]
  );
  return result[0]?.values[0]?.[0] || 0;
}

function findRecentWithItems(storeId, limit = 20) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT o.id, o.order_number, o.total, o.discount, o.final_total, o.payment_method, o.status,
            o.device_name, o.cashier_name, o.created_at
     FROM orders o
     WHERE o.store_id = ?
     ORDER BY o.created_at DESC
     LIMIT ?`,
    [storeId, parseInt(limit)]
  );
  if (!result.length) return [];

  const orders = result[0].values.map(r => ({
    id: r[0], orderNumber: r[1], total: r[2], discount: r[3], finalTotal: r[4],
    paymentMethod: r[5], status: r[6], deviceName: r[7], cashierName: r[8], createdAt: r[9],
  }));

  for (const order of orders) {
    const itemsResult = db.exec(
      'SELECT product_name, quantity, unit_price, total FROM order_items WHERE order_id = ?',
      [order.id]
    );
    order.items = itemsResult.length
      ? itemsResult[0].values.map(ir => ({
          name: ir[0], quantity: ir[1], price: ir[2], total: ir[3],
        }))
      : [];
  }

  return orders;
}

function findByDiningSessionId(storeId, diningSessionId) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, order_number, total, discount, final_total, payment_method, status, note,
            source_app, service_mode, dining_session_id, table_code,
            device_name, cashier_name, created_at
     FROM orders
     WHERE store_id = ? AND dining_session_id = ?
     ORDER BY created_at ASC`,
    [storeId, diningSessionId]
  );
  if (!result.length) return [];
  return result[0].values.map(r => ({
    id: r[0],
    orderNumber: r[1],
    total: r[2],
    discount: r[3],
    finalTotal: r[4],
    paymentMethod: r[5],
    status: r[6],
    note: r[7],
    sourceApp: r[8],
    serviceMode: r[9],
    diningSessionId: r[10],
    tableCode: r[11],
    deviceName: r[12],
    cashierName: r[13],
    createdAt: r[14],
  }));
}

module.exports = {
  create,
  createItems,
  findById,
  findByPaymentCode,
  findItems,
  findAll,
  updateStatus,
  markPaid,
  recordPaymentWebhook,
  updatePaymentWebhookStatus,
  countTodayOrders,
  findRecentWithItems,
  findByDiningSessionId,
};
