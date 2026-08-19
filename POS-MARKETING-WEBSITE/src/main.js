import { renderAuthModal } from './components/AuthModal.js';
import { renderFooter } from './components/Footer.js';
import { renderHeader } from './components/Header.js';
import { renderHomePage } from './pages/HomePage.js';
import { renderLocationPage } from './pages/LocationPage.js';
import { renderNewsPage } from './pages/NewsPage.js';
import { renderProductPage } from './pages/ProductPage.js';
import { renderWarrantyPage } from './pages/WarrantyPage.js';
import {
  clearStoredAuth,
  getMe,
  getPublicOrderStatus,
  getStoredAuth,
  getStoredOrder,
  login as loginApi,
  setStoredAuth,
  setStoredOrder,
  submitPublicOrder,
  submitSalesLead,
} from './shared/api.js';

const app = document.getElementById('app');
let lastRenderedHash = null;

const routes = new Map([
  ['#home', renderHomePage],
  ['#products', renderProductPage],
  ['#news', renderNewsPage],
  ['#warranty', renderWarrantyPage],
  ['#locations', renderLocationPage],
]);

const state = {
  user: null,
  myTrialRequest: null,
  purchaseOrder: null,
  packageDraft: 'pro',
  accessToken: '',
  refreshToken: '',
  authModalOpen: false,
  authMode: 'signin',
  ready: false,
};

function getRoute() {
  if (window.location.hash.startsWith('#products/')) {
    return '#products';
  }

  if (window.location.hash.startsWith('#news/')) {
    return '#news';
  }

  return routes.has(window.location.hash) ? window.location.hash : '#home';
}

function getPage() {
  return routes.get(getRoute()) || renderHomePage;
}

function render() {
  const route = getRoute();
  const page = getPage();
  app.innerHTML = `
    ${renderHeader(route, state)}
    ${page(state)}
    ${renderFooter()}
    ${renderAuthModal(state)}
  `;
  syncLockedForms();

  if (lastRenderedHash !== window.location.hash) {
    lastRenderedHash = window.location.hash;
    scrollToHash();
  }
}

function syncLockedForms() {
  const locked = ['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT', 'PAID', 'APPROVED', 'ACTIVE'].includes(String(state.myTrialRequest?.status || '').toUpperCase());
  app.querySelectorAll('form[data-form="trial"] input, form[data-form="trial"] select, form[data-form="trial"] button')
    .forEach((el) => {
      el.disabled = locked;
    });
}

function scrollToHash() {
  const hash = window.location.hash;
  if (!hash || routes.has(hash) || hash.startsWith('#products/') || hash.startsWith('#news/')) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  requestAnimationFrame(() => {
    document.querySelector(hash)?.scrollIntoView({ block: 'start' });
  });
}

function setSession(auth, user) {
  state.accessToken = auth.accessToken || '';
  state.refreshToken = auth.refreshToken || '';
  state.user = user || null;
  if (state.accessToken || state.refreshToken) {
    setStoredAuth(auth);
  } else {
    clearStoredAuth();
  }
}

async function loadSession() {
  const storedOrder = getStoredOrder();
  if (storedOrder?.orderCode) {
    try {
      const orderStatus = await getPublicOrderStatus(storedOrder.orderCode);
      state.purchaseOrder = { ...storedOrder, ...orderStatus };
      state.myTrialRequest = {
        id: orderStatus.orderCode,
        businessName: storedOrder.businessName,
        packageTier: orderStatus.packageTier || storedOrder.packageTier,
        requestedStores: orderStatus.requestedStoreCount || storedOrder.requestedStores,
        status: orderStatus.status,
        createdAt: orderStatus.createdAt || storedOrder.createdAt,
      };
    } catch {
      state.purchaseOrder = storedOrder;
      state.myTrialRequest = {
        id: storedOrder.orderCode,
        businessName: storedOrder.businessName,
        packageTier: storedOrder.packageTier,
        requestedStores: storedOrder.requestedStores,
        status: storedOrder.status,
        createdAt: storedOrder.createdAt,
      };
    }
  }

  const auth = getStoredAuth();
  if (!auth.accessToken) {
    state.ready = true;
    render();
    return;
  }

  try {
    const me = await getMe(auth.accessToken);
    state.accessToken = auth.accessToken;
    state.refreshToken = auth.refreshToken;
    state.user = me;
  } catch (err) {
    clearStoredAuth();
    state.user = null;
    state.myTrialRequest = null;
  } finally {
    state.ready = true;
    render();
  }
}

async function handleLogin(form) {
  const formData = new FormData(form);
  const auth = await loginApi({
    username: formData.get('username'),
    password: formData.get('password'),
    rememberMe: true,
  });
  setSession(auth, auth.user);
  form.reset();
  state.authModalOpen = false;
  return auth.user;
}

