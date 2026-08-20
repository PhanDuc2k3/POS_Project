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
  const tenants = state.tenants?.length ? state.tenants : fallbackTenants;
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
          <button type="button" class="tenant-export-btn"><i></i>Export</button>
          <button type="button" class="tenant-add-btn" data-action="view" data-view="requests"><span></span>Add Tenant</button>
        </div>
      </header>

      <section class="tenant-metrics">
        ${metricCard('Total Tenants', tenants.length || 1248, '+12%', 'neutral')}
        ${metricCard('Active', active || 1180, '+5%', 'success')}
        ${metricCard('Suspended', suspended || 68, '+2%', 'danger')}
        ${metricCard('Total Stores', totalStores || 3492, '+18%', 'neutral')}
      </section>

      <section class="tenants-table-card">
        <div class="tenants-toolbar">
          <label class="tenant-search">
            <i></i>
            <input aria-label="Search tenants" placeholder="Search tenant name or ID..." />
          </label>
          <div class="tenant-filters">
            <button type="button">All Packages</button>
            <button type="button">All Modes</button>
            <button type="button">Status: All</button>
            <button type="button" class="tenant-filter-icon" aria-label="Filter options"></button>
          </div>
        </div>

        <div class="tenant-table">
          ${tableHeader(['', 'Tenant Name', 'Owner', 'Package', 'Op. Mode', 'Stores / Users', 'Status', 'Renewal', 'Actions'])}
          ${tenants.map((tenant) => renderTenantRow(tenant)).join('')}
        </div>

        <div class="tenant-pagination">
          <span>Showing 1 to ${Math.min(tenants.length, 10)} of ${tenants.length || 0} entries</span>
          <div>
            <button type="button">Prev</button>
            <button type="button" class="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">...</button>
            <button type="button">Next</button>
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderTenantRow(tenant) {
  const status = statusOf(tenant);
  const initials = tenantInitials(tenant.name);
  const branches = Number(tenant.branches || 0);
  const users = Number(tenant.users || 0);

  return `
    <div class="tenant-table-row">
      <label class="tenant-check"><input type="checkbox" /></label>
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
  return `<div class="tenant-table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
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
