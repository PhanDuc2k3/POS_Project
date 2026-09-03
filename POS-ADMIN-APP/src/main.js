import { renderSidebar } from './components/Sidebar.js';
import { renderMetricCard } from './components/MetricCard.js';
import { initialState, packageCatalog } from './data/platform.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderOverviewPage } from './pages/OverviewPage.js';
import { renderTenantsPage } from './pages/TenantsPage.js';
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
  banAccount,
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
  updatePackage,
  updateSalesLeadStatus,
  updateTenantPackage,
  waitOrderPayment,
} from './services/platform.js';
import { clearSession, getAccessToken, getRefreshToken, getUser } from './services/session.js';
import { esc, money } from './utils/format.js';
import { renderLucideIcons } from './utils/icons.js';
import { loadState, saveState } from './services/storage.js';
import { connectRealtime, disconnectRealtime } from './services/realtime.js';

const app = document.getElementById('app');
let state = loadState(initialState);
let realtimeRefreshTimer = null;

const defaultPackagePermissions = {
  trial: ['store.manage', 'menu.manage', 'transaction.view', 'pos.sell', 'payment.collect'],
  plus: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect'],
  pro: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect', 'kitchen.view', 'kitchen.update'],
  starter: ['store.manage', 'menu.manage', 'transaction.view', 'billing.view', 'pos.sell', 'payment.collect'],
  restaurant: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect', 'kitchen.view', 'kitchen.update'],
  chain: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect', 'kitchen.view', 'kitchen.update'],
};

state.user = state.user || getUser();
state.authenticated = !!(getAccessToken() || getRefreshToken());
if (state.activeView === 'requests') state.activeView = 'orders';

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
  return state.tenants.find((tenant) => tenant.id === id)?.name || 'Tenant không xác định';
}

