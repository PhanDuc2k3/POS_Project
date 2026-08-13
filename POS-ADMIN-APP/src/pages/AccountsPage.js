import { esc } from '../utils/format.js';
import { roleLabels } from '../data/platform.js';

export function renderAccountsPage(state, helpers) {
  const tenant = helpers.selectedTenant();
  if (!tenant) {
    return '<section class="panel"><div class="empty">No tenant selected</div></section>';
  }
  const accounts = state.accounts.filter((account) => account.tenantId === tenant.id);
  return `
    <div class="two-column">
      <section class="panel">
        <div class="panel-head">
          <h2>Tenant accounts</h2>
          <span class="muted">${esc(tenant.name)}</span>
        </div>
        <div class="table compact">
          ${tableHeader(['Name', 'Email', 'Role', 'Status'])}
          ${accounts.map((account) => `
            <div class="table-row">
              <strong>${esc(account.name)}</strong>
              <span>${esc(account.email)}</span>
              <span>${esc(roleLabels[account.role] || account.role)}</span>
              <span><span class="badge ${account.status}">${esc(account.status)}</span></span>
            </div>
          `).join('') || '<div class="empty">No accounts for this tenant</div>'}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Invite account</h2>
        </div>
        <div class="panel-body">
          <label class="field">
            <span>Email</span>
            <input data-field="inviteEmail" value="${esc(state.inviteEmail)}" placeholder="new.user@store.local" />
          </label>
          <label class="field">
            <span>Role</span>
            <select data-field="roleDraft">
              ${Object.keys(roleLabels).filter((role) => role !== 'platform_admin').map((role) => `
                <option value="${role}" ${state.roleDraft === role ? 'selected' : ''}>${esc(roleLabels[role])}</option>
              `).join('')}
            </select>
          </label>
          <button class="btn" data-action="invite-account">Create invite</button>
        </div>
      </section>
    </div>
  `;
}

function tableHeader(items) {
  return `<div class="table-row table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}
