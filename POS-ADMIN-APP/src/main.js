import { renderSidebar } from './components/Sidebar.js';
import { renderMetricCard } from './components/MetricCard.js';
import { initialState, packageCatalog } from './data/platform.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderOverviewPage } from './pages/OverviewPage.js';
import { renderTenantsPage } from './pages/TenantsPage.js';
import { renderTrialRequestsPage } from './pages/TrialRequestsPage.js';
import { renderPackagesPage } from './pages/PackagesPage.js';
import { renderAccountsPage } from './pages/AccountsPage.js';
import { renderOrdersPage } from './pages/OrdersPage.js';
import { renderPermissionsPage } from './pages/PermissionsPage.js';
import { login, logout, getProfile } from './services/auth.js';
import {
  bootstrap,
  createOrder,
  approveOrder,
  approveTrialRequest,
  cancelOrder,
  confirmOrderPayment,
  inviteAccount,
  markOrderContacted,
  provisionOrder,
  quoteOrder,
  rejectOrder,
  rejectTrialRequest,
  togglePermission,
  toggleTenantStatus,
  updateTenantPackage,
  waitOrderPayment,
} from './services/platform.js';
import { clearSession, getAccessToken, getRefreshToken, getUser } from './services/session.js';
import { esc, money } from './utils/format.js';
import { loadState, saveState } from './services/storage.js';

const app = document.getElementById('app');
let state = loadState(initialState);

state.user = state.user || getUser();
state.authenticated = !!(getAccessToken() || getRefreshToken());

function selectedTenant() {
  return state.tenants.find((tenant) => tenant.id === state.selectedTenantId) || state.tenants[0] || null;
}

function tenantName(id) {
  return state.tenants.find((tenant) => tenant.id === id)?.name || 'Unknown tenant';
}

function setView(view) {
  state.activeView = view;
  saveState(state);
  render();
}

function applyBackendData(data) {
  state.summary = data.summary || state.summary;
  state.tenants = data.tenants || [];
  state.trialRequests = data.trialRequests || [];
  state.salesLeads = data.salesLeads || [];
  state.packages = data.packages || [];
  state.orders = data.orders || [];
  state.accounts = data.accounts || [];
  state.permissions = Object.fromEntries((data.permissions || []).map((item) => [item.role, item.permissions]));

  if (!state.tenants.some((tenant) => tenant.id === state.selectedTenantId)) {
    state.selectedTenantId = state.tenants[0]?.id || null;
  }
  if (!state.packageDraft && state.packages[0]) {
    state.packageDraft = state.packages[0].id;
  }
  if (!state.roleDraft) {
    state.roleDraft = 'store_owner';
  }
  if (!state.permissionRole) {
    state.permissionRole = 'store_owner';
  }
}

