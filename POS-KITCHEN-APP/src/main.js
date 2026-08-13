import { api } from './shared/api.js';
import { STORE_ID_KEY, state } from './shared/state.js';
import { renderKitchenPage } from './pages/KitchenPage.js';

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
  await loadSessions();
  render();
  setInterval(() => {
    refreshBackground();
  }, 10000);
}

async function loadSessions() {
  state.loadingSessions = true;
  render();
  try {
    const data = await api(`/sessions?storeId=${state.storeId}&status=open&limit=50`);
    state.sessions = data.items || [];
    if (!state.selectedSessionId && state.sessions[0]) {
      state.selectedSessionId = state.sessions[0].id;
    }
    if (state.selectedSessionId) {
      await loadSelectedSession(state.selectedSessionId);
    }
  } catch {
    state.sessions = [];
    state.activeSession = null;
  } finally {
    state.loadingSessions = false;
    render();
  }
}

async function loadSelectedSession(id) {
  try {
    const session = await api(`/sessions/${id}?storeId=${state.storeId}`);
    state.activeSession = session;
    state.selectedSessionId = session.id;
  } catch {
    state.activeSession = null;
  }
}

async function refreshBackground() {
  try {
    await loadSessions();
  } catch {
    // Background refresh should not interrupt the display.
  }
}

async function switchStore(nextStoreId) {
  state.storeId = nextStoreId;
  localStorage.setItem(STORE_ID_KEY, String(nextStoreId));
  state.selectedSessionId = null;
  state.activeSession = null;
  await loadSessions();
}

function bindEvents() {
  app.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;

    try {
      if (action === 'refresh-sessions') {
        await loadSessions();
        toast('Updated');
      } else if (action === 'pick-session') {
        state.selectedSessionId = Number(button.dataset.id);
        await loadSelectedSession(state.selectedSessionId);
        render();
      }
    } catch (err) {
      toast(err.message);
    }
  });

  app.addEventListener('input', (event) => {
    const field = event.target.dataset.field;
    if (field !== 'storeId') return;
    const nextStoreId = Number(event.target.value || 1);
    if (nextStoreId !== state.storeId) {
      switchStore(nextStoreId);
    }
  });
}

function selectedSession() {
  if (!state.selectedSessionId) return state.activeSession;
  if (state.activeSession && state.activeSession.id === state.selectedSessionId) return state.activeSession;
  return state.sessions.find((item) => item.id === state.selectedSessionId) || state.activeSession;
}

function render() {
  document.title = 'POS Kitchen App';
  app.innerHTML = renderKitchenPage(state, selectedSession());
}

bootstrap().catch((err) => {
  state.toast = err.message;
  state.loadingSessions = false;
  render();
});
