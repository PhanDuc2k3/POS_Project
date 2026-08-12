/**
 * POS App - Main application logic with topping popup
 */

let cart = [];
let products = [];
let categories = [];
let storeInfo = null;
let bankConfig = null;
let activeCategory = 'all';
let pendingTransferOrder = null;

// UI Text (Unicode escapes)
const T = {
  login: '\u0110\u0103ng nh\u1EADp',
  username: 'T\u00EAn \u0111\u0103ng nh\u1EADp',
  password: 'M\u1EADt kh\u1EA9u',
  order: '\u0110\u01A1n h\u00E0ng',
  total: 'T\u1ED5ng c\u1ED9ng',
  cash: 'Ti\u1EC1n m\u1EB7t',
  transfer: 'Chuy\u1EC3n kho\u1EA3n',
  success: 'Thanh to\u00E1n th\u00E0nh c\u00F4ng!',
  empty: 'Ch\u01B0a c\u00F3 m\u00F3n n\u00E0o',
  noProducts: 'Ch\u01B0a c\u00F3 s\u1EA3n ph\u1EA9m',
  all: 'T\u1EA5t c\u1EA3',
  addToOrder: 'Th\u00EAm v\u00E0o \u0111\u01A1n',
  topping: '\u0110\u1ED3 th\u00EAm',
};

// DOM
const $ = id => document.getElementById(id);

// Set text
$('login-title').textContent = T.login;
$('login-username').placeholder = T.username;
$('login-password').placeholder = T.password;
$('login-btn').textContent = T.login;
$('cart-title').textContent = T.order;
$('cart-total-label').textContent = T.total;
$('success-title').textContent = T.success;
$('pay-cash-btn').textContent = T.cash;
$('pay-transfer-btn').textContent = T.transfer;

// ─── Login ───────────────────────────────────

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('login-error').textContent = '';
  try {
    await window.POS_API.login($('login-username').value, $('login-password').value);
    await loadData();
    connectWS();
    $('login-screen').classList.remove('active');
    $('pos-screen').classList.add('active');
  } catch (err) {
    $('login-error').textContent = err.message;
  }
});

// ─── WebSocket (via main process IPC) ────────

function connectWS() {
  const token = window.POS_API.getToken();
  if (!token || !window.posAPI?.connectSocket) return;

  // Tell main process to connect socket with this token
  window.posAPI.connectSocket(token);

  // Listen for events forwarded from main process
  window.posAPI.onSocketEvent(({ event, data }) => {
    console.log('[WS] Event received:', event);
    // Reload menu on any product/store change
    if (event.startsWith('product:') || event.startsWith('store:')) {
      loadData();
    }
    if (event === 'transaction:paid') {
      handlePaidEvent(data);
    }
  });

  window.posAPI.onSocketConnected(() => {
    console.log('[WS] Connected');
  });

  window.posAPI.onSocketDisconnected(() => {
    console.log('[WS] Disconnected');
  });
}

// ─── Load Data ───────────────────────────────

async function loadData() {
  try {
    const [menu, storeConfig] = await Promise.all([
      window.POS_API.getMenu(),
      window.POS_API.getStoreConfig().catch(() => null),
    ]);
    categories = menu.categories || [];
    products = menu.products || [];
    storeInfo = storeConfig?.store || null;
    bankConfig = storeConfig?.bank || null;
    $('store-name').textContent = storeInfo?.name || 'POS';
    renderCategories();
    renderProducts();

    // Cache store config for printer (main process)
    if (window.posAPI?.setStoreConfig) {
      window.posAPI.setStoreConfig({
        store: storeInfo,
        receipt: storeConfig?.receipt || null,
      });
    }
  } catch (err) { console.error('Load failed:', err); }
}

// ─── Categories ──────────────────────────────

