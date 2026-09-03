import { renderAuthModal } from './components/AuthModal.js';
import { renderFooter } from './components/Footer.js';
import { renderHeader } from './components/Header.js';
import { renderHomePage } from './pages/HomePage.js';
import { renderLocationPage } from './pages/LocationPage.js';
import { renderNewsPage } from './pages/NewsPage.js';
import { renderOrderDetailPage } from './pages/OrderDetailPage.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderProductPage } from './pages/ProductPage.js';
import { renderWarrantyPage } from './pages/WarrantyPage.js';
import { renderLucideIcons } from './shared/icons.js';
import {
  getMarketingSession,
  getPublicOrderStatus,
  getStoredOrder,
  loginMarketingSignup,
  registerMarketingSignup,
  setStoredOrder,
  submitPublicOrder,
  submitSalesLead,
} from './shared/api.js';

const app = document.getElementById('app');
let lastRenderedHash = null;

const routes = new Map([
  ['#home', renderHomePage],
  ['#order', renderOrderDetailPage],
  ['#products', renderProductPage],
  ['#news', renderNewsPage],
  ['#warranty', renderWarrantyPage],
  ['#locations', renderLocationPage],
  ['#profile', renderProfilePage],
]);

const state = {
  user: null,
  myTrialRequest: null,
  purchaseOrder: null,
  packageDraft: 'pro',
  marketingSignup: null,
  profileOrders: [],
  profileLeads: [],
  authModalOpen: false,
  authMode: 'signin',
  ready: false,
};

function getMarketingSignup() {
  try {
    return JSON.parse(localStorage.getItem('pos_marketing_signup') || 'null');
  } catch {
    return null;
  }
}

function setMarketingSignup(signup) {
  state.marketingSignup = signup || null;
  if (signup) {
    localStorage.setItem('pos_marketing_signup', JSON.stringify(signup));
  } else {
    localStorage.removeItem('pos_marketing_signup');
  }
}

function canSubmitMarketingForms() {
  return Boolean(state.marketingSignup?.signupToken);
}

function getMarketingSignupPayload() {
  return {
    marketingSignupToken: state.marketingSignup?.signupToken || '',
  };
}

function getRoute() {
  if (window.location.hash.startsWith('#order/')) {
    return '#order';
  }

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
  renderLucideIcons();
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
  if (!hash || routes.has(hash) || hash.startsWith('#order/') || hash.startsWith('#products/') || hash.startsWith('#news/')) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  requestAnimationFrame(() => {
    document.querySelector(hash)?.scrollIntoView({ block: 'start' });
  });
}

async function loadSession() {
  state.marketingSignup = getMarketingSignup();
  if (state.marketingSignup?.signupToken) {
    try {
      const session = await getMarketingSession(state.marketingSignup.signupToken);
      setMarketingSignup({
        id: session.signupId,
        name: session.name,
        email: session.email,
        status: session.status,
        signupToken: session.signupToken,
        registeredAt: session.createdAt,
      });
      state.profileOrders = session.orders || [];
      state.profileLeads = session.salesLeads || [];
    } catch {
      setMarketingSignup(null);
      state.profileOrders = [];
      state.profileLeads = [];
    }
  }

  await loadOrderFromHashOrStorage();

  state.ready = true;
  render();
}

async function loadOrderFromHashOrStorage() {
  const hashOrderCode = window.location.hash.startsWith('#order/')
    ? decodeURIComponent(window.location.hash.replace('#order/', '').trim())
    : '';
  const storedOrder = hashOrderCode ? { orderCode: hashOrderCode } : getStoredOrder();
  if (storedOrder?.orderCode) {
    const profileOrder = state.profileOrders.find((item) => (item.orderCode || item.id) === storedOrder.orderCode);
    try {
      const orderStatus = await getPublicOrderStatus(storedOrder.orderCode);
      state.purchaseOrder = {
        ...storedOrder,
        ...profileOrder,
        ...orderStatus,
        account: profileOrder?.account || orderStatus.account || null,
      };
      state.myTrialRequest = {
        id: orderStatus.orderCode,
        orderCode: orderStatus.orderCode,
        businessName: storedOrder.businessName || profileOrder?.companyName || profileOrder?.businessName || orderStatus.orderCode,
        packageTier: orderStatus.packageTier || storedOrder.packageTier,
        requestedStores: orderStatus.requestedStoreCount || storedOrder.requestedStores,
        status: orderStatus.status,
        nextStep: orderStatus.nextStep,
        message: orderStatus.message,
        account: profileOrder?.account || null,
        createdAt: orderStatus.createdAt || storedOrder.createdAt,
      };
      if (!state.profileOrders.some((item) => (item.orderCode || item.id) === orderStatus.orderCode)) {
        state.profileOrders = [state.myTrialRequest, ...state.profileOrders].filter(Boolean);
      }
    } catch {
      state.purchaseOrder = { ...storedOrder, ...profileOrder, account: profileOrder?.account || null };
      state.myTrialRequest = {
        id: storedOrder.orderCode,
        orderCode: storedOrder.orderCode,
        businessName: storedOrder.businessName || profileOrder?.companyName || profileOrder?.businessName,
        packageTier: storedOrder.packageTier,
        requestedStores: storedOrder.requestedStores,
        status: storedOrder.status,
        account: profileOrder?.account || null,
        createdAt: storedOrder.createdAt,
      };
      if (!state.profileOrders.some((item) => (item.orderCode || item.id) === storedOrder.orderCode)) {
        state.profileOrders = [state.myTrialRequest, ...state.profileOrders].filter(Boolean);
      }
    }
  }
}

