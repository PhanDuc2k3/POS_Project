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
  getMyTrialRequest,
  getStoredAuth,
  setStoredAuth,
  submitTrialRequest,
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
  accessToken: '',
  refreshToken: '',
  authModalOpen: false,
  authMode: 'signin',
  ready: false,
};

function getRoute() {
  return routes.has(window.location.hash) ? window.location.hash : '#home';
}

function getPage() {
  return routes.get(getRoute()) || renderHomePage;
}

function render() {
  const route = getRoute();
  const page = getPage();
  app.innerHTML = `
    ${renderHeader(route)}
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
  const locked = !state.user || ['pending', 'approved'].includes(state.myTrialRequest?.status);
  app.querySelectorAll('form[data-form="trial"] input, form[data-form="trial"] select, form[data-form="trial"] button')
    .forEach((el) => {
      el.disabled = locked;
    });
}

function scrollToHash() {
  const hash = window.location.hash;
  if (!hash || routes.has(hash)) {
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
    state.myTrialRequest = await getMyTrialRequest(auth.accessToken);
  } catch (err) {
    clearStoredAuth();
    state.user = null;
    state.myTrialRequest = null;
  } finally {
    state.ready = true;
    render();
  }
}

function handleLogin(form) {
  form.reset();
}

async function handleTrialSubmit(form) {
  if (!state.accessToken) throw new Error('Login required');
  const formData = new FormData(form);
  const request = await submitTrialRequest(state.accessToken, {
    restaurantName: formData.get('restaurant'),
    contactName: formData.get('contactName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    operatingMode: formData.get('operatingMode'),
    packageTier: formData.get('packageTier'),
  });
  state.myTrialRequest = request;
  render();
}

function handleSignupSubmit(form) {
  form.reset();
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
        await handleTrialSubmit(form);
        if (message) message.textContent = 'Trial request sent.';
        return;
      }

      if (message) message.textContent = 'Submitted.';
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
