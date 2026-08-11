/**
 * Order Model - Data structures
 *
 * @typedef {Object} Order
 * @property {number} id
 * @property {number} storeId
 * @property {string} orderNumber - VD: "ORD-20240815-001"
 * @property {number} total - Tổng trước giảm giá
 * @property {number} discount - Giảm giá
 * @property {number} finalTotal - Tổng sau giảm giá
 * @property {'cash'|'transfer'|'mixed'} paymentMethod
 * @property {'completed'|'pending'|'cancelled'|'refunded'} status
 * @property {string|null} note
 * @property {string|null} deviceId
 * @property {string|null} deviceName
 * @property {number|null} cashierId
 * @property {string|null} cashierName
 * @property {string} createdAt
 *
 * @typedef {Object} OrderItem
 * @property {number} id
 * @property {number} orderId
 * @property {number|null} productId
 * @property {string} productName
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} total
 * @property {string|null} note
 *
 * @typedef {Object} DashboardStats
 * @property {number} todayRevenue
 * @property {number} todayOrders
 * @property {number} avgOrderValue
 * @property {number} onlineDevices
 *
 * @typedef {Object} HourlyData
 * @property {string} hour
 * @property {number} revenue
 * @property {number} orders
 */

// Order statuses
const ORDER_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment methods
const PAYMENT_METHOD = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  MIXED: 'mixed',
};

/**
 * Generate order number: ORD-YYYYMMDD-XXX
 */
function generateOrderNumber(sequenceToday) {
  const date = todayVietnamCompact();
  const seq = String(sequenceToday).padStart(3, '0');
  return `ORD-${date}-${seq}`;
}

module.exports = { ORDER_STATUS, PAYMENT_METHOD, generateOrderNumber };
const { todayVietnamCompact } = require('../../../shared/time');