async function handleLogin(form) {
  const formData = new FormData(form);
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    throw new Error('Vui long nhap email va mat khau.');
  }

  const signup = await loginMarketingSignup({
    email,
    password,
  });
  setMarketingSignup({
    id: signup.signupId,
    name: signup.name,
    email: signup.email,
    status: signup.status,
    signupToken: signup.signupToken,
    registeredAt: signup.createdAt,
  });
  form.reset();
  state.authModalOpen = false;
  return signup;
}

async function handleTrialSubmit(form) {
  const formData = new FormData(form);
  const order = await submitPublicOrder({
    ...getMarketingSignupPayload(),
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
    orderCode: order.orderCode,
    businessName: formData.get('businessName'),
    packageTier: formData.get('packageTier'),
    requestedStores: Number(formData.get('requestedStores') || 1),
    status: order.status,
    nextStep: order.nextStep,
    message: order.message,
    createdAt: order.createdAt,
  };
  state.profileOrders = [state.myTrialRequest, ...state.profileOrders.filter((item) => (item.orderCode || item.id) !== order.orderCode)];
  window.location.hash = `#order/${encodeURIComponent(order.orderCode)}`;
  form.reset();
  return order;
}

async function handleSignupSubmit(form) {
  const formData = new FormData(form);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (!name || !email || !password) {
    throw new Error('Vui long nhap day du ho ten, email va mat khau.');
  }
  if (password.length < 6) {
    throw new Error('Mat khau can toi thieu 6 ky tu.');
  }
  if (password !== confirmPassword) {
    throw new Error('Mat khau nhap lai khong khop.');
  }

  const signup = await registerMarketingSignup({
    name,
    email,
    password,
  });
  setMarketingSignup({
    id: signup.signupId,
    name: signup.name,
    email: signup.email,
    status: signup.status,
    signupToken: signup.signupToken,
    registeredAt: signup.createdAt,
  });
  form.reset();
  return signup;
}

async function handleContactSubmit(form) {
  const formData = new FormData(form);
  const lead = await submitSalesLead({
    ...getMarketingSignupPayload(),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    message: formData.get('message'),
  });
  state.profileLeads = [lead, ...state.profileLeads];
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

function requireMarketingSignup(form) {
  if (canSubmitMarketingForms()) return true;

  const message = form.querySelector('.form-message');
  if (message) {
    message.textContent = 'Vui long dang ky truoc khi gui form de han che spam.';
  }
  openAuthModal('signup');
  return false;
}

function closeAuthModal() {
  state.authModalOpen = false;
  render();
}

function bindEvents() {
  app.addEventListener('click', (event) => {
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

    if (event.target.matches('.modal-backdrop') || event.target.closest('[data-action="close-auth"]')) {
      closeAuthModal();
      return;
    }

    if (event.target.closest('.site-nav a')) {
      document.body.classList.remove('nav-open');
      app.querySelector('.menu-button')?.setAttribute('aria-expanded', 'false');
    }

    if (event.target.closest('[data-action="logout"]')) {
      setMarketingSignup(null);
      state.myTrialRequest = null;
      state.profileOrders = [];
      state.profileLeads = [];
      state.authModalOpen = false;
      if (window.location.hash === '#profile') window.location.hash = '#home';
      render();
    }
  });

  app.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form || !['signin', 'signup', 'contact', 'trial'].includes(form.dataset.form)) return;

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
        if (message) message.textContent = 'Dang dang ky...';
        await handleSignupSubmit(form);
        state.authModalOpen = false;
        render();
        const trialMessage = app.querySelector('form[data-form="trial"] .form-message');
        if (trialMessage) {
          trialMessage.textContent = 'Dang ky thanh cong. Ban co the gui form yeu cau ngay bay gio.';
        }
        return;
      }

      if (form.dataset.form === 'contact') {
        if (!requireMarketingSignup(form)) return;
        if (message) message.textContent = 'Dang gui thong tin...';
        const lead = await handleContactSubmit(form);
        if (message) message.textContent = `Da gui thong tin tu van. Ma lien he: ${lead.leadCode}.`;
        return;
      }

      if (form.dataset.form === 'trial') {
        if (!requireMarketingSignup(form)) return;
        if (message) message.textContent = 'Dang gui yeu cau...';
        const order = await handleTrialSubmit(form);
        render();
        const trialMessage = app.querySelector('form[data-form="trial"] .form-message');
        if (trialMessage) {
          trialMessage.textContent =
            `Yeu cau cua ban da duoc tiep nhan. Ma yeu cau: ${order.orderCode}. Chung toi se lien he de hoan tat qua trinh dang ky.`;
        }
        return;
      }
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
window.addEventListener('hashchange', async () => {
  if (window.location.hash.startsWith('#order/')) {
    await loadOrderFromHashOrStorage();
  }
  render();
});
await loadSession();