function setView(view) {
  state.activeView = view === 'requests' ? 'orders' : view;
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
  state.marketingSignups = data.marketingSignups || [];
  state.packages = data.packages || [];
  state.orders = data.orders || [];
  state.accounts = data.accounts || [];
  state.permissions = Object.fromEntries((data.permissions || []).map((item) => [item.role, item.permissions]));
  if (!state.permissionDirty) {
    state.permissionDraft = buildPackagePermissionMap(state.packages);
  }
  if (!state.packagePermissionDirty) {
    state.packagePermissionDraft = buildPackagePermissionMap(state.packages);
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
  let label = 'Dữ liệu nền tảng đã thay đổi';
  let view = 'overview';

  if (path.includes('/trial-requests')) {
    label = `${event.method || 'POST'} yêu cầu dùng thử ${data.restaurantName || data.id || ''}`.trim();
    view = 'orders';
  } else if (path.includes('/marketing-signups')) {
    label = `${event.method || 'POST'} đăng ký marketing ${data.email || data.signupId || ''}`.trim();
    view = 'orders';
  } else if (path.includes('/sales-leads')) {
    label = `${event.method || 'POST'} lead bán hàng ${data.name || data.id || ''}`.trim();
    view = 'orders';
  } else if (path.includes('/orders')) {
    label = `${event.method || 'POST'} đơn đăng ký ${data.orderCode || data.id || ''}`.trim();
    view = 'orders';
  } else if (path.includes('/tenants')) {
    label = `${event.method || 'POST'} tenant ${data.name || data.id || ''}`.trim();
    view = 'tenants';
  } else if (path.includes('/accounts')) {
    label = `${event.method || 'POST'} tài khoản ${data.email || data.id || ''}`.trim();
    view = 'accounts';
  } else if (path.includes('/permissions')) {
    label = 'Cấu hình phân quyền đã thay đổi';
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
    state.error = 'Vui lòng nhập tên đăng nhập và mật khẩu';
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
    state.error = 'Vui lòng nhập tên đăng nhập';
    render();
    return;
  }
  state.loading = true;
  state.error = '';
  render();
  try {
    const data = await requestSecurityQuestion(username);
    state.resetDraft = { ...(state.resetDraft || {}), username, question: data.question || '' };
    state.authMessage = 'Đã tải câu hỏi bảo mật';
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
    state.authMessage = `Đã xác minh câu trả lời. Mã đặt lại hết hạn sau ${data.expiresIn || 0} phút.`;
    saveState(state);
  } finally {
    state.loading = false;
    render();
  }
}

async function handleForgotReset() {
  const draft = state.resetDraft || {};
  if (draft.newPassword !== draft.confirmPassword) {
    state.error = 'Mật khẩu mới và xác nhận không khớp';
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
    state.authMessage = 'Đã đặt lại mật khẩu. Vui lòng đăng nhập.';
    saveState(state);
  } finally {
    state.loading = false;
    render();
  }
}

async function handleActivateAccount() {
  const draft = state.activationDraft || {};
  if (draft.newPassword !== draft.confirmPassword) {
    state.error = 'Mật khẩu mới và xác nhận không khớp';
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
    state.authMessage = 'Đã kích hoạt tài khoản. Vui lòng đăng nhập.';
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
          state.activeView = 'orders';
          state.selectedOrderId = `trial:${target.dataset.id}`;
          state.selectedTrialRequestId = null;
          state.selectedSalesLeadId = null;
        }
        if (target.dataset.type === 'lead') {
          state.selectedSalesLeadId = target.dataset.id;
          state.selectedTrialRequestId = null;
        }
        saveState(state);
        render();
      }
      if (action === 'set-mrr-range') {
        state.mrrRange = target.dataset.range || '30d';
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
          state.selectedTenantDetailId = tenant.id;
          state.packageDraft = normalizeTenantPackageTier(tenant.packageTier);
          state.modeDraft = tenant.operatingMode;
          state.packageOverrides = tenantOverrides(tenant);
          state.packageMessage = '';
          saveState(state);
          render();
        }
      }
      if (action === 'close-tenant-detail') {
        state.selectedTenantDetailId = null;
        state.packageMessage = '';
        saveState(state);
        render();
      }
      if (action === 'apply-package') {
        if (target.dataset.package) state.packageDraft = target.dataset.package;
        await handleApplyPackage();
      }
      if (action === 'open-package-edit') openPackageEdit(target.dataset.package);
      if (action === 'close-package-edit') closePackageEdit();
      if (action === 'save-package-edit') await handleSavePackageEdit();
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
        if (confirm('Duyệt đơn đăng ký này?')) await handleOrderAction(approveOrder, target.dataset.id);
      }
      if (action === 'order-reject') {
        openOrderRejectDialog(target.dataset.id);
      }
      if (action === 'close-order-reject-dialog') {
        closeOrderRejectDialog();
      }
      if (action === 'confirm-order-reject') {
        await handleConfirmOrderReject();
      }
      if (action === 'order-cancel') {
        if (confirm('Hủy đơn đăng ký này?')) await handleOrderAction(cancelOrder, target.dataset.id);
      }
      if (action === 'order-provision') {
        if (confirm('Khởi tạo tenant cho đơn đăng ký này?')) await handleOrderAction(provisionOrder, target.dataset.id);
      }
      if (action === 'order-hold-provisioning') {
        if (confirm('Tạm giữ khởi tạo cho đơn đăng ký này?')) await handleOrderAction(holdOrderProvisioning, target.dataset.id);
      }
      if (action === 'invite-account') await handleInviteAccount();
      if (action === 'resend-account-invite') await handleResendAccountInvite(target.dataset.id);
      if (action === 'open-ban-account') {
        state.showBanAccount = true;
        state.banAccountId = target.dataset.id;
        state.accountBanReason = '';
        saveState(state);
        render();
      }
      if (action === 'close-ban-account') {
        state.showBanAccount = false;
        state.banAccountId = null;
        state.accountBanReason = '';
        saveState(state);
        render();
      }
      if (action === 'confirm-ban-account') await handleBanAccount();
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
      if (action === 'toggle-permission-draft') handleTogglePermissionDraft(target.dataset.package, target.dataset.permission, target.checked);
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
        state.packageDraft = normalizeTenantPackageTier(tenant.packageTier);
        state.modeDraft = tenant.operatingMode;
        state.packageOverrides = tenantOverrides(tenant);
        shouldRender = true;
      }
    }
    if (field === 'inviteEmail') state.inviteEmail = event.target.value;
    if (field === 'publicOrderLookupCode') state.publicOrderLookupCode = event.target.value;
    if (field === 'rejectOrderReason') state.rejectOrderDialog = { ...(state.rejectOrderDialog || {}), reason: event.target.value };
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
    if (field === 'accountBanReason') state.accountBanReason = event.target.value;
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
    if (field === 'packageEditName') state.packageEditDraft = { ...(state.packageEditDraft || {}), name: event.target.value };
    if (field === 'packageEditLevel') state.packageEditDraft = { ...(state.packageEditDraft || {}), level: event.target.value };
    if (field === 'packageEditPrice') state.packageEditDraft = { ...(state.packageEditDraft || {}), price: event.target.value };
    if (field === 'packageEditSortOrder') state.packageEditDraft = { ...(state.packageEditDraft || {}), sortOrder: event.target.value };
    if (field === 'packageEditDescription') state.packageEditDraft = { ...(state.packageEditDraft || {}), description: event.target.value };
    if (field === 'packageEditModules') state.packageEditDraft = { ...(state.packageEditDraft || {}), modulesText: event.target.value };
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
  const packageTier = normalizeTenantPackageTier(state.packageDraft || tenant.packageTier);
  await updateTenantPackage(tenant.id, packageTier, state.modeDraft, {
    betaAnalytics: Boolean(state.packageOverrides?.betaAnalytics),
    waiveSetupFee: state.packageOverrides?.waiveSetupFee !== false,
  });
  const overrides = [];
  if (state.packageOverrides?.betaAnalytics) overrides.push('Beta Analytics');
  if (state.packageOverrides?.waiveSetupFee !== false) overrides.push('miễn phí thiết lập');
  state.packageMessage = overrides.length ? `Đã áp dụng gói với ${overrides.join(' và ')}.` : 'Đã áp dụng gói không kèm ghi đè.';
  await loadPlatformData();
}

