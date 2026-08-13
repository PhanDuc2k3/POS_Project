import { renderFooter } from './components/Footer.js';
import { renderHeader } from './components/Header.js';
import { renderHomePage } from './pages/HomePage.js';
import {
  clearStoredAuth,
  getMe,
  getMyTrialRequest,
  getStoredAuth,
  login,
  setStoredAuth,
  submitTrialRequest,
} from './shared/api.js';

const app = document.getElementById('app');

const state = {
  user: null,
  myTrialRequest: null,
  accessToken: '',
  refreshToken: '',
  ready: false,
};

function render() {
  app.innerHTML = `
    ${renderHeader()}
    ${renderHomePage(state)}
    ${renderFooter()}
  `;
  syncLockedForms();
}

function syncLockedForms() {
  const locked = !state.user || ['pending', 'approved'].includes(state.myTrialRequest?.status);
  app.querySelectorAll('form[data-form="trial"] input, form[data-form="trial"] select, form[data-form="trial"] button')
    .forEach((el) => {
      el.disabled = locked;
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

async function handleLogin(form) {
  const formData = new FormData(form);
  const result = await login({
    username: String(formData.get('username') || '').trim(),
    password: String(formData.get('password') || ''),
  });
  setSession(result, result.user);
  state.myTrialRequest = await getMyTrialRequest(state.accessToken).catch(() => null);
  render();
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

function bindEvents() {
  app.addEventListener('click', async (event) => {
    const menuButton = event.target.closest('.menu-button');
    if (menuButton) {
      const isOpen = document.body.classList.toggle('nav-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
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
        await handleLogin(form);
        if (message) message.textContent = 'Signed in.';
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
await loadSession();