function renderCategories() {
  let html = '<button class="cat-btn active" data-cat="all">' + T.all + '</button>';
  categories.forEach(c => { html += '<button class="cat-btn" data-cat="' + c.id + '">' + esc(c.name) + '</button>'; });
  $('categories-bar').innerHTML = html;
  $('categories-bar').querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      $('categories-bar').querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });
  });
}

// ─── Products Grid ───────────────────────────

function renderProducts() {
  const filtered = activeCategory === 'all' ? products : products.filter(p => String(p.categoryId) === activeCategory);
  if (!filtered.length) {
    $('products-grid').innerHTML = '<p class="grid-empty">' + T.noProducts + '</p>';
    return;
  }
  $('products-grid').innerHTML = filtered.map(p =>
    '<button class="product-btn" data-id="' + p.id + '">' +
      (p.image ? '<img class="p-img" src="' + esc(p.image) + '" alt="">' : '<div class="p-img-placeholder"></div>') +
      '<span class="p-name">' + esc(p.name) + '</span>' +
      '<span class="p-price">' + fmt(p.price) + '</span>' +
      (p.toppingGroups && p.toppingGroups.length ? '<span class="p-has-topping">+</span>' : '') +
    '</button>'
  ).join('');

  $('products-grid').querySelectorAll('.product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = products.find(p => p.id === parseInt(btn.dataset.id));
      if (product) onProductClick(product);
    });
  });
}

// ─── Product Click → Topping Popup or Add ────

function onProductClick(product) {
  if (product.toppingGroups && product.toppingGroups.length > 0) {
    showToppingPopup(product);
  } else {
    addToCart({ productId: product.id, productName: product.name, unitPrice: product.price, toppings: [] });
  }
}

// ─── Topping Popup ───────────────────────────

function showToppingPopup(product) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = buildToppingPopupHTML(product);
  document.body.appendChild(overlay);

  // Close
  overlay.querySelector('.popup-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Add to order
  overlay.querySelector('.popup-add-btn').addEventListener('click', () => {
    const selectedToppings = [];
    overlay.querySelectorAll('.topping-check:checked').forEach(cb => {
      selectedToppings.push({ id: parseInt(cb.dataset.id), name: cb.dataset.name, price: parseFloat(cb.dataset.price) });
    });
    addToCart({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      toppings: selectedToppings,
    });
    overlay.remove();
  });

  // Update total on topping selection
  overlay.querySelectorAll('.topping-check').forEach(cb => {
    cb.addEventListener('change', () => updatePopupTotal(overlay, product.price));
  });
}

function buildToppingPopupHTML(product) {
  let toppingHtml = '';
  product.toppingGroups.forEach(group => {
    toppingHtml += '<div class="topping-group-title">' + esc(group.name) + '</div>';
    group.toppings.forEach(t => {
      toppingHtml += '<label class="topping-item">' +
        '<input type="checkbox" class="topping-check" data-id="' + t.id + '" data-name="' + esc(t.name) + '" data-price="' + t.price + '">' +
        '<span class="topping-name">' + esc(t.name) + '</span>' +
        '<span class="topping-price">+' + fmt(t.price) + '</span>' +
      '</label>';
    });
  });

  return '<div class="popup">' +
    '<div class="popup-header">' +
      '<h3>' + esc(product.name) + '</h3>' +
      '<button class="popup-close">\u00D7</button>' +
    '</div>' +
    (product.image ? '<img class="popup-img" src="' + esc(product.image) + '">' : '') +
    (product.description ? '<p class="popup-desc">' + esc(product.description) + '</p>' : '') +
    '<div class="popup-base-price">' + fmt(product.price) + '</div>' +
    '<div class="popup-toppings">' + toppingHtml + '</div>' +
    '<div class="popup-footer">' +
      '<div class="popup-total">' + fmt(product.price) + '</div>' +
      '<button class="popup-add-btn">' + T.addToOrder + '</button>' +
    '</div>' +
  '</div>';
}