function openPackageEdit(id) {
  const pkg = (state.packages || []).find((item) => item.id === id);
  if (!pkg) return;
  state.packageEditDraft = {
    id: pkg.id,
    name: pkg.name || '',
    level: pkg.level || '',
    price: pkg.price ?? 0,
    description: pkg.description || '',
    sortOrder: pkg.sortOrder ?? 0,
    modulesText: (pkg.modules || []).join('\n'),
  };
  state.error = '';
  saveState(state);
  render();
}

function closePackageEdit() {
  state.packageEditDraft = null;
  saveState(state);
  render();
}

async function handleSavePackageEdit() {
  const draft = state.packageEditDraft || {};
  const price = Number(draft.price);
  const sortOrder = Number(draft.sortOrder || 0);
  const modules = String(draft.modulesText || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!draft.id) return;
  if (!String(draft.name || '').trim() || !String(draft.level || '').trim()) {
    state.error = 'Tên gói và cấp / giới hạn là bắt buộc';
    render();
    return;
  }
  if (!Number.isFinite(price) || price < 0) {
    state.error = 'Giá gói phải là số không âm';
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();
  try {
    const updated = await updatePackage(draft.id, {
      name: String(draft.name || '').trim(),
      level: String(draft.level || '').trim(),
      price,
      description: String(draft.description || '').trim(),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      modules,
    });
    state.packageDraft = updated.id;
    state.packageEditDraft = null;
    state.packageMessage = `Đã cập nhật gói ${updated.name || updated.id}.`;
    await loadPlatformData();
  } catch (err) {
    state.loading = false;
    throw err;
  }
}

async function handleToggleStatus(id) {
  await toggleTenantStatus(id);
  await loadPlatformData();
  state.selectedTenantDetailId = id || state.selectedTenantDetailId || null;
  state.selectedTenantId = id || state.selectedTenantId || null;
  saveState(state);
  render();
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
  await createOrder(tenant.id, normalizeTenantPackageTier(state.packageDraft || tenant.packageTier));
  await loadPlatformData();
}

async function handleLookupPublicOrder() {
  const orderCode = String(state.publicOrderLookupCode || '').trim();
  if (!orderCode) {
    state.error = 'Vui lòng nhập mã đơn công khai để tra cứu';
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

function openOrderRejectDialog(id) {
  if (!id) return;
  const order = (state.orders || []).find((item) => item.id === id || item.orderCode === id);
  state.rejectOrderDialog = {
    open: true,
    orderId: id,
    orderCode: order?.orderCode || id,
    reason: '',
  };
  state.error = '';
  saveState(state);
  render();
}

function closeOrderRejectDialog() {
  state.rejectOrderDialog = null;
  saveState(state);
  render();
}

async function handleConfirmOrderReject() {
  const dialog = state.rejectOrderDialog || {};
  const reason = String(dialog.reason || '').trim();
  if (!dialog.orderId) return;
  if (!reason) {
    state.error = 'Vui lòng nhập lý do từ chối';
    render();
    return;
  }
  state.rejectOrderDialog = null;
  await handleOrderAction((id) => rejectOrder(id, reason), dialog.orderId);
}

async function handleOrderAction(actionFn, id) {
  if (!id) return;
  state.loading = true;
  render();
  const result = await actionFn(id);
  if (result?.activationEmail || result?.account || result?.tenant) {
    state.lastProvisioningResult = {
      orderId: id,
      activationEmail: result.activationEmail || null,
      account: result.account || null,
      tenant: result.tenant || null,
      authUser: result.authUser || null,
      store: result.store || null,
    };
  }
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
  state.activeView = 'orders';
  state.selectedOrderId = `trial:${id}`;
  saveState(state);
  render();
}

async function handleRejectTrial(id) {
  if (!id) return;
  await rejectTrialRequest(id);
  await loadPlatformData();
  state.activeView = 'orders';
  state.selectedOrderId = `trial:${id}`;
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
    state.activeView = 'orders';
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

async function handleBanAccount() {
  const id = state.banAccountId;
  const reason = String(state.accountBanReason || '').trim();
  if (!id) return;
  if (!reason) {
    state.error = 'Vui lòng nhập lý do ban tài khoản';
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();
  try {
    await banAccount(id, reason);
    state.showBanAccount = false;
    state.banAccountId = null;
    state.accountBanReason = '';
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
    state.error = 'Tên tenant, tên chủ sở hữu và email chủ sở hữu là bắt buộc';
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
    packageTier: normalizeTenantPackageTier(draft.packageTier || 'trial'),
    operatingMode: draft.operatingMode || 'simple',
    status: draft.status || 'active',
    renewalDate: draft.renewalDate || '',
  };
}

function normalizeTenantPackageTier(value) {
  const tier = String(value || '').toLowerCase();
  if (['trial', 'trial-plus', 'plus-trial'].includes(tier)) return 'trial';
  if (['plus', 'starter'].includes(tier)) return 'plus';
  if (['pro', 'restaurant', 'chain'].includes(tier)) return 'pro';
  return 'trial';
}

function tenantStatusOf(tenant) {
  return String(tenant?.status || 'active').toLowerCase();
}

function isTrialTenant(tenant) {
  return tenantStatusOf(tenant) === 'trial' || normalizeTenantPackageTier(tenant?.packageTier) === 'trial';
}

function tenantMatchesStatusFilter(tenant, filter) {
  const status = String(filter || '').toLowerCase();
  if (status === 'trial') return isTrialTenant(tenant);
  if (status === 'active') return tenantStatusOf(tenant) === 'active' && !isTrialTenant(tenant);
  return tenantStatusOf(tenant) === status;
}

function normalizeAccountStatus(value) {
  return String(value || 'pending').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

async function handleTogglePermission(permission) {
  if (!permission) return;
  await togglePermission(state.permissionRole, permission);
  await loadPlatformData();
}

function handleTogglePermissionDraft(role, permission, checked) {
  const packageId = role;
  if (!packageId || !permission) return;
  const draft = clonePermissions(state.packagePermissionDraft || buildPackagePermissionMap(state.packages || []));
  const packagePermissions = new Set(draft[packageId] || []);
  if (checked) packagePermissions.add(permission);
  else packagePermissions.delete(permission);
  draft[packageId] = [...packagePermissions];
  state.packagePermissionDraft = draft;
  state.permissionDraft = draft;
  state.packagePermissionDirty = true;
  state.permissionDirty = true;
  saveState(state);
  render();
}

function handleDiscardPermissions() {
  const draft = buildPackagePermissionMap(state.packages || []);
  state.packagePermissionDraft = draft;
  state.permissionDraft = draft;
  state.packagePermissionDirty = false;
  state.permissionDirty = false;
  saveState(state);
  render();
}

async function handleSavePermissions() {
  const original = buildPackagePermissionMap(state.packages || []);
  const draft = state.packagePermissionDraft || state.permissionDraft || {};
  const changedPackages = (state.packages || []).filter((pkg) => {
    const before = [...(original[pkg.id] || [])].sort().join('|');
    const after = [...(draft[pkg.id] || [])].sort().join('|');
    return before !== after;
  });

  if (!changedPackages.length) {
    state.packagePermissionDirty = false;
    state.permissionDirty = false;
    saveState(state);
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();
  try {
    for (const pkg of changedPackages) {
      await updatePackage(pkg.id, {
        name: pkg.name,
        level: pkg.level,
        price: pkg.price,
        description: pkg.description || '',
        modules: pkg.modules || [],
        sortOrder: pkg.sortOrder || 0,
        permissions: draft[pkg.id] || [],
      });
    }
    state.packagePermissionDirty = false;
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

function buildPackagePermissionMap(packages) {
  return Object.fromEntries((packages || []).map((pkg) => [pkg.id, [...(pkg.permissions?.length ? pkg.permissions : defaultPackagePermissions[pkg.id] || [])]]));
}

function getFilteredTenants() {
  const query = String(state.tenantSearch || '').trim().toLowerCase();
  return (state.tenants || []).filter((tenant) => {
    const packageMatch = state.tenantPackageFilter === 'all' || !state.tenantPackageFilter || normalizeTenantPackageTier(tenant.packageTier) === state.tenantPackageFilter;
    const modeMatch = state.tenantModeFilter === 'all' || !state.tenantModeFilter || tenant.operatingMode === state.tenantModeFilter;
    const statusMatch = state.tenantStatusFilter === 'all' || !state.tenantStatusFilter || tenantMatchesStatusFilter(tenant, state.tenantStatusFilter);
    const haystack = [tenant.id, tenant.name, tenant.ownerName, tenant.ownerEmail, tenant.packageTier, tenant.operatingMode].join(' ').toLowerCase();
    return packageMatch && modeMatch && statusMatch && (!query || haystack.includes(query));
  });
}

function getFilteredAccounts() {
  const query = String(state.accountSearch || '').trim().toLowerCase();
  return (state.accounts || []).filter((account) => {
    const tenantMatch = state.accountTenantFilter === 'all' || !state.accountTenantFilter || String(account.tenantId) === String(state.accountTenantFilter);
    const roleMatch = state.accountRoleFilter === 'all' || !state.accountRoleFilter || account.role === state.accountRoleFilter;
    const statusMatch = state.accountStatusFilter === 'all' || !state.accountStatusFilter || normalizeAccountStatus(account.status) === normalizeAccountStatus(state.accountStatusFilter);
    const haystack = [account.id, account.name, account.email, account.role, tenantName(account.tenantId)].join(' ').toLowerCase();
    return tenantMatch && roleMatch && statusMatch && (!query || haystack.includes(query));
  });
}

function downloadCsv(filename, rows) {
  if (!rows.length) {
    state.error = 'Không có dòng nào để xuất dữ liệu';
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
  state.securityMessage = 'Đã cập nhật hồ sơ';
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
  state.securityMessage = 'Đã cập nhật câu hỏi bảo mật';
  state.securityTone = 'success';
  state.settingsPanel = '';
  state.loading = false;
  saveState(state);
  render();
}

async function handleChangePassword() {
  const draft = state.passwordDraft || {};
  if (draft.next !== draft.confirm) {
    state.securityMessage = 'Mật khẩu mới và xác nhận không khớp';
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
  state.error = 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.';
  state.loading = false;
  saveState(state);
  render();
}

async function handleUploadAvatar(file) {
  if (file.size > 2 * 1024 * 1024) {
    state.securityMessage = 'Ảnh đại diện phải từ 2MB trở xuống';
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
  state.securityMessage = 'Đã cập nhật ảnh đại diện';
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
  state.securityMessage = 'Đã gỡ ảnh đại diện';
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
  state.securityMessage = 'Đã thu hồi phiên đăng nhập';
  state.securityTone = 'success';
  render();
}

async function handleLogoutAllDevices() {
  if (!confirm('Đăng xuất mọi thiết bị của tài khoản này? Bạn sẽ cần đăng nhập lại.')) return;
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
    error: 'Tất cả thiết bị đã được đăng xuất. Vui lòng đăng nhập lại.',
  };
  saveState(state);
  render();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh đại diện'));
    reader.readAsDataURL(file);
  });
}

function viewTitle() {
  const titles = {
    overview: 'Tổng quan nền tảng',
    tenants: 'Quản lý tenant',
    packages: 'Thiết lập gói',
    accounts: 'Quản lý tài khoản',
    orders: 'Đơn đăng ký',
    permissions: 'Ma trận phân quyền',
    settings: 'Hồ sơ & bảo mật',
    audit: 'Nhật ký kiểm toán',
  };
  return titles[state.activeView] || 'Quản trị nền tảng';
}

function globalSearchResults() {
  const query = String(state.globalSearch || '').trim().toLowerCase();
  if (!query) return [];
  const rows = [
    ...(state.tenants || []).map((item) => ({ type: 'Tenant', label: item.name, meta: item.ownerEmail || item.packageTier, view: 'tenants' })),
    ...(state.orders || []).map((item) => ({ type: 'Đơn đăng ký', label: item.orderCode || item.id, meta: [item.customerName, item.companyName, item.status].filter(Boolean).join(' / '), view: 'orders', id: item.id })),
    ...(state.accounts || []).map((item) => ({ type: 'Tài khoản', label: item.name || item.email, meta: [item.email, item.role].filter(Boolean).join(' / '), view: 'accounts', id: item.id })),
    ...(state.trialRequests || []).map((item) => ({ type: 'PLUS-Trial', label: item.restaurantName, meta: [item.contactName, item.status].filter(Boolean).join(' / '), view: 'orders', id: `trial:${item.id}` })),
  ];
  return rows.filter((row) => [row.type, row.label, row.meta].join(' ').toLowerCase().includes(query)).slice(0, 8);
}

function renderGlobalSearchPanel() {
  const results = globalSearchResults();
  if (!state.globalSearch) return '';
  return `
    <div class="global-search-panel">
      <header>
        <span>${esc(results.length)} kết quả</span>
        <button type="button" data-action="clear-global-search">Xóa</button>
      </header>
      ${results.map((item) => `
        <button type="button" data-action="view" data-view="${esc(item.view)}">
          <b>${esc(item.type)}</b>
          <strong>${esc(item.label || '-')}</strong>
          <small>${esc(item.meta || '-')}</small>
        </button>
      `).join('') || '<p>Không tìm thấy kết quả phù hợp</p>'}
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
        <strong>Thông báo</strong>
        <small class="${state.realtime?.connected ? 'realtime-on' : 'realtime-off'}">${state.realtime?.connected ? 'Trực tiếp' : 'Ngoại tuyến'}</small>
      </header>
      <button type="button" data-action="view" data-view="orders"><span>${esc(pendingTrials)}</span> PLUS-Trial đang chờ</button>
      <button type="button" data-action="view" data-view="orders"><span>${esc(newLeads)}</span> lead bán hàng mới</button>
      <button type="button" data-action="view" data-view="orders"><span>${esc(provisioning)}</span> mục đang khởi tạo</button>
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
      ` : '<p>Chưa có cập nhật realtime</p>'}
      ${state.realtime?.error ? `<p>${esc(state.realtime.error)}</p>` : ''}
    </div>
  `;
}

function formatRealtimeTime(value) {
  if (!value) return 'vừa xong';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'vừa xong';
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
              <input data-field="globalSearch" value="${esc(state.globalSearch || '')}" aria-label="Tìm kiếm" placeholder="Tìm tenant, đơn đăng ký, gói..." />
            </label>
            ${renderGlobalSearchPanel()}
          </div>
          <div class="topbar-actions">
            <button class="top-icon notification-trigger ${state.realtime?.connected ? 'live' : ''}" data-action="toggle-notifications" aria-label="Thông báo">
              ${state.realtime?.unread ? `<span>${esc(state.realtime.unread)}</span>` : ''}
            </button>
            <button class="top-icon settings" data-action="view" data-view="settings" aria-label="Cài đặt"></button>
            <button class="top-avatar" data-action="view" data-view="settings" aria-label="${esc(state.user?.username || 'platform')}"></button>
            ${renderNotifications()}
          </div>
        </header>

        <div class="content-scroll">
          ${state.activeView === 'overview' ? renderOverviewPage(state, { selectedTenant, tenantName }) : ''}
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
    app.innerHTML = '<div class="loading">Đang tải...</div>';
    return;
  }

  if (!state.authenticated) {
    app.innerHTML = renderLoginPage(state);
    renderLucideIcons();
    return;
  }

  app.innerHTML = `
    ${renderAppShell()}
    ${state.loading ? '<div class="toast">Đang tải dữ liệu nền tảng...</div>' : ''}
    ${state.error ? `<div class="toast">${esc(state.error)}</div>` : ''}
  `;
  renderLucideIcons();
}

bindEvents();
ensureAuthenticated();
