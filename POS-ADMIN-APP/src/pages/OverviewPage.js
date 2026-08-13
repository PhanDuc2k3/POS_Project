import { esc } from '../utils/format.js';

export function renderOverviewPage(state, helpers) {
  const tenant = helpers.selectedTenant();
  if (!tenant) {
    return `
      <div class="panel">
        <div class="panel-head">
          <h2>Selected tenant</h2>
        </div>
        <div class="panel-body">
          <p class="muted">No tenant data available yet.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="two-column">
      <section class="panel">
        <div class="panel-head">
          <h2>Selected tenant</h2>
          <span class="badge ${tenant.status}">${esc(tenant.status)}</span>
        </div>
        <div class="panel-body detail-grid">
          ${detail('Store', tenant.name)}
          ${detail('Owner', tenant.owner)}
          ${detail('Email', tenant.email)}
          ${detail('Package', tenant.packageTier)}
          ${detail('Mode', tenant.operatingMode)}
          ${detail('Renewal', tenant.renewalDate)}
        </div>
      </section>
      <section class="panel">
        <div class="panel-head">
          <h2>Operating model</h2>
        </div>
        <div class="panel-body flow-list">
          <div><strong>2 cap</strong><span>POS App + Portal App</span></div>
          <div><strong>4 cap</strong><span>Customer Order + Kitchen + Staff POS + Management</span></div>
          <div><strong>Permission layer</strong><span>Role matrix controls modules per tenant and package.</span></div>
        </div>
      </section>
    </div>
  `;
}

function detail(label, value) {
  return `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}
