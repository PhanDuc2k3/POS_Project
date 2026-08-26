import { esc } from '../utils/format.js';
import { roleLabels } from '../data/platform.js';

const fallbackAccounts = [
  {
    id: 'acc-1',
    tenantId: 1,
    name: 'Jane Smith',
    email: 'jane.smith@acmecorp.com',
    role: 'manager',
    status: 'active',
    tenantName: 'Acme Corp (Retail)',
  },
  {
    id: 'acc-2',
    tenantId: 1,
    name: 'Michael Jones',
    email: 'm.jones@acmecorp.com',
    role: 'cashier',
    status: 'pending',
    tenantName: 'Acme Corp (Retail)',
  },
  {
    id: 'acc-3',
    tenantId: 2,
    name: 'Sarah Williams',
    email: 'sarah@globalcoffee.com',
    role: 'store_owner',
    status: 'active',
    tenantName: 'Global Coffee Co.',
  },
];

export function renderAccountsPage(state) {
  const sourceAccounts = state.accounts?.length ? state.accounts : fallbackAccounts;
  const accounts = filterAccounts(sourceAccounts, state);
  const pageSize = 10;
  const page = clampPage(state.accountPage, accounts.length, pageSize);
  const visibleAccounts = accounts.slice((page - 1) * pageSize, page * pageSize);
  const selectedAccounts = new Set((state.selectedAccountIds || []).map(String));
  const selected = sourceAccounts.find((account) => String(account.id) === String(state.selectedAccountId)) || null;
  const showInvite = Boolean(state.showInviteAccount);
  const showFilters = Boolean(state.showAccountFilters);
  const showBanDialog = Boolean(state.showBanAccount);

  return `
    <section class="accounts-page">
      <header class="accounts-heading">
        <div>
          <h1>Tài khoản</h1>
          <p>Quản lý tài khoản thuộc các tenant khách hàng.</p>
        </div>
        <button type="button" class="account-invite-open" data-action="open-invite-account"><span></span>Mời tài khoản</button>
      </header>

      <section class="accounts-table-card">
        ${selectedAccounts.size ? `
          <div class="bulk-action-bar">
            <strong>${esc(selectedAccounts.size)} đã chọn</strong>
            <button type="button" data-action="bulk-resend-invites">Gửi lại lời mời</button>
            <button type="button" data-action="export-accounts">Xuất dữ liệu</button>
            <button type="button" data-action="clear-account-selection">Bỏ chọn</button>
          </div>
        ` : ''}
        <div class="accounts-toolbar">
          <label class="accounts-tenant-filter"><i></i>
            <select data-field="accountTenantFilter" aria-label="Lọc tenant của tài khoản">
              <option value="all">Tất cả tenant</option>
              ${tenantOptions(state).map((tenant) => `<option value="${esc(tenant.id)}" ${String(state.accountTenantFilter) === String(tenant.id) ? 'selected' : ''}>${esc(tenant.name)}</option>`).join('')}
            </select>
            <b></b>
          </label>
          <label class="accounts-search">
            <i></i>
            <input data-field="accountSearch" value="${esc(state.accountSearch || '')}" aria-label="Tìm tài khoản" placeholder="Tìm tài khoản..." />
          </label>
          <div class="accounts-toolbar-actions">
            <button type="button" class="accounts-icon-btn filter ${showFilters ? 'active' : ''}" data-action="toggle-account-filters" aria-label="Lọc tài khoản"></button>
            <button type="button" class="accounts-icon-btn export" data-action="export-accounts" aria-label="Xuất tài khoản"></button>
          </div>
        </div>
        ${showFilters ? `
          <div class="accounts-filter-row">
            <label>Vai trò
              <select data-field="accountRoleFilter">
                <option value="all">Tất cả vai trò</option>
                ${Object.keys(roleLabels).filter((role) => role !== 'platform_admin').map((role) => `<option value="${esc(role)}" ${state.accountRoleFilter === role ? 'selected' : ''}>${esc(roleLabels[role])}</option>`).join('')}
              </select>
            </label>
            <label>Trạng thái
              <select data-field="accountStatusFilter">
                <option value="all">Tất cả trạng thái</option>
                ${uniqueOptions(sourceAccounts.map((account) => String(account.status || '').toLowerCase())).map((status) => `<option value="${esc(status)}" ${state.accountStatusFilter === status ? 'selected' : ''}>${esc(statusLabel(status))}</option>`).join('')}
              </select>
            </label>
          </div>
        ` : ''}

        <div class="accounts-table">
          ${tableHeader(['', 'Thông tin người dùng', 'Tenant', 'Vai trò', 'Trạng thái', 'Thao tác'])}
          ${visibleAccounts.map((account) => renderAccountRow(account, state, selectedAccounts)).join('') || '<div class="empty">Không có tài khoản phù hợp bộ lọc</div>'}
        </div>

        <div class="accounts-pagination">
          <span>Hiển thị ${accounts.length ? (page - 1) * pageSize + 1 : 0} đến ${Math.min(page * pageSize, accounts.length)} trong ${accounts.length || 0} tài khoản</span>
          <div>
            ${paginationButtons(page, Math.max(1, Math.ceil(accounts.length / pageSize)), 'set-account-page')}
          </div>
        </div>
      </section>

      ${selected ? renderAccountDetail(selected, state) : ''}
      ${showInvite ? renderInviteModal(state) : ''}
      ${showBanDialog ? renderBanAccountDialog(state) : ''}
    </section>
  `;
}

