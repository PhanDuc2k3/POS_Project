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
import { renderProfileSettingsPage } from './pages/ProfileSettingsPage.js';
import { renderAuditLogPage } from './pages/AuditLogPage.js';
import {
  changePassword,
  activateAccount,
  deleteAvatar,
  getActivity,
  getProfile,
  getSessions,
  login,
  logout,
  logoutAllDevices,
  requestSecurityQuestion,
  resetPassword,
  revokeSession,
  setSecurityQuestion,
  updateProfile,
  uploadAvatar,
  verifySecurityAnswer,
} from './services/auth.js';
import {
  bootstrap,
  createTenant,
  createOrder,
  getPublicOrderStatus,
  holdOrderProvisioning,
  approveOrder,
  approveTrialRequest,
  cancelOrder,
  confirmOrderPayment,
  inviteAccount,
  markOrderContacted,
  provisionOrder,
  quoteOrder,
  resendAccountInvite,
  rejectOrder,
  rejectTrialRequest,
  setTenantStatus,
  togglePermission,
  toggleTenantStatus,
  updateSalesLeadStatus,
  updateTenantPackage,
  waitOrderPayment,
} from './services/platform.js';
import { clearSession, getAccessToken, getRefreshToken, getUser } from './services/session.js';
import { esc, money } from './utils/format.js';
import { loadState, saveState } from './services/storage.js';
import { connectRealtime, disconnectRealtime } from './services/realtime.js';

const app = document.getElementById('app');
let state = loadState(initialState);
let realtimeRefreshTimer = null;

state.user = state.user || getUser();
state.authenticated = !!(getAccessToken() || getRefreshToken());

function selectedTenant() {
  return state.tenants.find((tenant) => tenant.id === state.selectedTenantId) || state.tenants[0] || null;
}

function tenantOverrides(tenant) {
  return {
    betaAnalytics: Boolean(tenant?.betaAnalytics),
    waiveSetupFee: tenant?.waiveSetupFee !== false,
  };
}

function tenantName(id) {
  return state.tenants.find((tenant) => tenant.id === id)?.name || 'Unknown tenant';
}

function setView(view) {
  state.activeView = view;
  saveState(state);
  render();
}

function syncProfileDraft() {
  state.profileDraft = {
    displayName: state.user?.displayName || '',
    email: state.user?.email || '',
  };
  state.securityDraft = {
    question: state.user?.securityQuestion || '',
    answer: '',
    currentPassword: '',
  };
  state.passwordDraft = {
    current: '',
    next: '',
    confirm: '',
  };
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
  if (!state.permissionDirty) {
    state.permissionDraft = clonePermissions(state.permissions);
  }

  if (!state.tenants.some((tenant) => tenant.id === state.selectedTenantId)) {
    state.selectedTenantId = state.tenants[0]?.id || null;
  }
  if (!state.packageDraft && state.packages[0]) {
    state.packageDraft = state.packages[0].id;
  }
  state.packageOverrides = tenantOverrides(selectedTenant());
  if (!state.roleDraft) {
    state.roleDraft = 'store_owner';
  }
  if (!state.permissionRole) {
    state.permissionRole = 'store_owner';
  }
}

async function loadPlatformData({ silent = false } = {}) {
  if (!silent) state.loading = true;
  state.error = '';
  if (!silent) render();
  try {
    const data = await bootstrap();
    applyBackendData(data);
    saveState(state);
  } catch (err) {
    state.error = err.message;
  } finally {
    if (!silent) state.loading = false;
    render();
  }
}

async function startRealtime() {
  try {
    await connectRealtime({
      onStatus: (status) => {
        state.realtime = { ...(state.realtime || {}), ...status };
        saveState(state);
        render();
      },
      onPlatformChange: (event) => handleRealtimePlatformChange(event),
    });
  } catch (err) {
    state.realtime = { ...(state.realtime || {}), connected: false, error: err.message };
    saveState(state);
    render();
  }
}

function handleRealtimePlatformChange(event) {
  const item = normalizeRealtimeEvent(event);
  const events = [item, ...(state.realtime?.events || [])].slice(0, 8);
  state.realtime = {
    ...(state.realtime || {}),
    unread: (state.realtime?.unread || 0) + 1,
    events,
  };
  saveState(state);
  render();

  clearTimeout(realtimeRefreshTimer);
  realtimeRefreshTimer = setTimeout(() => {
    loadPlatformData({ silent: true });
  }, 300);
}

function normalizeRealtimeEvent(event = {}) {
  const path = String(event.path || '');
  const data = event.data || {};
  let label = 'Platform data changed';
  let view = 'overview';

  if (path.includes('/trial-requests')) {
    label = `${event.method || 'POST'} trial request ${data.restaurantName || data.id || ''}`.trim();
    view = 'requests';
  } else if (path.includes('/sales-leads')) {
    label = `${event.method || 'POST'} sales lead ${data.name || data.id || ''}`.trim();
    view = 'requests';
  } else if (path.includes('/orders')) {
    label = `${event.method || 'POST'} order ${data.orderCode || data.id || ''}`.trim();
    view = 'orders';
  } else if (path.includes('/tenants')) {
    label = `${event.method || 'POST'} tenant ${data.name || data.id || ''}`.trim();
    view = 'tenants';
  } else if (path.includes('/accounts')) {
    label = `${event.method || 'POST'} account ${data.email || data.id || ''}`.trim();
    view = 'accounts';
  } else if (path.includes('/permissions')) {
    label = 'Permission configuration changed';
    view = 'permissions';
  }

  return {
    label,
    view,
    actor: event.actor || 'system',
    occurredAt: event.occurredAt || new Date().toISOString(),
  };
}