function updatePopupTotal(overlay, basePrice) {
  let total = basePrice;
  overlay.querySelectorAll('.topping-check:checked').forEach(cb => {
    total += parseFloat(cb.dataset.price);
  });
  overlay.querySelector('.popup-total').textContent = fmt(total);
}

// ─── Cart ────────────────────────────────────

function addToCart(item) {
  // Each item with different topping combination is separate
  const key = item.productId + '_' + (item.toppings || []).map(t => t.id).sort().join(',');
  const existing = cart.find(c => c.key === key);
  if (existing) {
    existing.quantity++;
  } else {
    const toppingTotal = (item.toppings || []).reduce((s, t) => s + t.price, 0);
    cart.push({
      key,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice + toppingTotal,
      basePrice: item.unitPrice,
      toppings: item.toppings || [],
      quantity: 1,
    });
  }
  renderCart();
}

function updateQty(key, delta) {
  const item = cart.find(c => c.key === key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(c => c.key !== key);
  renderCart();
}

function clearCart() { cart = []; renderCart(); }

function getTotal() { return cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0); }

function renderCart() {
  const el = $('cart-items');
  if (!cart.length) {
    el.innerHTML = '<p class="cart-empty">' + T.empty + '</p>';
    $('cart-total-value').textContent = '0';
    $('pay-cash-btn').disabled = true;
    $('pay-transfer-btn').disabled = true;
    return;
  }
  $('pay-cash-btn').disabled = false;
  $('pay-transfer-btn').disabled = false;

  el.innerHTML = cart.map(item => {
    const toppingText = item.toppings.length ? '<div class="cart-item-toppings">' + item.toppings.map(t => t.name).join(', ') + '</div>' : '';
    return '<div class="cart-item">' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + esc(item.productName) + '</div>' +
        toppingText +
        '<div class="cart-item-price">' + fmt(item.unitPrice) + '</div>' +
      '</div>' +
      '<div class="cart-item-qty">' +
        '<button class="qty-btn" data-key="' + esc(item.key) + '" data-d="-1">\u2212</button>' +
        '<span class="qty-value">' + item.quantity + '</span>' +
        '<button class="qty-btn" data-key="' + esc(item.key) + '" data-d="1">+</button>' +
      '</div>' +
    '</div>';
  }).join('');

  el.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => updateQty(btn.dataset.key, parseInt(btn.dataset.d)));
  });

  $('cart-total-value').textContent = fmt(getTotal());
}

// ─── Payment ─────────────────────────────────

async function pay(method) {
  if (!cart.length) return;

  if (method === 'transfer') {
    await startTransferPayment();
  } else {
    await processOrder('cash');
  }
}

async function startTransferPayment() {
  $('pay-cash-btn').disabled = true;
  $('pay-transfer-btn').disabled = true;
  try {
    if (!pendingTransferOrder) {
      const items = buildOrderItems();
      pendingTransferOrder = await window.POS_API.createOrder(
        items,
        'transfer',
        bankConfig?.accountNumber || null
      );
    }
    showQRPayment(pendingTransferOrder);
  } catch (err) {
    alert(err.message);
  } finally {
    $('pay-cash-btn').disabled = false;
    $('pay-transfer-btn').disabled = false;
  }
}

