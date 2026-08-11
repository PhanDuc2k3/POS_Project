/**
 * Receipt Formatter
 * Builds a receipt from order data using ESC/POS commands
 */

const { ReceiptBuilder } = require('./escpos');

/**
 * Format receipt for thermal printer
 * @param {Object} order - Order data from API
 * @param {Object} storeConfig - Store info (name, address, phone)
 * @param {Object} receiptConfig - Receipt template settings
 * @returns {Buffer} ESC/POS command buffer
 */
function formatReceipt(order, storeConfig = {}, receiptConfig = {}) {
  const width = receiptConfig.paperWidth === '80mm' ? 48 : 32;
  const receipt = new ReceiptBuilder({ width });

  receipt.init();

  // ─── Header (store name) ───────────────────
  receipt.alignCenter();

  if (receiptConfig.header || storeConfig.name) {
    receipt.bold(true).bigText(true);
    receipt.line(receiptConfig.header || storeConfig.name || 'POS');
    receipt.bigText(false).bold(false);
  }

  if (receiptConfig.showStoreInfo !== false) {
    if (storeConfig.address) receipt.line(storeConfig.address);
    if (storeConfig.phone) receipt.line('DT: ' + storeConfig.phone);
  }

  receipt.emptyLine();
  receipt.alignLeft();
  receipt.divider('=');

  // ─── Order info ────────────────────────────
  if (receiptConfig.showTxnId !== false) {
    receipt.line('Ma: ' + (order.orderNumber || ''));
  }

  if (receiptConfig.showTime !== false) {
    const time = formatVietnamDateTime(order.paidAt || order.createdAt);
    receipt.line('Thoi gian: ' + time);
  }

  if (order.cashierName) {
    receipt.line('Thu ngan: ' + order.cashierName);
  }

  receipt.divider('-');

  // ─── Items ─────────────────────────────────
  const items = order.items || [];
  for (const item of items) {
    const name = item.productName || item.name || '';
    const qty = item.quantity || 1;
    const total = formatMoney(item.unitPrice * qty);

    if (qty > 1) {
      receipt.line(name);
      receipt.leftRight('  ' + qty + ' x ' + formatMoney(item.unitPrice), total);
    } else {
      receipt.leftRight(name, total);
    }
  }

  receipt.divider('-');

  // ─── Totals ────────────────────────────────
  if (order.discount && order.discount > 0) {
    receipt.leftRight('Tam tinh:', formatMoney(order.total));
    receipt.leftRight('Giam gia:', '-' + formatMoney(order.discount));
  }

  receipt.bold(true);
  receipt.leftRight('TONG CONG:', formatMoney(order.finalTotal || order.total));
  receipt.bold(false);

  receipt.emptyLine();

  // Payment method
  const methodLabel = order.paymentMethod === 'transfer' ? 'Chuyen khoan' : 'Tien mat';
  receipt.leftRight('Thanh toan:', methodLabel);

  receipt.divider('=');

  // ─── Footer ────────────────────────────────
  receipt.alignCenter();
  receipt.emptyLine();
  receipt.line(receiptConfig.footer || 'Xin cam on quy khach!');
  receipt.emptyLine();

  // Cut paper
  receipt.feedAndCut(4);

  return receipt.build();
}

function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'd';
}

function formatVietnamDateTime(value) {
  if (!value) return formatVietnamDateTime(new Date());

  const text = String(value);
  const sqlMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (sqlMatch && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)) {
    const [, y, m, d, hh, mm, ss = '00'] = sqlMatch;
    return `${d}/${m}/${y} ${hh}:${mm}:${ss} GMT+7`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date) + ' GMT+7';
}

module.exports = { formatReceipt };
