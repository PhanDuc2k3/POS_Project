import { esc } from '../utils/format.js';

export function renderTenantsPage(state, helpers) {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Tenants</h2>
        <span class="muted">Stores and chains that bought a package</span>
      </div>
      <div class="table">
        ${tableHeader(['Tenant', 'Owner', 'Package', 'Mode', 'Status', 'Scale', ''])}
        ${state.tenants.map((tenant) => `
          <div class="table-row">
            <strong>${esc(tenant.name)}</strong>
            <span>${esc(tenant.ownerName || tenant.owner)}</span>
            <span>${esc(tenant.packageTier)}</span>
            <span>${esc(tenant.operatingMode)}</span>
            <span><span class="badge ${tenant.status}">${esc(tenant.status)}</span></span>
            <span>${tenant.branches} branches / ${tenant.users} users</span>
            <span class="row-actions">
              <button class="btn soft" data-action="select-tenant" data-id="${tenant.id}">Open</button>
              <button class="btn danger" data-action="toggle-status" data-id="${tenant.id}">${tenant.status === 'active' ? 'Suspend' : 'Activate'}</button>
            </span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function tableHeader(items) {
  return `<div class="table-row table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}
