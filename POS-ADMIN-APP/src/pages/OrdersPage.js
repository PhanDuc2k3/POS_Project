import { esc, money } from '../utils/format.js';

export function renderOrdersPage(state, helpers) {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Subscription orders</h2>
      </div>
      <div class="table">
        ${tableHeader(['Order', 'Tenant', 'Package', 'Amount', 'Status', 'Date'])}
        ${state.orders.map((order) => `
          <div class="table-row">
            <strong>${esc(order.id)}</strong>
            <span>${esc(helpers.tenantName(order.tenantId))}</span>
            <span>${esc(order.packageTier)}</span>
            <span>${money(order.amount)}</span>
            <span><span class="badge ${order.status}">${esc(order.status)}</span></span>
            <span>${esc(order.date)}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function tableHeader(items) {
  return `<div class="table-row table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}