function renderAccountRow(account, state, selectedAccounts) {
  const tenantName = account.tenantName || tenantLabel(account.tenantId, state);
  return `
    <div class="accounts-table-row">
      <label class="account-check"><input type="checkbox" data-action="toggle-account-selection" data-id="${esc(account.id)}" ${selectedAccounts.has(String(account.id)) ? 'checked' : ''} /></label>
      <button type="button" class="account-user-cell" data-action="select-account" data-id="${esc(account.id)}">
        <span>${esc(initials(account.name))}</span>
        <strong>${esc(account.name || '-')}</strong>
        <small>${esc(account.email || '-')}</small>
      </button>
      <span class="account-tenant">${esc(tenantName)}</span>
      <span class="account-role">${esc(roleLabels[account.role] || account.role || '-')}</span>
      <span><b class="account-status ${esc(statusTone(account.status))}">${esc(statusLabel(account.status))}</b></span>
      <span class="account-actions">
        <button type="button" data-action="select-account" data-id="${esc(account.id)}" aria-label="Mở chi tiết tài khoản"></button>
      </span>
    </div>
  `;
}

function renderAccountDetail(account, state) {
  const isBanned = normalizeStatus(account.status) === 'banned';
  return `
    <div class="account-detail-backdrop" data-action="close-account-detail"></div>
    <aside class="account-detail-drawer" role="dialog" aria-modal="true" aria-label="Chi tiết tài khoản">
      <header class="account-detail-head">
        <div>
          <h2>Chi tiết tài khoản</h2>
          <p>${esc(account.email || '-')}</p>
        </div>
        <button type="button" data-action="close-account-detail" aria-label="Đóng chi tiết tài khoản"></button>
      </header>

      <section class="account-profile-card">
        <span>${esc(initials(account.name))}</span>
        <strong>${esc(account.name || '-')}</strong>
        <small>${esc(roleLabels[account.role] || account.role || '-')}</small>
        <b class="account-status ${esc(statusTone(account.status))}">${esc(statusLabel(account.status))}</b>
      </section>

      <section class="account-info-list">
        ${infoRow('Tenant', account.tenantName || tenantLabel(account.tenantId, state))}
        ${infoRow('Email', account.email)}
        ${isBanned ? infoRow('Lý do ban', account.banReason || 'Chưa ghi nhận') : ''}
        ${infoRow('Vai trò', roleLabels[account.role] || account.role)}
        ${infoRow('Mã kích hoạt', account.activationToken || 'Chờ gửi')}
        ${infoRow('Thời điểm mời', formatDate(account.activationSentAt || account.createdAt))}
      </section>

      <div class="account-detail-actions">
        <button type="button" class="account-secondary-btn" data-action="resend-account-invite" data-id="${esc(account.id)}">Gửi lại lời mời</button>
        ${isBanned ? '' : `<button type="button" class="account-danger-btn" data-action="open-ban-account" data-id="${esc(account.id)}">Ban tài khoản</button>`}
        <button type="button" class="account-primary-btn" data-action="close-account-detail">Xong</button>
      </div>
    </aside>
  `;
}

function filterAccounts(accounts, state) {
  const query = String(state.accountSearch || '').trim().toLowerCase();
  return accounts.filter((account) => {
    const tenantMatch = state.accountTenantFilter === 'all' || !state.accountTenantFilter || String(account.tenantId) === String(state.accountTenantFilter);
    const roleMatch = state.accountRoleFilter === 'all' || !state.accountRoleFilter || account.role === state.accountRoleFilter;
    const statusMatch = state.accountStatusFilter === 'all' || !state.accountStatusFilter || normalizeStatus(account.status) === normalizeStatus(state.accountStatusFilter);
    const haystack = [account.id, account.name, account.email, account.role, tenantLabel(account.tenantId, state)].join(' ').toLowerCase();
    return tenantMatch && roleMatch && statusMatch && (!query || haystack.includes(query));
  });
}

function tenantOptions(state) {
  const tenants = state.tenants?.length ? state.tenants : [];
  return tenants.length ? tenants : [{ id: 1, name: 'Acme Corp (Retail)' }, { id: 2, name: 'Global Coffee Co.' }];
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).toLowerCase()))];
}

function clampPage(value, total, pageSize) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, Number(value || 1)), max);
}

