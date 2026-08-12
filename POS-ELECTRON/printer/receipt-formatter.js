/**
 * Receipt Formatter
 * Builds a receipt from order data using ESC/POS commands.
 */

const { ReceiptBuilder } = require('./escpos');

const DEFAULT_BLOCKS = ['header','storeInfo','divider','orderInfo','divider','items','total','qr','footer'];

function formatReceipt(order, storeConfig = {}, receiptConfig = {}) {
  const config = normalizeReceiptConfig(receiptConfig, storeConfig);
  const width = config.paperWidth === '80mm' ? 48 : 32;
  const receipt = new ReceiptBuilder({ width });
  const blocks = Array.isArray(config.blocks) && config.blocks.length ? config.blocks : DEFAULT_BLOCKS;

  receipt.init();

  for (const block of blocks) {
    renderBlock(receipt, block, order || {}, storeConfig || {}, config);
  }

  receipt.emptyLine();
  receipt.feedAndCut(4);
  return receipt.build();
}

function normalizeReceiptConfig(receiptConfig = {}, storeConfig = {}) {
  return {
    ...receiptConfig,
    header: receiptConfig.header || storeConfig.name || 'POS',
    footer: receiptConfig.footer || 'Xin cam on quy khach!',
    paperWidth: receiptConfig.paperWidth || '58mm',
    showQR: receiptConfig.showQR !== false,
    showLogo: receiptConfig.showLogo === true,
    showTime: receiptConfig.showTime !== false,
    showTxnId: receiptConfig.showTxnId !== false,
    showStoreInfo: receiptConfig.showStoreInfo !== false,
  };
}

function renderBlock(receipt, block, order, store, config) {
  switch (block) {
    case 'logo':
      renderLogo(receipt, config);
      break;
    case 'header':
      renderHeader(receipt, config);
      break;
    case 'storeInfo':
      renderStoreInfo(receipt, store, config);
      break;
    case 'divider':
      receipt.alignLeft();
      receipt.divider('-');
      break;
    case 'orderInfo':
      renderOrderInfo(receipt, order, config);
      break;
    case 'items':
      renderItems(receipt, order);
      break;
    case 'total':
      renderTotal(receipt, order);
      break;
    case 'payment':
      renderPayment(receipt, order);
      break;
    case 'qr':
      renderQrText(receipt, order, config);
      break;
    case 'footer':
      renderFooter(receipt, config);
      break;
    default:
      break;
  }
}

function renderLogo(receipt, config) {
  if (!config.showLogo) return;
  receipt.alignCenter();
  receipt.line(config.logoText || '[LOGO]');
  receipt.emptyLine();
}

function renderHeader(receipt, config) {
  receipt.alignCenter();
  receipt.bold(true).bigText(true);
  receipt.line(config.header);
  receipt.bigText(false).bold(false);
}

function renderStoreInfo(receipt, store, config) {
  if (config.showStoreInfo === false) return;
  receipt.alignCenter();
  if (store.name) receipt.bold(true).line(store.name).bold(false);
  if (store.address) receipt.line(store.address);
  if (store.phone) receipt.line('DT: ' + store.phone);
}

function renderOrderInfo(receipt, order, config) {
  receipt.alignLeft();
  if (config.showTxnId !== false) {
    receipt.line(order.orderNumber || order.id || '');
  }
  if (config.showTime !== false) {
    receipt.line(formatVietnamDateTime(order.paidAt || order.createdAt));
  }
  if (order.cashierName) {
    receipt.line('Thu ngan: ' + order.cashierName);
  }
}

function renderItems(receipt, order) {
  receipt.alignLeft();
  const items = order.items || [];
  for (const item of items) {
    const name = item.productName || item.name || '';
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const total = Number(item.total || unitPrice * qty);

    if (qty > 1) {
      receipt.line(name);
      receipt.leftRight('  ' + qty + ' x ' + formatMoney(unitPrice), formatMoney(total));
    } else {
      receipt.leftRight(name, formatMoney(total || unitPrice));
    }
  }
}

function renderTotal(receipt, order) {
  receipt.alignLeft();
  const discount = Number(order.discount || 0);
  if (discount > 0) {
    receipt.leftRight('Tam tinh:', formatMoney(order.total));
    receipt.leftRight('Giam gia:', '-' + formatMoney(discount));
  }

  receipt.bold(true);
  receipt.leftRight('Tong cong:', formatMoney(order.finalTotal || order.total));
  receipt.bold(false);
}

function renderPayment(receipt, order) {
  receipt.alignLeft();
  const methodLabel = order.paymentMethod === 'transfer' ? 'Chuyen khoan' : 'Tien mat';
  receipt.leftRight('Thanh toan:', methodLabel);
  if (order.paymentCode) receipt.line('Noi dung CK: ' + order.paymentCode);
}

function renderQrText(receipt, order, config) {
  if (config.showQR === false) return;
  receipt.alignCenter();
  receipt.emptyLine();
  receipt.line('[QR]');
  if (order.paymentCode) receipt.line(order.paymentCode);
}

function renderFooter(receipt, config) {
  receipt.alignCenter();
  receipt.emptyLine();
  receipt.line(config.footer);
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