async function loadSecurityData() {
  state.loading = true;
  state.error = '';
  render();
  try {
    state.user = await getProfile();
    syncProfileDraft();
    const sessions = await getSessions();
    state.sessions = sessions;
    state.securityMessage = '';
    state.securityTone = 'info';
    saveState(state);
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function openSettingsView() {
  setView('settings');
  await loadSecurityData();
}

async function loadAuditData() {
  state.loading = true;
  state.error = '';
  render();
  try {
    const [sessions, activity] = await Promise.all([getSessions(), getActivity()]);
    state.sessions = sessions;
    state.activity = activity;
    saveState(state);
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function openAuditView() {
  setView('audit');
  await loadAuditData();
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
    syncProfileDraft();
    await loadPlatformData();
    await startRealtime();
    if (state.activeView === 'settings') await loadSecurityData();
    if (state.activeView === 'audit') await loadAuditData();
  } catch {
    disconnectRealtime();
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
    await startRealtime();
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function handleForgotQuestion() {
  const username = String(state.resetDraft?.username || '').trim();
  if (!username) {
    state.error = 'Enter your username';
    render();
    return;
  }
  state.loading = true;
  state.error = '';
  render();
  try {
    const data = await requestSecurityQuestion(username);
    state.resetDraft = { ...(state.resetDraft || {}), username, question: data.question || '' };
    state.authMessage = 'Security question loaded';
    saveState(state);
  } finally {
    state.loading = false;
    render();
  }
}

async function handleForgotVerify() {
  const draft = state.resetDraft || {};
  state.loading = true;
  state.error = '';
  render();
  try {
    const data = await verifySecurityAnswer(draft.username, draft.answer);
    state.resetDraft = { ...draft, resetToken: data.resetToken || '' };
    state.authMessage = `Answer verified. Reset token expires in ${data.expiresIn || 0} minutes.`;
    saveState(state);
  } finally {
    state.loading = false;
    render();
  }
}

async function handleForgotReset() {
  const draft = state.resetDraft || {};
  if (draft.newPassword !== draft.confirmPassword) {
    state.error = 'New password and confirmation do not match';
    render();
    return;
  }
  state.loading = true;
  state.error = '';
  render();
  try {
    await resetPassword(draft.resetToken, draft.newPassword);
    state.authMode = 'login';
    state.password = '';
    state.resetDraft = { username: '', question: '', answer: '', resetToken: '', newPassword: '', confirmPassword: '' };
    state.authMessage = 'Password reset. Please sign in.';
    saveState(state);
  } finally {
    state.loading = false;
    render();
  }
}

async function handleActivateAccount() {
  const draft = state.activationDraft || {};
  if (draft.newPassword !== draft.confirmPassword) {
    state.error = 'New password and confirmation do not match';
    render();
    return;
  }
  state.loading = true;
  state.error = '';
  render();
  try {
    await activateAccount(draft.activationToken, draft.newPassword);
    state.authMode = 'login';
    state.activationDraft = { activationToken: '', newPassword: '', confirmPassword: '' };
    state.authMessage = 'Account activated. Please sign in.';
    saveState(state);
  } finally {
    state.loading = false;
    render();
  }
}

async function handleRefresh() {
  await loadPlatformData();
}

async function handleSignOut() {
  disconnectRealtime();
  await logout();
  clearSession();
  state = {
    ...loadState(initialState),
    username: 'platform',
    password: '',
    rememberMe: true,
    authenticated: false,
    authLoading: false,
    authMode: 'login',
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
      if (action === 'view') {
        state.showNotifications = false;
        state.globalSearch = '';
        if (target.dataset.view === 'settings') await openSettingsView();
        else if (target.dataset.view === 'audit') await openAuditView();
        else setView(target.dataset.view);
      }
      if (action === 'open-overview-item') {
        state.showNotifications = false;
        state.globalSearch = '';
        state.activeView = target.dataset.view || 'overview';
        if (target.dataset.type === 'order') {
          state.selectedOrderId = target.dataset.id;
        }
        if (target.dataset.type === 'trial') {
          state.selectedTrialRequestId = target.dataset.id;
          state.selectedSalesLeadId = null;
        }
        if (target.dataset.type === 'lead') {
          state.selectedSalesLeadId = target.dataset.id;
          state.selectedTrialRequestId = null;
        }
        saveState(state);
        render();
      }
      if (action === 'select-package') {
        state.packageDraft = target.dataset.package;
        saveState(state);
        render();
      }
      if (action === 'login') await handleLogin();
      if (action === 'set-auth-mode') {
        state.authMode = target.dataset.mode || 'login';
        state.error = '';
        state.authMessage = '';
        saveState(state);
        render();
      }
      if (action === 'forgot-question') await handleForgotQuestion();
      if (action === 'forgot-verify') await handleForgotVerify();
      if (action === 'forgot-reset') await handleForgotReset();
      if (action === 'activate-account') await handleActivateAccount();
      if (action === 'refresh-data') await handleRefresh();
      if (action === 'sign-out') await handleSignOut();
      if (action === 'select-tenant') {
        const tenant = state.tenants.find((item) => item.id === Number(target.dataset.id));
        if (tenant) {
          state.selectedTenantId = tenant.id;
          state.packageDraft = tenant.packageTier;
          state.modeDraft = tenant.operatingMode;
          state.packageOverrides = tenantOverrides(tenant);
          saveState(state);
          render();
        }
      }
      if (action === 'apply-package') {
        if (target.dataset.package) state.packageDraft = target.dataset.package;
        await handleApplyPackage();
      }
      if (action === 'toggle-status') await handleToggleStatus(Number(target.dataset.id));
      if (action === 'export-tenants') handleExportTenants();
      if (action === 'set-tenant-page') {
        state.tenantPage = Number(target.dataset.page || 1);
        saveState(state);
        render();
      }
      if (action === 'toggle-tenant-selection') handleToggleSelection('selectedTenantIds', target.dataset.id, target.checked);
      if (action === 'toggle-all-tenants') handleToggleAllTenants(target.checked);
      if (action === 'clear-tenant-selection') {
        state.selectedTenantIds = [];
        saveState(state);
        render();
      }
      if (action === 'bulk-tenant-status') await handleBulkTenantStatus(target.dataset.status);
      if (action === 'approve-trial') await handleApproveTrial(target.dataset.id);
      if (action === 'reject-trial') await handleRejectTrial(target.dataset.id);
      if (action === 'create-order') await handleCreateOrder();
      if (action === 'lookup-public-order') await handleLookupPublicOrder();
      if (action === 'set-order-status-filter') {
        state.orderStatusFilter = target.dataset.status || 'all';
        saveState(state);
        render();
      }
      if (action === 'clear-public-order-lookup') {
        state.publicOrderLookupCode = '';
        state.publicOrderLookupResult = null;
        saveState(state);
        render();
      }
      if (action === 'set-trial-status-filter') {
        state.trialStatusFilter = target.dataset.status || 'all';
        state.selectedTrialRequestId = null;
        saveState(state);
        render();
      }
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
      if (action === 'open-create-tenant') {
        state.activeView = 'tenants';
        state.showCreateTenant = true;
        state.tenantDraft = normalizeTenantDraft(state.tenantDraft);
        saveState(state);
        render();
      }
      if (action === 'close-create-tenant') {
        state.showCreateTenant = false;
        saveState(state);
        render();
      }
      if (action === 'create-tenant') await handleCreateTenant();
      if (action === 'close-invite-account') {
        state.showInviteAccount = false;
        saveState(state);
        render();
      }
      if (action === 'select-trial-request') {
        state.selectedTrialRequestId = target.dataset.id;
        state.selectedSalesLeadId = null;
        saveState(state);
        render();
      }
      if (action === 'close-trial-request') {
        state.selectedTrialRequestId = null;
        saveState(state);
        render();
      }
      if (action === 'select-sales-lead') {
        state.selectedSalesLeadId = target.dataset.id;
        state.selectedTrialRequestId = null;
        saveState(state);
        render();
      }
      if (action === 'close-sales-lead') {
        state.selectedSalesLeadId = null;
        saveState(state);
        render();
      }
      if (action === 'update-sales-lead-status') await handleUpdateSalesLeadStatus(target.dataset.id, target.dataset.status);
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
      if (action === 'order-hold-provisioning') {
        if (confirm('Hold provisioning for this order?')) await handleOrderAction(holdOrderProvisioning, target.dataset.id);
      }
      if (action === 'invite-account') await handleInviteAccount();
      if (action === 'resend-account-invite') await handleResendAccountInvite(target.dataset.id);
      if (action === 'export-accounts') handleExportAccounts();
      if (action === 'set-account-page') {
        state.accountPage = Number(target.dataset.page || 1);
        saveState(state);
        render();
      }
      if (action === 'toggle-account-selection') handleToggleSelection('selectedAccountIds', target.dataset.id, target.checked);
      if (action === 'toggle-all-accounts') handleToggleAllAccounts(target.checked);
      if (action === 'clear-account-selection') {
        state.selectedAccountIds = [];
        saveState(state);
        render();
      }
      if (action === 'bulk-resend-invites') await handleBulkResendInvites();
      if (action === 'toggle-account-filters') {
        state.showAccountFilters = !state.showAccountFilters;
        saveState(state);
        render();
      }
      if (action === 'toggle-permission') {
        if (target.dataset.role) state.permissionRole = target.dataset.role;
        await handleTogglePermission(target.dataset.permission);
      }
      if (action === 'toggle-permission-draft') handleTogglePermissionDraft(target.dataset.role, target.dataset.permission, target.checked);
      if (action === 'discard-permissions') handleDiscardPermissions();
      if (action === 'save-permissions') await handleSavePermissions();
      if (action === 'toggle-package-comparison') {
        state.showPackageComparison = !state.showPackageComparison;
        saveState(state);
        render();
      }
      if (action === 'toggle-notifications') {
        state.showNotifications = !state.showNotifications;
        if (state.showNotifications) {
          state.realtime = { ...(state.realtime || {}), unread: 0 };
        }
        saveState(state);
        render();
      }
      if (action === 'clear-global-search') {
        state.globalSearch = '';
        saveState(state);
        render();
      }
      if (action === 'refresh-security-data') await loadSecurityData();
      if (action === 'refresh-audit-data') await loadAuditData();
      if (action === 'set-settings-panel') {
        state.settingsPanel = target.dataset.panel || '';
        saveState(state);
        render();
      }
      if (action === 'save-profile') await handleSaveProfile();
      if (action === 'save-security-question') await handleSaveSecurityQuestion();
      if (action === 'change-password') await handleChangePassword();
      if (action === 'delete-avatar') await handleDeleteAvatar();
      if (action === 'revoke-session') await handleRevokeSession(target.dataset.id);
      if (action === 'logout-all-devices') await handleLogoutAllDevices();
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
    if (field === 'resetUsername') state.resetDraft = { ...(state.resetDraft || {}), username: event.target.value };
    if (field === 'resetAnswer') state.resetDraft = { ...(state.resetDraft || {}), answer: event.target.value };
    if (field === 'resetNewPassword') state.resetDraft = { ...(state.resetDraft || {}), newPassword: event.target.value };
    if (field === 'resetConfirmPassword') state.resetDraft = { ...(state.resetDraft || {}), confirmPassword: event.target.value };
    if (field === 'activationToken') state.activationDraft = { ...(state.activationDraft || {}), activationToken: event.target.value };
    if (field === 'activationNewPassword') state.activationDraft = { ...(state.activationDraft || {}), newPassword: event.target.value };
    if (field === 'activationConfirmPassword') state.activationDraft = { ...(state.activationDraft || {}), confirmPassword: event.target.value };
    if (field === 'globalSearch') {
      state.globalSearch = event.target.value;
      state.showNotifications = false;
      shouldRender = true;
    }
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
        state.packageOverrides = tenantOverrides(tenant);
        shouldRender = true;
      }
    }
    if (field === 'inviteEmail') state.inviteEmail = event.target.value;
    if (field === 'publicOrderLookupCode') state.publicOrderLookupCode = event.target.value;
    if (field === 'tenantSearch') {
      state.tenantSearch = event.target.value;
      state.tenantPage = 1;
      shouldRender = true;
    }
    if (field === 'tenantPackageFilter') {
      state.tenantPackageFilter = event.target.value;
      state.tenantPage = 1;
      shouldRender = true;
    }
    if (field === 'tenantModeFilter') {
      state.tenantModeFilter = event.target.value;
      state.tenantPage = 1;
      shouldRender = true;
    }
    if (field === 'tenantStatusFilter') {
      state.tenantStatusFilter = event.target.value;
      state.tenantPage = 1;
      shouldRender = true;
    }
    if (field === 'trialSearch') {
      state.trialSearch = event.target.value;
      shouldRender = true;
    }
    if (field === 'trialPackageFilter') {
      state.trialPackageFilter = event.target.value;
      shouldRender = true;
    }
    if (field === 'trialModeFilter') {
      state.trialModeFilter = event.target.value;
      shouldRender = true;
    }
    if (field === 'trialSort') {
      state.trialSort = event.target.value;
      shouldRender = true;
    }
    if (field === 'orderStatusFilter') {
      state.orderStatusFilter = event.target.value;
      shouldRender = true;
    }
    if (field === 'orderPackageFilter') {
      state.orderPackageFilter = event.target.value;
      shouldRender = true;
    }
    if (field === 'orderDetailStatusFilter') {
      state.orderDetailStatusFilter = event.target.value;
      shouldRender = true;
    }
    if (field === 'orderDateFilter') {
      state.orderDateFilter = event.target.value;
      shouldRender = true;
    }
    if (field === 'accountSearch') {
      state.accountSearch = event.target.value;
      state.accountPage = 1;
      shouldRender = true;
    }
    if (field === 'accountTenantFilter') {
      state.accountTenantFilter = event.target.value;
      state.accountPage = 1;
      shouldRender = true;
    }
    if (field === 'accountRoleFilter') {
      state.accountRoleFilter = event.target.value;
      state.accountPage = 1;
      shouldRender = true;
    }
    if (field === 'accountStatusFilter') {
      state.accountStatusFilter = event.target.value;
      state.accountPage = 1;
      shouldRender = true;
    }
    if (field === 'permissionSearch') {
      state.permissionSearch = event.target.value;
      shouldRender = true;
    }
    if (field === 'tenantName') state.tenantDraft = { ...(state.tenantDraft || {}), name: event.target.value };
    if (field === 'tenantOwnerName') state.tenantDraft = { ...(state.tenantDraft || {}), ownerName: event.target.value };
    if (field === 'tenantOwnerEmail') state.tenantDraft = { ...(state.tenantDraft || {}), ownerEmail: event.target.value };
    if (field === 'tenantPackageTier') state.tenantDraft = { ...(state.tenantDraft || {}), packageTier: event.target.value };
    if (field === 'tenantOperatingMode') state.tenantDraft = { ...(state.tenantDraft || {}), operatingMode: event.target.value };
    if (field === 'tenantStatus') state.tenantDraft = { ...(state.tenantDraft || {}), status: event.target.value };
    if (field === 'tenantRenewalDate') state.tenantDraft = { ...(state.tenantDraft || {}), renewalDate: event.target.value };
    if (field === 'roleDraft') state.roleDraft = event.target.value;
    if (field === 'permissionRole') state.permissionRole = event.target.value;
    if (field === 'packageBetaAnalytics') {
      state.packageOverrides = { ...(state.packageOverrides || {}), betaAnalytics: event.target.checked };
      shouldRender = true;
    }
    if (field === 'packageWaiveSetupFee') {
      state.packageOverrides = { ...(state.packageOverrides || {}), waiveSetupFee: event.target.checked };
      shouldRender = true;
    }
    if (field === 'profileDisplayName') state.profileDraft = { ...(state.profileDraft || {}), displayName: event.target.value };
    if (field === 'profileEmail') state.profileDraft = { ...(state.profileDraft || {}), email: event.target.value };
    if (field === 'securityQuestion') state.securityDraft = { ...(state.securityDraft || {}), question: event.target.value };
    if (field === 'securityAnswer') state.securityDraft = { ...(state.securityDraft || {}), answer: event.target.value };
    if (field === 'securityCurrentPassword') state.securityDraft = { ...(state.securityDraft || {}), currentPassword: event.target.value };
    if (field === 'passwordCurrent') state.passwordDraft = { ...(state.passwordDraft || {}), current: event.target.value };
    if (field === 'passwordNew') state.passwordDraft = { ...(state.passwordDraft || {}), next: event.target.value };
    if (field === 'passwordConfirm') state.passwordDraft = { ...(state.passwordDraft || {}), confirm: event.target.value };
    saveState(state);
    if (shouldRender) render();
  });

  app.addEventListener('change', async (event) => {
    const target = event.target;
    if (target?.dataset?.action !== 'upload-avatar') return;
    const file = target.files?.[0];
    if (!file) return;
    try {
      await handleUploadAvatar(file);
    } catch (err) {
      state.error = err.message;
      render();
    }
  });
}

async function handleApplyPackage() {
  const tenant = selectedTenant();
  if (!tenant) return;
  await updateTenantPackage(tenant.id, state.packageDraft, state.modeDraft, {
    betaAnalytics: Boolean(state.packageOverrides?.betaAnalytics),
    waiveSetupFee: state.packageOverrides?.waiveSetupFee !== false,
  });
  const overrides = [];
  if (state.packageOverrides?.betaAnalytics) overrides.push('Beta Analytics');
  if (state.packageOverrides?.waiveSetupFee !== false) overrides.push('setup fee waived');
  state.packageMessage = overrides.length ? `Package applied with ${overrides.join(' and ')}.` : 'Package applied without overrides.';
  await loadPlatformData();
}

async function handleToggleStatus(id) {
  await toggleTenantStatus(id);
  await loadPlatformData();
}

function handleToggleSelection(key, id, checked) {
  if (!id) return;
  const selected = new Set((state[key] || []).map(String));
  if (checked) selected.add(String(id));
  else selected.delete(String(id));
  state[key] = [...selected];
  saveState(state);
  render();
}

function handleToggleAllTenants(checked) {
  const ids = getFilteredTenants().slice((Number(state.tenantPage || 1) - 1) * 10, Number(state.tenantPage || 1) * 10).map((tenant) => String(tenant.id));
  const selected = new Set((state.selectedTenantIds || []).map(String));
  ids.forEach((id) => (checked ? selected.add(id) : selected.delete(id)));
  state.selectedTenantIds = [...selected];
  saveState(state);
  render();
}

function handleToggleAllAccounts(checked) {
  const ids = getFilteredAccounts().slice((Number(state.accountPage || 1) - 1) * 10, Number(state.accountPage || 1) * 10).map((account) => String(account.id));
  const selected = new Set((state.selectedAccountIds || []).map(String));
  ids.forEach((id) => (checked ? selected.add(id) : selected.delete(id)));
  state.selectedAccountIds = [...selected];
  saveState(state);
  render();
}

async function handleBulkTenantStatus(status) {
  const desired = String(status || '').toLowerCase();
  const ids = new Set((state.selectedTenantIds || []).map(String));
  const targets = (state.tenants || []).filter((tenant) => ids.has(String(tenant.id)) && String(tenant.status || '').toLowerCase() !== desired);
  state.loading = true;
  state.error = '';
  render();
  try {
    for (const tenant of targets) {
      await setTenantStatus(tenant.id, desired);
    }
    state.selectedTenantIds = [];
    await loadPlatformData();
    state.activeView = 'tenants';
    saveState(state);
    render();
  } catch (err) {
    state.loading = false;
    throw err;
  }
}

async function handleBulkResendInvites() {
  const ids = state.selectedAccountIds || [];
  if (!ids.length) return;
  state.loading = true;
  state.error = '';
  render();
  try {
    for (const id of ids) {
      await resendAccountInvite(id);
    }
    state.selectedAccountIds = [];
    await loadPlatformData();
    state.activeView = 'accounts';
    saveState(state);
    render();
  } catch (err) {
    state.loading = false;
    throw err;
  }
}

async function handleCreateOrder() {
  const tenant = selectedTenant();
  if (!tenant) return;
  await createOrder(tenant.id, state.packageDraft);
  await loadPlatformData();
}

async function handleLookupPublicOrder() {
  const orderCode = String(state.publicOrderLookupCode || '').trim();
  if (!orderCode) {
    state.error = 'Enter a public order code to look up';
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();
  try {
    state.publicOrderLookupResult = await getPublicOrderStatus(orderCode);
    saveState(state);
  } catch (err) {
    state.publicOrderLookupResult = null;
    throw err;
  } finally {
    state.loading = false;
    render();
  }
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

function handleExportTenants() {
  const selected = new Set((state.selectedTenantIds || []).map(String));
  const source = selected.size ? getFilteredTenants().filter((tenant) => selected.has(String(tenant.id))) : getFilteredTenants();
  const rows = source.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    ownerName: tenant.ownerName || tenant.owner || '',
    ownerEmail: tenant.ownerEmail || tenant.email || '',
    packageTier: tenant.packageTier,
    operatingMode: tenant.operatingMode,
    status: tenant.status,
    branches: tenant.branches,
    users: tenant.users,
    renewalDate: tenant.renewalDate,
  }));
  downloadCsv('tenants.csv', rows);
}

function handleExportAccounts() {
  const selected = new Set((state.selectedAccountIds || []).map(String));
  const source = selected.size ? getFilteredAccounts().filter((account) => selected.has(String(account.id))) : getFilteredAccounts();
  const rows = source.map((account) => ({
    id: account.id,
    tenantId: account.tenantId,
    name: account.name,
    email: account.email,
    role: account.role,
    status: account.status,
    activationSentAt: account.activationSentAt || '',
  }));
  downloadCsv('accounts.csv', rows);
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

async function handleUpdateSalesLeadStatus(id, status) {
  if (!id || !status) return;
  state.loading = true;
  state.error = '';
  render();
  try {
    await updateSalesLeadStatus(id, status);
    await loadPlatformData();
    state.activeView = 'requests';
    state.selectedSalesLeadId = id;
    saveState(state);
    render();
  } catch (err) {
    state.loading = false;
    throw err;
  }
}

async function handleInviteAccount() {
  const tenant = selectedTenant();
  if (!tenant || !String(state.inviteEmail || '').trim()) return;
  await inviteAccount(tenant.id, state.inviteEmail.trim(), state.roleDraft);
  state.inviteEmail = '';
  state.showInviteAccount = false;
  await loadPlatformData();
}

async function handleResendAccountInvite(id) {
  if (!id) return;
  state.loading = true;
  state.error = '';
  render();
  try {
    await resendAccountInvite(id);
    await loadPlatformData();
    state.activeView = 'accounts';
    state.selectedAccountId = id;
    saveState(state);
    render();
  } catch (err) {
    state.loading = false;
    throw err;
  }
}

async function handleCreateTenant() {
  const draft = normalizeTenantDraft(state.tenantDraft);
  if (!draft.name || !draft.ownerName || !draft.ownerEmail) {
    state.error = 'Tenant name, owner name, and owner email are required';
    state.tenantDraft = draft;
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();
  try {
    await createTenant({
      name: draft.name,
      ownerName: draft.ownerName,
      ownerEmail: draft.ownerEmail,
      packageTier: draft.packageTier,
      operatingMode: draft.operatingMode,
      status: draft.status,
      renewalDate: draft.renewalDate || null,
    });
    state.showCreateTenant = false;
    state.tenantDraft = normalizeTenantDraft();
    state.activeView = 'tenants';
    await loadPlatformData();
  } catch (err) {
    state.loading = false;
    throw err;
  }
}

function normalizeTenantDraft(draft = {}) {
  return {
    name: String(draft.name || '').trim(),
    ownerName: String(draft.ownerName || '').trim(),
    ownerEmail: String(draft.ownerEmail || '').trim(),
    packageTier: draft.packageTier || state.packages?.[0]?.id || 'trial',
    operatingMode: draft.operatingMode || 'simple',
    status: draft.status || 'active',
    renewalDate: draft.renewalDate || '',
  };
}

async function handleTogglePermission(permission) {
  if (!permission) return;
  await togglePermission(state.permissionRole, permission);
  await loadPlatformData();
}

function handleTogglePermissionDraft(role, permission, checked) {
  if (!role || !permission) return;
  const draft = clonePermissions(state.permissionDraft || state.permissions || {});
  const rolePermissions = new Set(draft[role] || []);
  if (checked) rolePermissions.add(permission);
  else rolePermissions.delete(permission);
  draft[role] = [...rolePermissions];
  state.permissionDraft = draft;
  state.permissionDirty = true;
  saveState(state);
  render();
}

function handleDiscardPermissions() {
  state.permissionDraft = clonePermissions(state.permissions || {});
  state.permissionDirty = false;
  saveState(state);
  render();
}

async function handleSavePermissions() {
  const original = state.permissions || {};
  const draft = state.permissionDraft || {};
  const changes = [];
  Object.keys(draft).forEach((role) => {
    const before = new Set(original[role] || []);
    const after = new Set(draft[role] || []);
    [...before].forEach((permission) => {
      if (!after.has(permission)) changes.push([role, permission]);
    });
    [...after].forEach((permission) => {
      if (!before.has(permission)) changes.push([role, permission]);
    });
  });

  if (!changes.length) {
    state.permissionDirty = false;
    saveState(state);
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();
  try {
    for (const [role, permission] of changes) {
      await togglePermission(role, permission);
    }
    state.permissionDirty = false;
    await loadPlatformData();
    state.activeView = 'permissions';
    saveState(state);
    render();
  } catch (err) {
    state.loading = false;
    throw err;
  }
}

function clonePermissions(permissions) {
  return Object.fromEntries(Object.entries(permissions || {}).map(([role, items]) => [role, [...(items || [])]]));
}

function getFilteredTenants() {
  const query = String(state.tenantSearch || '').trim().toLowerCase();
  return (state.tenants || []).filter((tenant) => {
    const packageMatch = state.tenantPackageFilter === 'all' || !state.tenantPackageFilter || tenant.packageTier === state.tenantPackageFilter;
    const modeMatch = state.tenantModeFilter === 'all' || !state.tenantModeFilter || tenant.operatingMode === state.tenantModeFilter;
    const statusMatch = state.tenantStatusFilter === 'all' || !state.tenantStatusFilter || String(tenant.status || '').toLowerCase() === state.tenantStatusFilter;
    const haystack = [tenant.id, tenant.name, tenant.ownerName, tenant.ownerEmail, tenant.packageTier, tenant.operatingMode].join(' ').toLowerCase();
    return packageMatch && modeMatch && statusMatch && (!query || haystack.includes(query));
  });
}

function getFilteredAccounts() {
  const query = String(state.accountSearch || '').trim().toLowerCase();
  return (state.accounts || []).filter((account) => {
    const tenantMatch = state.accountTenantFilter === 'all' || !state.accountTenantFilter || String(account.tenantId) === String(state.accountTenantFilter);
    const roleMatch = state.accountRoleFilter === 'all' || !state.accountRoleFilter || account.role === state.accountRoleFilter;
    const statusMatch = state.accountStatusFilter === 'all' || !state.accountStatusFilter || String(account.status || '').toLowerCase() === state.accountStatusFilter;
    const haystack = [account.id, account.name, account.email, account.role, tenantName(account.tenantId)].join(' ').toLowerCase();
    return tenantMatch && roleMatch && statusMatch && (!query || haystack.includes(query));
  });
}

function downloadCsv(filename, rows) {
  if (!rows.length) {
    state.error = 'No rows to export';
    render();
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function handleSaveProfile() {
  const draft = state.profileDraft || {};
  state.loading = true;
  render();
  await updateProfile(String(draft.displayName || '').trim(), String(draft.email || '').trim());
  state.user = await getProfile();
  syncProfileDraft();
  state.securityMessage = 'Profile updated';
  state.securityTone = 'success';
  state.settingsPanel = '';
  state.loading = false;
  saveState(state);
  render();
}

async function handleSaveSecurityQuestion() {
  const draft = state.securityDraft || {};
  state.loading = true;
  render();
  await setSecurityQuestion(draft.question, draft.answer, draft.currentPassword);
  state.user = await getProfile();
  syncProfileDraft();
  state.securityMessage = 'Security question updated';
  state.securityTone = 'success';
  state.settingsPanel = '';
  state.loading = false;
  saveState(state);
  render();
}

async function handleChangePassword() {
  const draft = state.passwordDraft || {};
  if (draft.next !== draft.confirm) {
    state.securityMessage = 'New password and confirmation do not match';
    state.securityTone = 'danger';
    render();
    return;
  }
  state.loading = true;
  render();
  await changePassword(draft.current, draft.next);
  await logout();
  clearSession();
  state.authenticated = false;
  state.user = null;
  state.password = '';
  state.error = 'Password changed. Please sign in again.';
  state.loading = false;
  saveState(state);
  render();
}

async function handleUploadAvatar(file) {
  if (file.size > 2 * 1024 * 1024) {
    state.securityMessage = 'Avatar must be 2MB or smaller';
    state.securityTone = 'danger';
    render();
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  state.loading = true;
  render();
  await uploadAvatar(dataUrl);
  state.user = await getProfile();
  syncProfileDraft();
  state.securityMessage = 'Avatar updated';
  state.securityTone = 'success';
  state.settingsPanel = '';
  state.loading = false;
  saveState(state);
  render();
}

async function handleDeleteAvatar() {
  state.loading = true;
  render();
  await deleteAvatar();
  state.user = await getProfile();
  syncProfileDraft();
  state.securityMessage = 'Avatar removed';
  state.securityTone = 'success';
  state.settingsPanel = '';
  state.loading = false;
  saveState(state);
  render();
}

async function handleRevokeSession(id) {
  if (!id) return;
  await revokeSession(id);
  if (state.activeView === 'audit') await loadAuditData();
  else await loadSecurityData();
  state.securityMessage = 'Session revoked';
  state.securityTone = 'success';
  render();
}

async function handleLogoutAllDevices() {
  if (!confirm('Log out all devices for this account? You will need to sign in again.')) return;
  disconnectRealtime();
  state.loading = true;
  render();
  await logoutAllDevices();
  state = {
    ...loadState(initialState),
    username: 'platform',
    password: '',
    rememberMe: true,
    authenticated: false,
    authLoading: false,
    authMode: 'login',
    user: null,
    loading: false,
    error: 'All devices have been logged out. Please sign in again.',
  };
  saveState(state);
  render();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read avatar file'));
    reader.readAsDataURL(file);
  });
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
    settings: 'Profile & security',
    audit: 'Audit log',
  };
  return titles[state.activeView] || 'Platform admin';
}

function globalSearchResults() {
  const query = String(state.globalSearch || '').trim().toLowerCase();
  if (!query) return [];
  const rows = [
    ...(state.tenants || []).map((item) => ({ type: 'Tenant', label: item.name, meta: item.ownerEmail || item.packageTier, view: 'tenants' })),
    ...(state.orders || []).map((item) => ({ type: 'Order', label: item.orderCode || item.id, meta: [item.customerName, item.companyName, item.status].filter(Boolean).join(' / '), view: 'orders', id: item.id })),
    ...(state.accounts || []).map((item) => ({ type: 'Account', label: item.name || item.email, meta: [item.email, item.role].filter(Boolean).join(' / '), view: 'accounts', id: item.id })),
    ...(state.trialRequests || []).map((item) => ({ type: 'Trial', label: item.restaurantName, meta: [item.contactName, item.status].filter(Boolean).join(' / '), view: 'requests', id: item.id })),
  ];
  return rows.filter((row) => [row.type, row.label, row.meta].join(' ').toLowerCase().includes(query)).slice(0, 8);
}

function renderGlobalSearchPanel() {
  const results = globalSearchResults();
  if (!state.globalSearch) return '';
  return `
    <div class="global-search-panel">
      <header>
        <span>${esc(results.length)} results</span>
        <button type="button" data-action="clear-global-search">Clear</button>
      </header>
      ${results.map((item) => `
        <button type="button" data-action="view" data-view="${esc(item.view)}">
          <b>${esc(item.type)}</b>
          <strong>${esc(item.label || '-')}</strong>
          <small>${esc(item.meta || '-')}</small>
        </button>
      `).join('') || '<p>No matches found</p>'}
    </div>
  `;
}

function renderNotifications() {
  if (!state.showNotifications) return '';
  const pendingTrials = (state.trialRequests || []).filter((item) => String(item.status || '').toLowerCase() === 'pending').length;
  const newLeads = (state.salesLeads || []).filter((item) => String(item.status || '').toLowerCase() === 'new').length;
  const provisioning = (state.orders || []).filter((item) => ['PROVISIONING', 'PROVISIONING_FAILED', 'ON_HOLD'].includes(String(item.status || '').toUpperCase())).length;
  const events = state.realtime?.events || [];
  return `
    <div class="notification-panel">
      <header>
        <strong>Notifications</strong>
        <small class="${state.realtime?.connected ? 'realtime-on' : 'realtime-off'}">${state.realtime?.connected ? 'Live' : 'Offline'}</small>
      </header>
      <button type="button" data-action="view" data-view="requests"><span>${esc(pendingTrials)}</span> pending trial requests</button>
      <button type="button" data-action="view" data-view="requests"><span>${esc(newLeads)}</span> new sales leads</button>
      <button type="button" data-action="view" data-view="orders"><span>${esc(provisioning)}</span> provisioning items</button>
      ${events.length ? `
        <div class="realtime-events">
          ${events.map((item) => `
            <button type="button" data-action="view" data-view="${esc(item.view)}">
              <span></span>
              <strong>${esc(item.label)}</strong>
              <small>${esc(item.actor)} &middot; ${esc(formatRealtimeTime(item.occurredAt))}</small>
            </button>
          `).join('')}
        </div>
      ` : '<p>No realtime updates yet</p>'}
      ${state.realtime?.error ? `<p>${esc(state.realtime.error)}</p>` : ''}
    </div>
  `;
}

function formatRealtimeTime(value) {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
              <input data-field="globalSearch" value="${esc(state.globalSearch || '')}" aria-label="Search" placeholder="Search tenants, orders, packages..." />
            </label>
            ${renderGlobalSearchPanel()}
          </div>
          <div class="topbar-actions">
            <button class="top-icon notification-trigger ${state.realtime?.connected ? 'live' : ''}" data-action="toggle-notifications" aria-label="Notifications">
              ${state.realtime?.unread ? `<span>${esc(state.realtime.unread)}</span>` : ''}
            </button>
            <button class="top-icon settings" data-action="view" data-view="settings" aria-label="Settings"></button>
            <button class="top-avatar" data-action="view" data-view="settings" aria-label="${esc(state.user?.username || 'platform')}"></button>
            ${renderNotifications()}
          </div>
        </header>

        <div class="content-scroll">
          ${state.activeView === 'overview' ? renderOverviewPage(state, { selectedTenant, tenantName }) : ''}
          ${state.activeView === 'requests' ? renderTrialRequestsPage(state) : ''}
          ${state.activeView === 'tenants' ? renderTenantsPage(state, { selectedTenant }) : ''}
          ${state.activeView === 'packages' ? renderPackagesPage(state, { selectedTenant }) : ''}
          ${state.activeView === 'accounts' ? renderAccountsPage(state, { selectedTenant }) : ''}
          ${state.activeView === 'orders' ? renderOrdersPage(state, { tenantName }) : ''}
          ${state.activeView === 'permissions' ? renderPermissionsPage(state) : ''}
          ${state.activeView === 'settings' ? renderProfileSettingsPage(state) : ''}
          ${state.activeView === 'audit' ? renderAuditLogPage(state) : ''}
        </div>
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