function paginationButtons(page, totalPages, action) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  const output = [`<button type="button" data-action="${action}" data-page="${Math.max(1, page - 1)}" ${page === 1 ? 'disabled' : ''}>Trước</button>`];
  let previous = 0;
  pages.forEach((item) => {
    if (previous && item - previous > 1) output.push('<button type="button" disabled>...</button>');
    output.push(`<button type="button" data-action="${action}" data-page="${item}" class="${item === page ? 'active' : ''}">${item}</button>`);
    previous = item;
  });
  output.push(`<button type="button" data-action="${action}" data-page="${Math.min(totalPages, page + 1)}" ${page === totalPages ? 'disabled' : ''}>Sau</button>`);
  return output.join('');
}

function renderInviteModal(state) {
  return `
    <div class="invite-account-backdrop" data-action="close-invite-account"></div>
    <aside class="invite-account-modal" role="dialog" aria-modal="true" aria-label="Mời tài khoản">
      <header class="invite-account-head">
        <div>
          <h2>Mời tài khoản</h2>
          <p>Tạo quyền truy cập cho người dùng thuộc tenant khách hàng.</p>
        </div>
        <button type="button" data-action="close-invite-account" aria-label="Đóng form mời tài khoản"></button>
      </header>

      <label class="invite-field">
        <span>Địa chỉ email</span>
        <input data-field="inviteEmail" value="${esc(state.inviteEmail || '')}" placeholder="new.user@store.local" />
      </label>

      <label class="invite-field">
        <span>Vai trò</span>
        <select data-field="roleDraft">
          ${Object.keys(roleLabels).filter((role) => role !== 'platform_admin').map((role) => `
            <option value="${esc(role)}" ${state.roleDraft === role ? 'selected' : ''}>${esc(roleLabels[role])}</option>
          `).join('')}
        </select>
      </label>

      <div class="invite-preview">
        <span>Xem trước lời mời</span>
        <p>Người dùng sẽ nhận liên kết kích hoạt và kế thừa quyền từ vai trò đã chọn.</p>
      </div>

      <div class="invite-actions">
        <button type="button" class="account-secondary-btn" data-action="close-invite-account">Hủy</button>
        <button type="button" class="account-primary-btn" data-action="invite-account">Gửi lời mời</button>
      </div>
    </aside>
  `;
}

function renderBanAccountDialog(state) {
  const account = (state.accounts || []).find((item) => String(item.id) === String(state.banAccountId));
  return `
    <div class="ban-account-backdrop" data-action="close-ban-account"></div>
    <aside class="ban-account-modal" role="dialog" aria-modal="true" aria-label="Ban tài khoản">
      <header class="ban-account-head">
        <div>
          <h2>Ban tài khoản</h2>
          <p>${esc(account?.email || 'Tài khoản đã chọn')}</p>
        </div>
        <button type="button" data-action="close-ban-account" aria-label="Đóng popup ban tài khoản"></button>
      </header>

      <label class="ban-account-field">
        <span>Lý do ban</span>
        <textarea data-field="accountBanReason" rows="5" placeholder="Nhập lý do ban tài khoản...">${esc(state.accountBanReason || '')}</textarea>
      </label>

      <div class="ban-account-note">
        <strong>Lưu ý</strong>
        <p>Tài khoản sẽ được chuyển sang trạng thái bị ban để đội vận hành dễ theo dõi.</p>
      </div>

      <div class="ban-account-actions">
        <button type="button" class="account-secondary-btn" data-action="close-ban-account">Hủy</button>
        <button type="button" class="account-danger-btn" data-action="confirm-ban-account">Xác nhận ban</button>
      </div>
    </aside>
  `;
}

function tableHeader(items) {
  return `<div class="accounts-table-head">${items.map((item, index) => `<span>${index === 0 ? '<input type="checkbox" data-action="toggle-all-accounts" aria-label="Chọn tài khoản đang hiển thị" />' : esc(item)}</span>`).join('')}</div>`;
}

function infoRow(label, value) {
  return `
    <div>
      <span>${esc(label)}</span>
      <strong>${esc(value || '-')}</strong>
    </div>
  `;
}

function tenantLabel(id, state) {
  return state.tenants?.find((tenant) => tenant.id === id)?.name || 'Acme Corp (Retail)';
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'US';
}

function statusTone(value) {
  const status = normalizeStatus(value);
  if (status === 'active') return 'active';
  if (['pending', 'pending_activation', 'invited'].includes(status)) return 'pending';
  if (status === 'banned') return 'banned';
  return 'suspended';
}

function statusLabel(value) {
  const status = normalizeStatus(value);
  const map = {
    active: 'Đang hoạt động',
    pending: 'Đang chờ',
    pending_activation: 'Chờ kích hoạt',
    invited: 'Đã mời',
    suspended: 'Tạm ngưng',
    inactive: 'Chưa hoạt động',
    disabled: 'Đã vô hiệu',
    banned: 'Đã ban',
  };
  return map[status] || (status ? status[0].toUpperCase() + status.slice(1) : 'Đang chờ');
}

function normalizeStatus(value) {
  return String(value || 'pending').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

