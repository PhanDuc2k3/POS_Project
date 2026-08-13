import { api } from './shared/api.js';
import { esc } from './shared/format.js';
import { SESSION_KEY, STORE_ID_KEY, state } from './shared/state.js';
import { renderCustomerPage } from './pages/CustomerPage.js';

const app = document.getElementById('app');

function toast(message) {
  state.toast = message;
  render();
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    state.toast = '';
    render();
  }, 2400);
}

async function bootstrap() {
  bindEvents();
  await Promise.all([loadMenu(), restoreSession()]);
  state.loading = false;
  render();
}

async function loadMenu() {
  const data = await api(`/menu?storeId=${state.storeId}`);
  state.menu = {
    categories: data.categories || [],
    products: data.products || [],
  };
}

async function restoreSession() {
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return;
  try {
    const session = await api(`/dining-sessions/${sessionId}?storeId=${state.storeId}`);
    state.activeSession = session;
    state.tableCode = session.tableCode || '';
    state.guestCount = Number(session.guestCount || 2);
    state.orderNote = session.note || '';
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
}

async function switchStore(nextStoreId) {
  state.storeId = nextStoreId;
  localStorage.setItem(STORE_ID_KEY, String(nextStoreId));
  localStorage.removeItem(SESSION_KEY);
  state.activeSession = null;
  state.cart = [];
  state.loading = true;
  render();
  try {
    await Promise.all([loadMenu(), restoreSession()]);
  } finally {
    state.loading = false;
    render();
  }
}

function bindEvents() {
  app.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const value = button.dataset.value;

    try {
      if (action === 'set-category') {
        state.categoryId = value;
        render();
      } else if (action === 'add-cart') {
        addToCart(Number(button.dataset.id));
      } else if (action === 'dec-cart') {
        changeCartQty(Number(button.dataset.id), -1);
      } else if (action === 'inc-cart') {
        changeCartQty(Number(button.dataset.id), 1);
      } else if (action === 'remove-cart') {
        removeFromCart(Number(button.dataset.id));
      } else if (action === 'send-order') {
        await sendOrder();
      } else if (action === 'refresh') {
        await loadMenu();
        if (state.activeSession) await restoreSession();
        toast('Updated');
      } else if (action === 'clear-cart') {
        state.cart = [];
        render();
      }
    } catch (err) {
      toast(err.message);
    }
  });

  app.addEventListener('input', (event) => {
    const target = event.target;
    const field = target.dataset.field;
    if (!field) return;

    if (field === 'search') state.search = target.value;
    if (field === 'storeId') {
      const nextStoreId = Number(target.value || 1);
      if (nextStoreId !== state.storeId) {
        switchStore(nextStoreId);
      }
      return;
    }
    if (field === 'tableCode') state.tableCode = target.value;
    if (field === 'guestCount') state.guestCount = Number(target.value || 1);
    if (field === 'sessionNote') state.sessionNote = target.value;
    if (field === 'orderNote') state.orderNote = target.value;
    render();
  });
}

function addToCart(productId) {
  const product = state.menu.products.find((item) => item.id === productId);
  if (!product) return;
  const current = state.cart.find((item) => item.id === productId);
  if (current) current.qty += 1;
  else state.cart.push({ id: product.id, name: product.name, price: Number(product.price || 0), qty: 1 });
  render();
}

function changeCartQty(productId, delta) {
  const item = state.cart.find((entry) => entry.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((entry) => entry.id !== productId);
  }
  render();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((entry) => entry.id !== productId);
  render();
}

async function createSession() {
  if (!String(state.tableCode).trim()) {
    throw new Error('Enter table before opening a session');
  }
  const session = await api(`/dining-sessions?storeId=${state.storeId}`, {
    method: 'POST',
    body: JSON.stringify({
      tableCode: state.tableCode.trim(),
      guestCount: Number(state.guestCount || 1),
      note: state.sessionNote.trim(),
    }),
  });
  state.activeSession = session;
  localStorage.setItem(SESSION_KEY, String(session.id));
  return session;
}

async function sendOrder() {
  if (!state.cart.length) {
    throw new Error('Cart is empty');
  }
  if (!state.activeSession) {
    await createSession();
  }
  const sessionId = state.activeSession.id;
  const payload = {
    items: state.cart.map((item) => ({
      productId: item.id,
      productName: item.name,
      name: item.name,
      quantity: item.qty,
      unitPrice: item.price,
      price: item.price,
    })),
    note: state.orderNote.trim(),
    sourceApp: 'customer',
    tableCode: state.tableCode.trim() || state.activeSession.tableCode || '',
  };
  const result = await api(`/dining-sessions/${sessionId}/orders?storeId=${state.storeId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  state.cart = [];
  state.activeSession = await api(`/dining-sessions/${sessionId}?storeId=${state.storeId}`);
  localStorage.setItem(SESSION_KEY, String(sessionId));
  toast(`Order sent ${result?.data?.orderNumber || ''}`.trim());
}

function filteredProducts() {
  return state.menu.products.filter((product) => {
    const matchesSearch = !state.search || product.name.toLowerCase().includes(state.search.toLowerCase());
    const matchesCategory = state.categoryId === 'all' || String(product.categoryId) === String(state.categoryId);
    return matchesSearch && matchesCategory;
  });
}

function render() {
  document.title = 'POS Customer App';
  app.innerHTML = renderCustomerPage(state, {
    activeSession: state.activeSession,
    products: filteredProducts(),
    esc,
  });
}

bootstrap().catch((err) => {
  state.loading = false;
  state.toast = err.message;
  render();
});
