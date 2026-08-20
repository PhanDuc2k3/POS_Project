import { esc } from '../utils/format.js';

const fallbackTenants = [
  {
    id: 101,
    name: 'Bean Eatery',
    ownerName: 'Sarah Jenkins',
    ownerEmail: 'sarah@beaneatery.com',
    packageTier: 'pro',
    operatingMode: 'restaurant',
    status: 'active',
    branches: 3,
    users: 5,
    renewalDate: '2024-10-12',
  },
  {
    id: 102,
    name: 'Vinyl & Brews',
    ownerName: 'Marcus Thorne',
    ownerEmail: 'marcus@vinylbrews.co',
    packageTier: 'plus',
    operatingMode: 'retail',
    status: 'suspended',
    branches: 1,
    users: 2,
    renewalDate: 'Overdue',
  },
  {
    id: 103,
    name: 'Fresh Finds Market',
    ownerName: 'Elena Rodriguez',
    ownerEmail: 'elena@freshfinds.com',
    packageTier: 'starter',
    operatingMode: 'simple',
    status: 'active',
    branches: 1,
    users: 1,
    renewalDate: '2024-11-05',
  },
];

export function renderTenantsPage(state) {
  const sourceTenants = state.tenants?.length ? state.tenants : fallbackTenants;
  const tenants = filterTenants(sourceTenants, state);
  const pageSize = 10;
  const page = clampPage(state.tenantPage, tenants.length, pageSize);
  const visibleTenants = tenants.slice((page - 1) * pageSize, page * pageSize);
  const selected = new Set((state.selectedTenantIds || []).map(String));
  const active = tenants.filter((tenant) => statusOf(tenant) === 'active').length;
  const suspended = tenants.filter((tenant) => statusOf(tenant) === 'suspended').length;
  const totalStores = tenants.reduce((sum, tenant) => sum + Number(tenant.branches || 0), 0);

  return `
    <section class="tenants-page">
      <header class="tenants-heading">
        <div>
          <h1>Tenants</h1>
          <p>Manage all businesses using the POS platform.</p>
        </div>
        <div class="tenants-heading-actions">
          <button type="button" class="tenant-export-btn" data-action="export-tenants"><i></i>Export</button>
          <button type="button" class="tenant-add-btn" data-action="open-create-tenant"><span></span>Add Tenant</button>
        </div>
      </header>

      <section class="tenant-metrics">
        ${metricCard('Total Tenants', tenants.length || 1248, '+12%', 'neutral')}
        ${metricCard('Active', active || 1180, '+5%', 'success')}
        ${metricCard('Suspended', suspended || 68, '+2%', 'danger')}
        ${metricCard('Total Stores', totalStores || 3492, '+18%', 'neutral')}
      </section>

      <section class="tenants-table-card">
        ${selected.size ? `
          <div class="bulk-action-bar">
            <strong>${esc(selected.size)} selected</strong>
            <button type="button" data-action="bulk-tenant-status" data-status="active">Activate</button>
            <button type="button" data-action="bulk-tenant-status" data-status="suspended">Suspend</button>
            <button type="button" data-action="clear-tenant-selection">Clear</button>
          </div>
        ` : ''}
        <div class="tenants-toolbar">
          <label class="tenant-search">
            <i></i>
            <input data-field="tenantSearch" value="${esc(state.tenantSearch || '')}" aria-label="Search tenants" placeholder="Search tenant name or ID..." />
          </label>
          <div class="tenant-filters">
            <select data-field="tenantPackageFilter" aria-label="Filter tenant package">
              <option value="all">All Packages</option>
              ${uniqueOptions(sourceTenants.map((tenant) => tenant.packageTier)).map((value) => `<option value="${esc(value)}" ${state.tenantPackageFilter === value ? 'selected' : ''}>${esc(packageLabel(value))}</option>`).join('')}
            </select>
            <select data-field="tenantModeFilter" aria-label="Filter tenant mode">
              <option value="all">All Modes</option>
              ${uniqueOptions(sourceTenants.map((tenant) => tenant.operatingMode)).map((value) => `<option value="${esc(value)}" ${state.tenantModeFilter === value ? 'selected' : ''}>${esc(modeLabel(value))}</option>`).join('')}
            </select>
            <select data-field="tenantStatusFilter" aria-label="Filter tenant status">
              <option value="all">Status: All</option>
              ${uniqueOptions(sourceTenants.map((tenant) => statusOf(tenant))).map((value) => `<option value="${esc(value)}" ${state.tenantStatusFilter === value ? 'selected' : ''}>${esc(statusLabel(value))}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="tenant-table">
          ${tableHeader(['', 'Tenant Name', 'Owner', 'Package', 'Op. Mode', 'Stores / Users', 'Status', 'Renewal', 'Actions'])}
          ${visibleTenants.map((tenant) => renderTenantRow(tenant, selected)).join('') || '<div class="empty">No tenants match the filters</div>'}
        </div>

        <div class="tenant-pagination">
          <span>Showing ${tenants.length ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, tenants.length)} of ${tenants.length || 0} entries</span>
          <div>
            ${paginationButtons(page, Math.max(1, Math.ceil(tenants.length / pageSize)), 'set-tenant-page')}
          </div>
        </div>
      </section>
    </section>
    ${state.showCreateTenant ? renderCreateTenantModal(state) : ''}
  `;
}

function filterTenants(tenants, state) {
  const query = String(state.tenantSearch || '').trim().toLowerCase();
  return tenants.filter((tenant) => {
    const packageMatch = state.tenantPackageFilter === 'all' || !state.tenantPackageFilter || tenant.packageTier === state.tenantPackageFilter;
    const modeMatch = state.tenantModeFilter === 'all' || !state.tenantModeFilter || tenant.operatingMode === state.tenantModeFilter;
    const statusMatch = state.tenantStatusFilter === 'all' || !state.tenantStatusFilter || statusOf(tenant) === state.tenantStatusFilter;
    const haystack = [tenant.id, tenant.name, tenant.ownerName, tenant.ownerEmail, tenant.packageTier, tenant.operatingMode].join(' ').toLowerCase();
    return packageMatch && modeMatch && statusMatch && (!query || haystack.includes(query));
  });
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).toLowerCase()))];
}

function renderCreateTenantModal(state) {
  const draft = state.tenantDraft || {};
  const packages = state.packages?.length ? state.packages : [];
  const packageOptions = (packages.length ? packages : [
    { id: 'trial', name: 'Trial Plus' },
    { id: 'plus', name: 'PLUS' },
    { id: 'pro', name: 'PRO' },
  ]).map((item) => `
    <option value="${esc(item.id)}" ${String(draft.packageTier || 'trial') === String(item.id) ? 'selected' : ''}>
      ${esc(item.name || item.id)}
    </option>
  `).join('');

  return `
    <div class="tenant-create-backdrop" data-action="close-create-tenant"></div>
    <section class="tenant-create-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-create-title">
      <header class="tenant-create-head">
        <div>
          <h2 id="tenant-create-title">Create Tenant</h2>
          <p>Add a business directly without going through a trial request.</p>
        </div>
        <button type="button" data-action="close-create-tenant" aria-label="Close create tenant form"></button>
      </header>

      <div class="tenant-create-form">
        <label class="tenant-create-field">
          <span>Tenant name</span>
          <input data-field="tenantName" value="${esc(draft.name || '')}" placeholder="Business name" />
        </label>
        <label class="tenant-create-field">
          <span>Owner name</span>
          <input data-field="tenantOwnerName" value="${esc(draft.ownerName || '')}" placeholder="Primary owner" />
        </label>
        <label class="tenant-create-field">
          <span>Owner email</span>
          <input data-field="tenantOwnerEmail" type="email" value="${esc(draft.ownerEmail || '')}" placeholder="owner@example.com" />
        </label>
        <label class="tenant-create-field">
          <span>Package</span>
          <select data-field="tenantPackageTier">${packageOptions}</select>
        </label>
        <label class="tenant-create-field">
          <span>Operating mode</span>
          <select data-field="tenantOperatingMode">
            <option value="simple" ${String(draft.operatingMode || 'simple') === 'simple' ? 'selected' : ''}>Simple</option>
            <option value="restaurant" ${String(draft.operatingMode || '') === 'restaurant' ? 'selected' : ''}>Restaurant</option>
            <option value="retail" ${String(draft.operatingMode || '') === 'retail' ? 'selected' : ''}>Retail</option>
          </select>
        </label>
        <label class="tenant-create-field">
          <span>Status</span>
          <select data-field="tenantStatus">
            <option value="active" ${String(draft.status || 'active') === 'active' ? 'selected' : ''}>Active</option>
            <option value="trial" ${String(draft.status || '') === 'trial' ? 'selected' : ''}>Trial</option>
            <option value="suspended" ${String(draft.status || '') === 'suspended' ? 'selected' : ''}>Suspended</option>
          </select>
        </label>
        <label class="tenant-create-field tenant-create-field-wide">
          <span>Renewal date</span>
          <input data-field="tenantRenewalDate" type="date" value="${esc(draft.renewalDate || '')}" />
        </label>
      </div>

      <footer class="tenant-create-actions">
        <button type="button" class="tenant-create-secondary" data-action="close-create-tenant">Cancel</button>
        <button type="button" class="tenant-create-primary" data-action="create-tenant">Create Tenant</button>
      </footer>
    </section>
  `;
}

function renderTenantRow(tenant, selected) {
  const status = statusOf(tenant);
  const initials = tenantInitials(tenant.name);
  const branches = Number(tenant.branches || 0);
  const users = Number(tenant.users || 0);

  return `
    <div class="tenant-table-row">
      <label class="tenant-check"><input type="checkbox" data-action="toggle-tenant-selection" data-id="${esc(tenant.id)}" ${selected.has(String(tenant.id)) ? 'checked' : ''} /></label>
      <button type="button" class="tenant-name-cell" data-action="select-tenant" data-id="${esc(tenant.id)}">
        <span>${esc(initials)}</span>
        <strong>${esc(tenant.name)}</strong>
        <small>${esc(tenantId(tenant.id))}</small>
      </button>
      <span class="tenant-owner">
        <strong>${esc(tenant.ownerName || tenant.owner || '-')}</strong>
        <small>${esc(tenant.ownerEmail || tenant.email || '-')}</small>
      </span>
      <span><b class="tenant-package ${esc(packageTone(tenant.packageTier))}">${esc(packageLabel(tenant.packageTier))}</b></span>
      <span class="tenant-mode">${esc(modeLabel(tenant.operatingMode))}</span>
      <span class="tenant-scale">
        <strong>${esc(branches)} / ${esc(users)}</strong>
        <small>${branches === 1 ? 'Store' : 'Stores'}</small>
      </span>
      <span><b class="tenant-status ${esc(status)}">${esc(statusLabel(status))}</b></span>
      <span class="tenant-renewal ${String(tenant.renewalDate || '').toLowerCase() === 'overdue' ? 'overdue' : ''}">${esc(formatRenewal(tenant.renewalDate))}</span>
      <span class="tenant-actions">
        <button type="button" data-action="toggle-status" data-id="${esc(tenant.id)}" aria-label="Toggle tenant status"></button>
      </span>
    </div>
  `;
}

function clampPage(value, total, pageSize) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, Number(value || 1)), max);
}

function paginationButtons(page, totalPages, action) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  const output = [`<button type="button" data-action="${action}" data-page="${Math.max(1, page - 1)}" ${page === 1 ? 'disabled' : ''}>Prev</button>`];
  let previous = 0;
  pages.forEach((item) => {
    if (previous && item - previous > 1) output.push('<button type="button" disabled>...</button>');
    output.push(`<button type="button" data-action="${action}" data-page="${item}" class="${item === page ? 'active' : ''}">${item}</button>`);
    previous = item;
  });
  output.push(`<button type="button" data-action="${action}" data-page="${Math.min(totalPages, page + 1)}" ${page === totalPages ? 'disabled' : ''}>Next</button>`);
  return output.join('');
}

function metricCard(label, value, change, tone) {
  return `
    <article class="tenant-metric ${tone}">
      <span>${esc(label)}</span>
      <strong>${Number(value || 0).toLocaleString('en-US')}</strong>
      <small>${esc(change)}</small>
    </article>
  `;
}

function tableHeader(items) {
  return `<div class="tenant-table-head">${items.map((item, index) => `<span>${index === 0 ? '<input type="checkbox" data-action="toggle-all-tenants" aria-label="Select visible tenants" />' : esc(item)}</span>`).join('')}</div>`;
}

function tenantId(id) {
  return `TN-${String(id || '0000').padStart(4, '0').slice(-4)}`;
}

function tenantInitials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'TN';
}

function statusOf(tenant) {
  return String(tenant.status || 'active').toLowerCase();
}

function statusLabel(value) {
  if (value === 'trial') return 'Trial';
  return value === 'suspended' ? 'Suspended' : 'Active';
}

function packageLabel(value) {
  const map = { pro: 'PRO', plus: 'PLUS', starter: 'STARTER', trial: 'TRIAL' };
  return map[String(value || '').toLowerCase()] || String(value || '-').toUpperCase();
}

function packageTone(value) {
  const tier = String(value || '').toLowerCase();
  if (tier === 'pro') return 'pro';
  if (tier === 'plus') return 'plus';
  return 'starter';
}

function modeLabel(value) {
  const mode = String(value || '').toLowerCase();
  if (mode === 'restaurant') return 'Restaurant';
  if (mode === 'retail') return 'Retail';
  return mode ? mode[0].toUpperCase() + mode.slice(1) : '-';
}

function formatRenewal(value) {
  if (!value) return '-';
  if (String(value).toLowerCase() === 'overdue') return 'Overdue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