async function handleTrialSubmit(form) {
  const formData = new FormData(form);
  const order = await submitPublicOrder({
    companyName: formData.get('businessName'),
    customerName: formData.get('contactName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    package: formData.get('packageTier'),
    requestedStoreCount: Number(formData.get('requestedStores') || 1),
    requestedDeviceCount: Number(formData.get('requestedDevices') || 1),
    businessType: formData.get('businessType'),
    note: formData.get('note'),
  });
  state.purchaseOrder = order;
  setStoredOrder({
    orderCode: order.orderCode,
    status: order.status,
    packageTier: formData.get('packageTier'),
    requestedStores: Number(formData.get('requestedStores') || 1),
    businessName: formData.get('businessName'),
    createdAt: order.createdAt,
  });
  state.myTrialRequest = {
    id: order.orderCode,
    businessName: formData.get('businessName'),
    packageTier: formData.get('packageTier'),
    requestedStores: Number(formData.get('requestedStores') || 1),
    status: order.status,
    createdAt: order.createdAt,
  };
  form.reset();
  return order;
}

function handleSignupSubmit(form) {
  form.reset();
}

async function handleContactSubmit(form) {
  const formData = new FormData(form);
  const lead = await submitSalesLead({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    message: formData.get('message'),
  });
  form.reset();
  return lead;
}

function setModalMessage(target, text) {
  const modal = target.closest('.auth-modal');
  const message = modal?.querySelector('.form-message');
  if (message) message.textContent = text;
}

function openAuthModal(mode = 'signin') {
  state.authMode = mode === 'signup' ? 'signup' : 'signin';
  state.authModalOpen = true;
  render();
}

function closeAuthModal() {
  state.authModalOpen = false;
  render();
}

function bindEvents() {
  app.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="demo-forgot"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = 'http://localhost:3000/forgot-password';
      return;
    }

    const menuButton = event.target.closest('.menu-button');
    if (menuButton) {
      const isOpen = document.body.classList.toggle('nav-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      return;
    }

    const openAuthButton = event.target.closest('[data-action="open-auth"]');
    if (openAuthButton) {
      openAuthModal(openAuthButton.dataset.authMode);
      return;
    }

    const switchAuthButton = event.target.closest('[data-action="switch-auth"]');
    if (switchAuthButton) {
      state.authMode = switchAuthButton.dataset.authMode === 'signup' ? 'signup' : 'signin';
      render();
      return;
    }

    const packageButton = event.target.closest('[data-action="select-package"]');
    if (packageButton) {
      event.preventDefault();
      state.packageDraft = packageButton.dataset.package || 'pro';
      render();
      requestAnimationFrame(() => document.querySelector('#trial')?.scrollIntoView({ block: 'start' }));
      return;
    }

    const demoSocialButton = event.target.closest('[data-action="demo-social"]');
    if (demoSocialButton) {
      setModalMessage(demoSocialButton, 'Chức năng này sẽ được kết nối sau.');
      return;
    }

    const demoForgotButton = event.target.closest('[data-action="demo-forgot"]');
    if (demoForgotButton) {
      setModalMessage(demoForgotButton, 'Chức năng quên mật khẩu sẽ được kết nối sau.');
      return;
    }

    if (event.target.matches('.modal-backdrop') || event.target.closest('[data-action="close-auth"]')) {
      closeAuthModal();
      return;
    }

    if (event.target.closest('.site-nav a')) {
      document.body.classList.remove('nav-open');
      app.querySelector('.menu-button')?.setAttribute('aria-expanded', 'false');
    }

    if (event.target.closest('[data-action="logout"]')) {
      clearStoredAuth();
      state.user = null;
      state.myTrialRequest = null;
      state.accessToken = '';
      state.refreshToken = '';
      state.authModalOpen = false;
      render();
    }
  });

  app.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form || !['signin', 'signup', 'contact'].includes(form.dataset.form)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const message = form.querySelector('.form-message');

    try {
      if (form.dataset.form === 'signin') {
        if (message) message.textContent = 'Dang dang nhap...';
        await handleLogin(form);
        render();
        return;
      }

      if (form.dataset.form === 'signup') {
        handleSignupSubmit(form);
        if (message) message.textContent = 'Khach hang moi chi can gui form ben duoi. Admin se tao tai khoan sau khi duyet.';
        return;
      }

      if (form.dataset.form === 'contact') {
        if (message) message.textContent = 'Dang gui thong tin...';
        const lead = await handleContactSubmit(form);
        if (message) message.textContent = `Da gui thong tin tu van. Ma lien he: ${lead.leadCode}.`;
      }
    } catch (err) {
      if (message) message.textContent = err.message;
    }
  });

  app.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;

    event.preventDefault();
    const message = form.querySelector('.form-message');

    try {
      if (form.dataset.form === 'signin') {
        handleLogin(form);
        if (message) message.textContent = 'Giao diện đăng nhập đã sẵn sàng.';
        return;
      }

      if (form.dataset.form === 'signup') {
        handleSignupSubmit(form);
        if (message) message.textContent = 'Giao diện đăng ký đã sẵn sàng.';
        return;
      }

      if (form.dataset.form === 'trial') {
        if (message) message.textContent = 'Đang gửi yêu cầu...';
        const order = await handleTrialSubmit(form);
        render();
        const trialMessage = app.querySelector('form[data-form="trial"] .form-message');
        if (trialMessage) {
          trialMessage.textContent =
            `Yêu cầu của bạn đã được tiếp nhận. Mã yêu cầu: ${order.orderCode}. Chúng tôi sẽ liên hệ để hoàn tất quá trình đăng ký.`;
        }
        return;
      }

      if (message) message.textContent = 'Đã ghi nhận thông tin. Endpoint sales request sẽ nối sau.';
      form.reset();
    } catch (err) {
      if (message) message.textContent = err.message;
    }
  });
}

bindEvents();
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.authModalOpen) {
    closeAuthModal();
  }
});
window.addEventListener('hashchange', render);
await loadSession();