function showQRPayment(order) {
  const total = order?.finalTotal || getTotal();
  const paymentCode = order?.paymentCode || '';

  // Generate VietQR URL
  const qrUrl = generateVietQR(total, paymentCode);

  $('qr-title').textContent = 'Chuy\u1EC3n kho\u1EA3n';
  $('qr-amount').textContent = fmt(total);
  $('qr-image').src = qrUrl;
  $('qr-instruction').textContent = paymentCode
    ? 'N\u1ED9i dung chuy\u1EC3n kho\u1EA3n: ' + paymentCode
    : 'Qu\u00E9t m\u00E3 QR \u0111\u1EC3 thanh to\u00E1n';

  // Show bank info
  if (bankConfig) {
    $('qr-bank-info').innerHTML =
      esc(bankConfig.bankName || '') + ' - ' + esc(bankConfig.accountName || '') +
      '<br>STK: ' + esc(bankConfig.accountNumber || '') +
      (bankConfig.bankBin ? '<br>BIN: ' + esc(bankConfig.bankBin) : '');
  } else {
    $('qr-bank-info').textContent = '';
  }

  $('qr-confirm-btn').textContent = 'X\u00E1c nh\u1EADn th\u1EE7 c\u00F4ng';
  $('qr-cancel-btn').textContent = 'H\u1EE7y';
  renderWebhookDebug(order, total, paymentCode);

  $('qr-overlay').classList.remove('hidden');
}

function renderWebhookDebug(order, amount, paymentCode) {
  const body = buildSePayPostmanBody(order, amount, paymentCode);
  const url = 'POST http://localhost:4000/api/payment-webhooks/sepay';
  const json = JSON.stringify(body, null, 2);

  $('qr-debug-url').textContent = url;
  $('qr-debug-body').textContent = json;

  console.log('[SePay demo] Postman URL:', url);
  console.log('[SePay demo] Headers:', { 'Content-Type': 'application/json' });
  console.log('[SePay demo] Body:', body);
}

function buildSePayPostmanBody(order, amount, paymentCode) {
  const eventId = Date.now();
  return {
    id: eventId,
    gateway: bankConfig?.bankName || 'TestBank',
    transactionDate: nowVietnamSql(),
    accountNumber: bankConfig?.accountNumber || '',
    code: paymentCode || '',
    content: ((paymentCode || '') + ' thanh toan').trim(),
    transferType: 'in',
    transferAmount: Math.round(Number(amount || order?.finalTotal || 0)),
    referenceCode: 'TEST' + eventId,
  };
}

function generateVietQR(amount, paymentCode) {
  // VietQR format: https://img.vietqr.io/image/<bankBin>-<accountNo>-<template>.png?amount=<amount>&addInfo=<desc>
  // If no bank config, show placeholder QR
  if (!bankConfig || !bankConfig.accountNumber) {
    // Fallback: generate a simple QR with amount info
    return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' +
      encodeURIComponent('Chuyen khoan ' + amount + 'd');
  }

  const bin = getBankBin(bankConfig);
  if (!bin) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' +
      encodeURIComponent('Thieu ma BIN ngan hang');
  }

  const account = bankConfig.accountNumber || '';
  const template = 'compact2';
  const desc = paymentCode || 'Thanh toan POS';

  return `https://img.vietqr.io/image/${bin}-${account}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(bankConfig.accountName || '')}`;
}

function getBankBin(config) {
  if (config.bankBin) return String(config.bankBin).trim();

  const bankBins = {
    'mb': '970422', 'mb bank': '970422', 'mbbank': '970422',
    'vcb': '970436', 'vietcombank': '970436',
    'tcb': '970407', 'techcombank': '970407',
    'acb': '970416',
    'bidv': '970418',
    'vietinbank': '970415',
    'agribank': '970405',
    'vib': '970441',
    'tpbank': '970423', 'tp bank': '970423',
    'vpbank': '970432', 'vp bank': '970432',
    'sacombank': '970403',
    'shb': '970443',
    'msb': '970426',
    'ocb': '970448',
    'hdbank': '970437', 'hd bank': '970437',
  };

  const bankName = (config.bankName || '').toLowerCase().trim();
  return bankBins[bankName] || '';
}

async function processOrder(method) {
  $('pay-cash-btn').disabled = true;
  $('pay-transfer-btn').disabled = true;

  try {
    const order = await window.POS_API.createOrder(buildOrderItems(), method);
    await finishPaidOrder(order);
  } catch (err) {
    alert(err.message);
  } finally {
    $('pay-cash-btn').disabled = false;
    $('pay-transfer-btn').disabled = false;
  }
}

