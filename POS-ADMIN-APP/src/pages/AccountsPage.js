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
  const accounts = state.accounts?.length ? state.accounts : fallbackAccounts;
  const selected = accounts.find((account) => String(account.id) === String(state.selectedAccountId)) || null;
  const showInvite = Boolean(state.showInviteAccount);

  return `
    <section class="accounts-page">
      <header class="accounts-heading">
        <div>
          <h1>Accounts</h1>
          <p>Manage accounts belonging to customer tenants.</p>
        </div>
        <button type="button" class="account-invite-open" data-action="open-invite-account"><span></span>Invite Account</button>
      </header>

      <section class="accounts-table-card">
        <div class="accounts-toolbar">
          <button type="button" class="accounts-tenant-filter"><i></i>All Tenants<b></b></button>
          <label class="accounts-search">
            <i></i>
            <input aria-label="Search accounts" placeholder="Search accounts..." />
          </label>
          <div class="accounts-toolbar-actions">
            <button type="button" class="accounts-icon-btn filter" aria-label="Filter accounts"></button>
            <button type="button" class="accounts-icon-btn export" aria-label="Export accounts"></button>
          </div>
        </div>

        <div class="accounts-table">
          ${tableHeader(['', 'User Details', 'Tenant', 'Role', 'Status', 'Actions'])}
          ${accounts.map((account) => renderAccountRow(account, state)).join('')}
        </div>

        <div class="accounts-pagination">
          <span>Showing 1 to ${Math.min(accounts.length, 10)} of ${accounts.length || 0} accounts</span>
          <div>
            <button type="button">‹</button>
            <button type="button" class="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">›</button>
          </div>
        </div>
      </section>

      ${selected ? renderAccountDetail(selected, state) : ''}
      ${showInvite ? renderInviteModal(state) : ''}
    </section>
  `;
}

function renderAccountRow(account, state) {
  const tenantName = account.tenantName || tenantLabel(account.tenantId, state);
  return `
    <div class="accounts-table-row">
      <label class="account-check"><input type="checkbox" /></label>
      <button type="button" class="account-user-cell" data-action="select-account" data-id="${esc(account.id)}">
        <span>${esc(initials(account.name))}</span>
        <strong>${esc(account.name || '-')}</strong>
        <small>${esc(account.email || '-')}</small>
      </button>
      <span class="account-tenant">${esc(tenantName)}</span>
      <span class="account-role">${esc(roleLabels[account.role] || account.role || '-')}</span>
      <span><b class="account-status ${esc(statusTone(account.status))}">${esc(statusLabel(account.status))}</b></span>
      <span class="account-actions">
        <button type="button" data-action="select-account" data-id="${esc(account.id)}" aria-label="Open account detail"></button>
      </span>
    </div>
  `;
}

function renderAccountDetail(account, state) {
  return `
    <div class="account-detail-backdrop" data-action="close-account-detail"></div>
    <aside class="account-detail-drawer" role="dialog" aria-modal="true" aria-label="Account detail">
      <header class="account-detail-head">
        <div>
          <h2>Account Detail</h2>
          <p>${esc(account.email || '-')}</p>
        </div>
        <button type="button" data-action="close-account-detail" aria-label="Close account detail"></button>
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
        ${infoRow('Role', roleLabels[account.role] || account.role)}
        ${infoRow('Activation Token', account.activationToken || 'Pending delivery')}
        ${infoRow('Invited At', formatDate(account.activationSentAt || account.createdAt))}
      </section>

      <div class="account-detail-actions">
        <button type="button" class="account-secondary-btn">Resend Invite</button>
        <button type="button" class="account-primary-btn" data-action="close-account-detail">Done</button>
      </div>
    </aside>
  `;
}

function renderInviteModal(state) {
  return `
    <div class="invite-account-backdrop" data-action="close-invite-account"></div>
    <aside class="invite-account-modal" role="dialog" aria-modal="true" aria-label="Invite account">
      <header class="invite-account-head">
        <div>
          <h2>Invite Account</h2>
          <p>Create access for a customer tenant user.</p>
        </div>
        <button type="button" data-action="close-invite-account" aria-label="Close invite account"></button>
      </header>

      <label class="invite-field">
        <span>Email Address</span>
        <input data-field="inviteEmail" value="${esc(state.inviteEmail || '')}" placeholder="new.user@store.local" />
      </label>

      <label class="invite-field">
        <span>Role</span>
        <select data-field="roleDraft">
          ${Object.keys(roleLabels).filter((role) => role !== 'platform_admin').map((role) => `
            <option value="${esc(role)}" ${state.roleDraft === role ? 'selected' : ''}>${esc(roleLabels[role])}</option>
          `).join('')}
        </select>
      </label>

      <div class="invite-preview">
        <span>Invitation Preview</span>
        <p>The user will receive an activation link and inherit permissions from the selected role.</p>
      </div>

      <div class="invite-actions">
        <button type="button" class="account-secondary-btn" data-action="close-invite-account">Cancel</button>
        <button type="button" class="account-primary-btn" data-action="invite-account">Send Invite</button>
      </div>
    </aside>
  `;
}

function tableHeader(items) {
  return `<div class="accounts-table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
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
  const status = String(value || '').toLowerCase();
  if (status === 'active') return 'active';
  if (status === 'pending' || status === 'invited') return 'pending';
  return 'suspended';
}

function statusLabel(value) {
  const status = String(value || 'pending').toLowerCase();
  if (status === 'invited') return 'Pending';
  return status[0].toUpperCase() + status.slice(1);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
