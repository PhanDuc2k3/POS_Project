/**
 * Receipt Formatter
 * Builds a receipt from order data using ESC/POS commands.
 */

const { ReceiptBuilder } = require('./escpos');

const DEFAULT_BLOCKS = ['header','storeInfo','divider','orderInfo','divider','items','total','qr','footer'];
const LABELS = {
  phone: '\u0110T: ',
  cashier: 'Thu ng\u00e2n: ',
  subtotal: 'T\u1ea1m t\u00ednh:',
  discount: 'Gi\u1ea3m gi\u00e1:',
  total: 'T\u1ed5ng c\u1ed9ng:',
  payment: 'Thanh to\u00e1n:',
  transfer: 'Chuy\u1ec3n kho\u1ea3n',
  cash: 'Ti\u1ec1n m\u1eb7t',
  transferContent: 'N\u1ed9i dung CK: ',
  currency: '\u0111',
};

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
    footer: receiptConfig.footer || 'Xin c\u1ea3m \u01a1n qu\u00fd kh\u00e1ch!',
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
      renderLogo(receipt, store, config);
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
      renderQrText(receipt, order, store, config);
      break;
    case 'footer':
      renderFooter(receipt, config);
      break;
    default:
      break;
  }
}

function renderLogo(receipt, store, config) {
  if (!config.showLogo) return;
  receipt.alignCenter();
  if (store.logo) {
    const maxWidthDots = config.paperWidth === '80mm' ? 320 : 220;
    receipt.imageDataUrl(store.logo, { maxWidthDots });
  } else {
    receipt.line(config.logoText || '[LOGO]');
  }
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
  if (store.phone) receipt.line(LABELS.phone + store.phone);
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
    receipt.line(LABELS.cashier + order.cashierName);
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
    receipt.leftRight(LABELS.subtotal, formatMoney(order.total));
    receipt.leftRight(LABELS.discount, '-' + formatMoney(discount));
  }

  receipt.bold(true);
  receipt.leftRight(LABELS.total, formatMoney(order.finalTotal || order.total));
  receipt.bold(false);
}

function renderPayment(receipt, order) {
  receipt.alignLeft();
  const methodLabel = order.paymentMethod === 'transfer' ? LABELS.transfer : LABELS.cash;
  receipt.leftRight(LABELS.payment, methodLabel);
  if (order.paymentCode) receipt.line(LABELS.transferContent + order.paymentCode);
}

function renderQrText(receipt, order, store, config) {
  if (config.showQR === false) return;
  const qrValue = buildReceiptQrValue(order, store);
  if (!qrValue) return;
  receipt.alignCenter();
  receipt.emptyLine();
  receipt.qr(qrValue, { size: config.paperWidth === '80mm' ? 7 : 5 });
  receipt.line(order.paymentCode || order.orderNumber || order.id || '');
}

function renderFooter(receipt, config) {
  receipt.alignCenter();
  receipt.emptyLine();
  receipt.line(config.footer);
}

function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount || 0) + LABELS.currency;
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

function buildReceiptQrValue(order, store) {
  const bank = store?.bank || null;
  if (bank?.bankBin && bank?.accountNumber && Number(order.finalTotal || order.total) > 0) {
    return buildVietQrPayload({
      bankBin: bank.bankBin,
      accountNumber: bank.accountNumber,
      amount: order.finalTotal || order.total,
      paymentCode: order.paymentCode || order.orderNumber || order.id || '',
    });
  }
  return order.paymentCode || order.orderNumber || order.id || '';
}

function buildVietQrPayload({ bankBin, accountNumber, amount, paymentCode }) {
  const consumerAccount = emv('00', bankBin) + emv('01', accountNumber);
  const merchantAccount =
    emv('00', 'A000000727') +
    emv('01', consumerAccount) +
    emv('02', 'QRIBFTTA');
  const additionalData = paymentCode ? emv('08', paymentCode) : '';
  const payload =
    emv('00', '01') +
    emv('01', '12') +
    emv('38', merchantAccount) +
    emv('53', '704') +
    emv('54', String(Math.round(Number(amount || 0)))) +
    emv('58', 'VN') +
    (additionalData ? emv('62', additionalData) : '') +
    '6304';
  return payload + crc16Ccitt(payload);
}

function emv(id, value) {
  const text = String(value ?? '');
  return id + String(text.length).padStart(2, '0') + text;
}

function crc16Ccitt(text) {
  let crc = 0xFFFF;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

module.exports = { formatReceipt };