function buildOrderItems() {
  return cart.map(item => ({
    productId: item.productId,
    productName: item.productName + (item.toppings.length ? ' (' + item.toppings.map(t => t.name).join(', ') + ')' : ''),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));
}

async function handlePaidEvent(data) {
  const paidOrder = data?.order || null;
  const orderId = data?.orderId || paidOrder?.id;
  if (!pendingTransferOrder || Number(orderId) !== Number(pendingTransferOrder.id)) return;

  try {
    const order = paidOrder || await window.POS_API.getOrder(orderId);
    $('qr-overlay').classList.add('hidden');
    pendingTransferOrder = null;
    await finishPaidOrder(order);
  } catch (err) {
    console.log('[Payment] Failed to finalize paid order:', err.message);
  }
}

async function finishPaidOrder(order) {
  $('success-amount').textContent = fmt(order.finalTotal);
  $('success-order-number').textContent = order.orderNumber;
  $('success-overlay').classList.remove('hidden');
  setTimeout(() => $('success-overlay').classList.add('hidden'), 3000);
  clearCart();
}

async function printReceipt(order) {
  if (!window.posAPI?.printReceipt) return;

  try {
    const result = await window.posAPI.printReceipt({
      order: {
        orderNumber: order.orderNumber,
        items: order.items,
        total: order.total,
        discount: order.discount,
        finalTotal: order.finalTotal,
        paymentMethod: order.paymentMethod,
        cashierName: order.cashierName,
        createdAt: order.createdAt,
      },
      store: storeInfo,
      receipt: null,
    });

    if (!result.success) {
      console.log('[Print] Failed:', result.error);
    }
  } catch (err) {
    console.log('[Print] Error:', err.message);
  }
}

// ─── Events ──────────────────────────────────
$('clear-cart-btn').addEventListener('click', clearCart);
$('pay-cash-btn').addEventListener('click', () => pay('cash'));
$('pay-transfer-btn').addEventListener('click', () => pay('transfer'));
$('success-overlay').addEventListener('click', () => $('success-overlay').classList.add('hidden'));
$('qr-copy-debug-btn').addEventListener('click', async () => {
  const json = $('qr-debug-body').textContent || '';
  try {
    await navigator.clipboard.writeText(json);
    $('qr-copy-debug-btn').textContent = 'Copied';
    setTimeout(() => { $('qr-copy-debug-btn').textContent = 'Copy JSON'; }, 1200);
  } catch {
    console.log('[SePay demo] Copy this JSON:', json);
  }
});

// QR overlay events
$('qr-confirm-btn').addEventListener('click', async () => {
  if (!pendingTransferOrder) return;
  try {
    const order = await window.POS_API.confirmTransferOrder(pendingTransferOrder.id);
    $('qr-overlay').classList.add('hidden');
    pendingTransferOrder = null;
    await finishPaidOrder(order);
  } catch (err) {
    alert(err.message);
  }
});
$('qr-cancel-btn').addEventListener('click', async () => {
  if (pendingTransferOrder) {
    try { await window.POS_API.cancelOrder(pendingTransferOrder.id); } catch { /* ignore */ }
    pendingTransferOrder = null;
  }
  $('qr-overlay').classList.add('hidden');
});
$('qr-close').addEventListener('click', async () => {
  if (pendingTransferOrder) {
    try { await window.POS_API.cancelOrder(pendingTransferOrder.id); } catch { /* ignore */ }
    pendingTransferOrder = null;
  }
  $('qr-overlay').classList.add('hidden');
});

// ─── Utils ───────────────────────────────────
function fmt(v) { return new Intl.NumberFormat('vi-VN').format(v) + ' \u0111'; }
function esc(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
function nowVietnamSql() {
  const vn = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return vn.toISOString().slice(0, 19).replace('T', ' ');
}

// Init
renderCart();