async function loadPlatformData() {
  state.loading = true;
  state.error = '';
  render();
  try {
    const data = await bootstrap();
    applyBackendData(data);
    saveState(state);
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function ensureAuthenticated() {
  const hasToken = !!(getAccessToken() || getRefreshToken());
  if (!hasToken) {
    state.authenticated = false;
    state.authLoading = false;
    state.user = null;
    render();
    return;
  }

  try {
    state.user = await getProfile();
    state.authenticated = true;
    await loadPlatformData();
  } catch {
    clearSession();
    state.user = null;
    state.authenticated = false;
  } finally {
    state.authLoading = false;
    render();
  }
}

async function handleLogin() {
  const username = String(state.username || '').trim();
  const password = String(state.password || '').trim();
  if (!username || !password) {
    state.error = 'Enter username and password';
    render();
    return;
  }

  state.error = '';
  state.loading = true;
  render();
  try {
    const user = await login(username, password, state.rememberMe !== false);
    state.user = user;
    state.authenticated = true;
    state.password = '';
    await loadPlatformData();
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function handleRefresh() {
  await loadPlatformData();
}

async function handleSignOut() {
  await logout();
  clearSession();
  state = {
    ...loadState(initialState),
    username: 'platform',
    password: '',
    rememberMe: true,
    authenticated: false,
    authLoading: false,
    user: null,
    loading: false,
    error: '',
  };
  saveState(state);
  render();
}

function bindEvents() {
  app.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    try {
      if (action === 'view') setView(target.dataset.view);
      if (action === 'select-package') {
        state.packageDraft = target.dataset.package;
        saveState(state);
        render();
      }
      if (action === 'login') await handleLogin();
      if (action === 'refresh-data') await handleRefresh();
      if (action === 'sign-out') await handleSignOut();
      if (action === 'select-tenant') {
        const tenant = state.tenants.find((item) => item.id === Number(target.dataset.id));
        if (tenant) {
          state.selectedTenantId = tenant.id;
          state.packageDraft = tenant.packageTier;
          state.modeDraft = tenant.operatingMode;
          saveState(state);
          render();
        }
      }
      if (action === 'apply-package') {
        if (target.dataset.package) state.packageDraft = target.dataset.package;
        await handleApplyPackage();
      }
      if (action === 'toggle-status') await handleToggleStatus(Number(target.dataset.id));
      if (action === 'approve-trial') await handleApproveTrial(target.dataset.id);
      if (action === 'reject-trial') await handleRejectTrial(target.dataset.id);
      if (action === 'create-order') await handleCreateOrder();
      if (action === 'select-order') {
        state.selectedOrderId = target.dataset.id;
        saveState(state);
        render();
      }
      if (action === 'close-order-detail') {
        state.selectedOrderId = null;
        saveState(state);
        render();
      }
      if (action === 'select-account') {
        state.selectedAccountId = target.dataset.id;
        saveState(state);
        render();
      }
      if (action === 'close-account-detail') {
        state.selectedAccountId = null;
        saveState(state);
        render();
      }
      if (action === 'open-invite-account') {
        state.showInviteAccount = true;
        saveState(state);
        render();
      }
      if (action === 'close-invite-account') {
        state.showInviteAccount = false;
        saveState(state);
        render();
      }
      if (action === 'select-trial-request') {
        state.selectedTrialRequestId = target.dataset.id;
        saveState(state);
        render();
      }
      if (action === 'close-trial-request') {
        state.selectedTrialRequestId = null;
        saveState(state);
        render();
      }
      if (action === 'order-contact') await handleOrderAction(markOrderContacted, target.dataset.id);
      if (action === 'order-quote') await handleOrderAction(quoteOrder, target.dataset.id);
      if (action === 'order-wait-payment') await handleOrderAction(waitOrderPayment, target.dataset.id);
      if (action === 'order-confirm-payment') await handleOrderAction(confirmOrderPayment, target.dataset.id);
      if (action === 'order-approve') {
        if (confirm('Approve this order?')) await handleOrderAction(approveOrder, target.dataset.id);
      }
      if (action === 'order-reject') {
        if (confirm('Reject this order?')) await handleOrderAction((id) => rejectOrder(id, 'Rejected by platform admin'), target.dataset.id);
      }
      if (action === 'order-cancel') {
        if (confirm('Cancel this order?')) await handleOrderAction(cancelOrder, target.dataset.id);
      }
      if (action === 'order-provision') {
        if (confirm('Provision tenant for this order?')) await handleOrderAction(provisionOrder, target.dataset.id);
      }
      if (action === 'invite-account') await handleInviteAccount();
      if (action === 'toggle-permission') {
        if (target.dataset.role) state.permissionRole = target.dataset.role;
        await handleTogglePermission(target.dataset.permission);
      }
    } catch (err) {
      state.error = err.message;
      render();
    }
  });

  app.addEventListener('input', (event) => {
    const field = event.target.dataset.field;
    if (!field) return;
    let shouldRender = false;

    if (field === 'username') state.username = event.target.value;
    if (field === 'password') state.password = event.target.value;
    if (field === 'rememberMe') state.rememberMe = event.target.checked;
    if (field === 'packageDraft') {
      state.packageDraft = event.target.value;
      shouldRender = true;
    }
    if (field === 'modeDraft') state.modeDraft = event.target.value;
    if (field === 'selectedTenantId') {
      const tenant = state.tenants.find((item) => String(item.id) === String(event.target.value));
      if (tenant) {
        state.selectedTenantId = tenant.id;
        state.packageDraft = tenant.packageTier;
        state.modeDraft = tenant.operatingMode;
        shouldRender = true;
      }
    }
    if (field === 'inviteEmail') state.inviteEmail = event.target.value;
    if (field === 'roleDraft') state.roleDraft = event.target.value;
    if (field === 'permissionRole') state.permissionRole = event.target.value;
    saveState(state);
    if (shouldRender) render();
  });
}

async function handleApplyPackage() {
  const tenant = selectedTenant();
  if (!tenant) return;
  await updateTenantPackage(tenant.id, state.packageDraft, state.modeDraft);
  await loadPlatformData();
}

async function handleToggleStatus(id) {
  await toggleTenantStatus(id);
  await loadPlatformData();
}

async function handleCreateOrder() {
  const tenant = selectedTenant();
  if (!tenant) return;
  await createOrder(tenant.id, state.packageDraft);
  await loadPlatformData();
}

async function handleOrderAction(actionFn, id) {
  if (!id) return;
  state.loading = true;
  render();
  await actionFn(id);
  await loadPlatformData();
  state.selectedOrderId = id;
  state.activeView = 'orders';
  saveState(state);
  render();
}

async function handleApproveTrial(id) {
  if (!id) return;
  await approveTrialRequest(id);
  await loadPlatformData();
  state.activeView = 'requests';
  saveState(state);
  render();
}

async function handleRejectTrial(id) {
  if (!id) return;
  await rejectTrialRequest(id);
  await loadPlatformData();
  state.activeView = 'requests';
  saveState(state);
  render();
}

async function handleInviteAccount() {
  const tenant = selectedTenant();
  if (!tenant || !String(state.inviteEmail || '').trim()) return;
  await inviteAccount(tenant.id, state.inviteEmail.trim(), state.roleDraft);
  state.inviteEmail = '';
  state.showInviteAccount = false;
  await loadPlatformData();
}

async function handleTogglePermission(permission) {
  if (!permission) return;
  await togglePermission(state.permissionRole, permission);
  await loadPlatformData();
}

function viewTitle() {
  const titles = {
    overview: 'Platform overview',
    requests: 'Trial requests',
    tenants: 'Tenant management',
    packages: 'Package setup',
    accounts: 'Account control',
    orders: 'Subscription orders',
    permissions: 'Permission matrix',
  };
  return titles[state.activeView] || 'Platform admin';
}

function renderAppShell() {
  return `
    <div class="admin-shell">
      ${renderSidebar(state.activeView)}
      <main class="content">
        <header class="topbar">
          <div class="topbar-left">
            <label class="top-search">
              <i></i>
              <input aria-label="Search" placeholder="Search tenants, orders, packages..." />
            </label>
          </div>
          <div class="topbar-actions">
            <button class="top-icon" aria-label="Notifications"></button>
            <button class="top-icon settings" aria-label="Settings"></button>
            <button class="top-avatar" aria-label="${esc(state.user?.username || 'platform')}"></button>
          </div>
        </header>

        ${state.activeView === 'overview' ? renderOverviewPage(state, { selectedTenant, tenantName }) : ''}
        ${state.activeView === 'requests' ? renderTrialRequestsPage(state) : ''}
        ${state.activeView === 'tenants' ? renderTenantsPage(state, { selectedTenant }) : ''}
        ${state.activeView === 'packages' ? renderPackagesPage(state, { selectedTenant }) : ''}
        ${state.activeView === 'accounts' ? renderAccountsPage(state, { selectedTenant }) : ''}
        ${state.activeView === 'orders' ? renderOrdersPage(state, { tenantName }) : ''}
        ${state.activeView === 'permissions' ? renderPermissionsPage(state) : ''}
      </main>
    </div>
  `;
}

function render() {
  if (state.authLoading) {
    app.innerHTML = '<div class="loading">Loading...</div>';
    return;
  }

  if (!state.authenticated) {
    app.innerHTML = renderLoginPage(state);
    return;
  }

  app.innerHTML = `
    ${renderAppShell()}
    ${state.loading ? '<div class="toast">Loading platform data...</div>' : ''}
    ${state.error ? `<div class="toast">${esc(state.error)}</div>` : ''}
  `;
}

bindEvents();
ensureAuthenticated();
