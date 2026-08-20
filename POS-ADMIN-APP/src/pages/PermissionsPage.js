import { esc } from '../utils/format.js';

const roles = [
  ['store_owner', 'Owner', 'Full Access'],
  ['chain_admin', 'Admin', 'Configuration'],
  ['manager', 'Manager', 'Operations'],
  ['cashier', 'Staff', 'Execution'],
  ['kitchen', 'Viewer', 'Read-only'],
];

const groups = [
  {
    title: 'Store Management',
    icon: 'store',
    permissions: [
      ['store.manage', 'Manage Store Profiles', 'store.profile.write'],
      ['branch.manage', 'Configure Business Hours', 'store.hours.write'],
    ],
  },
  {
    title: 'Product Catalog',
    icon: 'catalog',
    permissions: [
      ['product.manage', 'Create/Edit Products', 'catalog.product.write'],
      ['topping.manage', 'Bulk Import/Export', 'catalog.bulk.execute', 'PRO TIER'],
    ],
  },
  {
    title: 'Orders & Finance',
    icon: 'finance',
    permissions: [
      ['transaction.view', 'Process Refunds', 'finance.refund.execute'],
    ],
  },
];

export function renderPermissionsPage(state) {
  return `
    <section class="permissions-page">
      <header class="permissions-topline">
        <div class="permissions-breadcrumb">Administration <span></span> <strong>Permissions</strong></div>
        <label class="permissions-search">
          <i></i>
          <input aria-label="Search permissions" placeholder="Search permissions..." />
        </label>
      </header>

      <section class="permissions-heading">
        <div>
          <h1>Permissions Matrix</h1>
          <p>Configure granular capabilities available to each platform role. Access to certain domains may be restricted by your active subscription tier. Changes are applied globally across all active sessions upon saving.</p>
        </div>
        <div class="permissions-actions">
          <button type="button" class="permission-discard-btn">Discard Changes</button>
          <button type="button" class="permission-save-btn">Save Configuration</button>
        </div>
      </section>

      <section class="permission-matrix-card">
        <div class="permission-matrix-head">
          <span>Domain / Capability</span>
          ${roles.map(([, label, note]) => `
            <span>
              <strong>${esc(label)}</strong>
              <small>${esc(note)}</small>
            </span>
          `).join('')}
        </div>
        ${groups.map((group) => renderGroup(group, state)).join('')}
      </section>
    </section>
  `;
}

function renderGroup(group, state) {
  return `
    <div class="permission-group-row">
      <strong><i class="${esc(group.icon)}"></i>${esc(group.title)}</strong>
    </div>
    ${group.permissions.map((permission) => renderPermissionRow(permission, state)).join('')}
  `;
}

function renderPermissionRow(permission, state) {
  const [id, label, code, badge] = permission;
  return `
    <div class="permission-matrix-row">
      <span class="permission-capability">
        <strong>${esc(label)}</strong>
        <small>${esc(code)}${badge ? `<b>${esc(badge)}</b>` : ''}</small>
      </span>
      ${roles.map(([role]) => renderPermissionCell(role, id, state)).join('')}
    </div>
  `;
}

function renderPermissionCell(role, permission, state) {
  const enabled = new Set(state.permissions?.[role] || []);
  const checked = enabled.has(permission) || inferredDefault(role, permission);
  return `
    <label class="permission-check-cell">
      <input
        type="checkbox"
        data-action="toggle-permission"
        data-role="${esc(role)}"
        data-permission="${esc(permission)}"
        ${checked ? 'checked' : ''}
      />
    </label>
  `;
}

function inferredDefault(role, permission) {
  if (role === 'store_owner') return true;
  if (role === 'chain_admin') return true;
  if (role === 'manager') return ['branch.manage', 'product.manage', 'transaction.view'].includes(permission);
  return false;
}
