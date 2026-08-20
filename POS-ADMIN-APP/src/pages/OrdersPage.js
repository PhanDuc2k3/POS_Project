import { esc, money } from '../utils/format.js';

const ORDER_ACTIONS = {
  PENDING: [
    ['order-contact', 'Mark Contacted'],
    ['order-reject', 'Reject', 'danger'],
  ],
  CONTACTED: [
    ['order-quote', 'Confirm Quote'],
    ['order-cancel', 'Cancel', 'danger'],
  ],
  QUOTED: [
    ['order-wait-payment', 'Waiting Payment'],
    ['order-cancel', 'Cancel', 'danger'],
  ],
  WAITING_PAYMENT: [
    ['order-confirm-payment', 'Confirm Payment'],
    ['order-cancel', 'Cancel', 'danger'],
  ],
  PAID: [
    ['order-approve', 'Approve'],
  ],
  APPROVED: [
    ['order-provision', 'Provision Tenant'],
  ],
  PROVISIONING_FAILED: [
    ['order-provision', 'Retry Provisioning'],
  ],
  ON_HOLD: [
    ['order-provision', 'Resume Provisioning'],
  ],
};

export function renderOrdersPage(state, helpers) {
  const sourceOrders = state.orders || [];
  const orders = filterOrders(sourceOrders, state);
  const selected = orders.find((order) => order.id === state.selectedOrderId || order.orderCode === state.selectedOrderId) || null;
  const tabs = [
    ['all', 'All Orders'],
    ['pending', 'Pending'],
    ['in_progress', 'In Progress'],
    ['paid', 'Paid'],
    ['provisioning', 'Provisioning'],
    ['completed', 'Completed'],
  ];

  return `
    <section class="orders-page ${selected ? 'detail-open' : ''}">
      <header class="orders-heading">
        <h1>Orders</h1>
        <p>Manage customer purchases from request to activation.</p>
      </header>

      <div class="order-filter-tabs" aria-label="Order filters">
        ${tabs.map(([value, label]) => `
          <button type="button" class="${(state.orderStatusFilter || 'all') === value ? 'active' : ''}" data-action="set-order-status-filter" data-status="${esc(value)}">${esc(label)}</button>
        `).join('')}
      </div>

      ${renderPublicOrderLookup(state)}

      <section class="orders-card">
        <div class="order-filter-row">
          <label>Package
            <select data-field="orderPackageFilter">
              <option value="all">All</option>
              ${uniqueOptions(sourceOrders.map((order) => order.packageTier)).map((value) => `<option value="${esc(value)}" ${state.orderPackageFilter === value ? 'selected' : ''}>${esc(packageLabel(value))}</option>`).join('')}
            </select>
          </label>
          <label>Status
            <select data-field="orderDetailStatusFilter">
              <option value="all">Any</option>
              ${uniqueOptions(sourceOrders.map((order) => String(order.status || '').toUpperCase())).map((value) => `<option value="${esc(value)}" ${state.orderDetailStatusFilter === value ? 'selected' : ''}>${esc(statusLabel(value))}</option>`).join('')}
            </select>
          </label>
          <label>Date
            <select data-field="orderDateFilter">
              <option value="all" ${state.orderDateFilter === 'all' ? 'selected' : ''}>All time</option>
              <option value="7" ${state.orderDateFilter === '7' ? 'selected' : ''}>Last 7 days</option>
              <option value="30" ${!state.orderDateFilter || state.orderDateFilter === '30' ? 'selected' : ''}>Last 30 days</option>
              <option value="90" ${state.orderDateFilter === '90' ? 'selected' : ''}>Last 90 days</option>
            </select>
          </label>
        </div>

        <div class="orders-list-table">
          ${tableHeader(['Order ID', 'Customer & Company', 'Package Details', 'Amount', 'Status'])}
          ${orders.map((order) => renderOrderRow(order, selected)).join('') || '<div class="empty">No orders yet</div>'}
        </div>
        <div class="orders-count">Showing ${orders.length ? `1 to ${orders.length}` : '0'} of ${orders.length || 0} orders</div>
      </section>

      ${selected ? renderOrderDetailPopup(selected, helpers) : ''}
    </section>
  `;
}

function filterOrders(orders, state) {
  return orders.filter((order) => {
    const status = String(order.status || '').toUpperCase();
    const tabMatch = orderTabMatches(status, state.orderStatusFilter || 'all');
    const packageMatch = state.orderPackageFilter === 'all' || !state.orderPackageFilter || order.packageTier === state.orderPackageFilter;
    const statusMatch = state.orderDetailStatusFilter === 'all' || !state.orderDetailStatusFilter || status === state.orderDetailStatusFilter;
    const dateMatch = orderDateMatches(order.createdAt, state.orderDateFilter || 'all');
    return tabMatch && packageMatch && statusMatch && dateMatch;
  });
}

function orderTabMatches(status, filter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return status === 'PENDING';
  if (filter === 'in_progress') return ['CONTACTED', 'QUOTED', 'WAITING_PAYMENT'].includes(status);
  if (filter === 'paid') return status === 'PAID' || status === 'APPROVED';
  if (filter === 'provisioning') return ['PROVISIONING', 'PROVISIONING_FAILED', 'ON_HOLD'].includes(status);
  if (filter === 'completed') return ['COMPLETED', 'ACTIVE'].includes(status);
  return true;
}

function orderDateMatches(value, range) {
  if (!range || range === 'all') return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(range));
  return date >= cutoff;
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function renderPublicOrderLookup(state) {
  const result = state.publicOrderLookupResult || null;
  return `
    <section class="public-order-lookup">
      <div class="public-order-copy">
        <h2>Public Order Lookup</h2>
        <p>Check the status returned to customers from the public order status endpoint.</p>
      </div>
      <div class="public-order-search">
        <label>
          <span>Order code</span>
          <input data-field="publicOrderLookupCode" value="${esc(state.publicOrderLookupCode || '')}" placeholder="ORD-2026-000001" />
        </label>
        <button type="button" data-action="lookup-public-order">Lookup</button>
        ${result ? '<button type="button" class="public-order-clear" data-action="clear-public-order-lookup">Clear</button>' : ''}
      </div>
      ${result ? renderPublicOrderResult(result) : ''}
    </section>
  `;
}

function renderPublicOrderResult(order) {
  return `
    <div class="public-order-result">
      <span class="order-status-pill ${statusTone(order.status)}">${esc(statusLabel(order.status))}</span>
      <div>
        <strong>${esc(order.orderCode || '-')}</strong>
        <small>Created ${esc(formatShortDate(order.createdAt) || '-')}</small>
      </div>
      <div>
        <strong>${esc(packageLabel(order.packageTier))}</strong>
        <small>${esc(order.requestedStoreCount || 1)} ${Number(order.requestedStoreCount || 1) === 1 ? 'Store' : 'Stores'}</small>
      </div>
      <div>
        <strong>${esc(statusLabel(order.paymentStatus || 'UNPAID'))}</strong>
        <small>Payment status</small>
      </div>
    </div>
  `;
}

function renderOrderRow(order, selected) {
  const active = selected && selected.id === order.id ? 'active' : '';
  const storeCount = order.requestedStoreCount || 1;
  const deviceCount = order.requestedDeviceCount || 0;

  return `
    <button class="orders-list-row ${active}" data-action="select-order" data-id="${esc(order.id)}">
      <span class="order-code">
        <strong>${esc(order.orderCode || order.id)}</strong>
        <small>#${esc(shortId(order.id))}</small>
      </span>
      <span class="order-customer">
        <strong>${esc(order.customerName || '-')}</strong>
        <small>${esc(order.companyName || '-')}</small>
      </span>
      <span class="order-package">
        <strong>${esc(packageLabel(order.packageTier))}</strong>
        <small>${esc(storeCount)} ${storeCount === 1 ? 'Store' : 'Stores'} + ${esc(deviceCount)} ${deviceCount === 1 ? 'Device' : 'Devices'}</small>
      </span>
      <span class="order-amount">${money(order.amount)} VND</span>
      <span><span class="order-status-pill ${statusTone(order.status)}">${esc(statusLabel(order.status))}</span></span>
    </button>
  `;
}

function renderOrderDetailPopup(order, helpers) {
  return `
    <div class="order-detail-backdrop" data-action="close-order-detail"></div>
    ${renderOrderDetail(order, helpers)}
  `;
}

function renderOrderDetail(order, helpers) {
  const status = String(order.status || '').toUpperCase();
  const actions = (ORDER_ACTIONS[String(order.status || '').toUpperCase()] || [])
    .map(([action, label, tone]) => `<button class="detail-action-btn ${tone || 'primary'}" data-action="${action}" data-id="${esc(order.id)}">${esc(label)}</button>`)
    .join('');
  const tenantName = order.tenantId ? helpers.tenantName(order.tenantId) : '';
  const total = Number(order.amount || 0);
  const base = Math.round(total * 0.72);
  const hardware = Math.max(0, total - base);
  const canHold = ['APPROVED', 'PROVISIONING', 'PROVISIONING_FAILED'].includes(status);

  return `
    <aside class="order-detail-drawer" role="dialog" aria-modal="true" aria-label="Order details">
      <header class="order-detail-head">
        <div>
          <h2>#${esc(order.orderCode || order.id)}</h2>
          <p>Created on ${esc(formatShortDate(order.createdAt) || 'Pending')} by ${esc(order.approvedBy || 'System')}</p>
        </div>
        <span class="order-status-pill ${statusTone(order.status)}">${esc(statusLabel(order.status))}</span>
        <button class="order-detail-close" type="button" data-action="close-order-detail" aria-label="Close order details"></button>
      </header>

      <section class="order-contact-card">
        <div class="contact-avatar">${esc(initials(order.customerName || order.companyName || 'SJ'))}</div>
        <div>
          <strong>${esc(order.customerName || '-')}</strong>
          <span>${esc(order.companyName || tenantName || '-')}</span>
          <small>${esc(order.email || '-')}</small>
        </div>
        <div class="contact-phone">
          <span>${esc(order.phone || '(555) 123-4567')}</span>
        </div>
      </section>

      <section class="order-details-box">
        <h3>Order Details</h3>
        ${detailLine(`${packageLabel(order.packageTier)} (${esc(order.orderType || 'Annual')})`, `${money(total)} VND`)}
        ${detailLine(`Base License (${esc(order.requestedStoreCount || 1)} Stores)`, `${money(base)} VND`)}
        ${detailLine(`Hardware Add-on (${esc(order.requestedDeviceCount || 0)} Devices)`, `${money(hardware)} VND`)}
        ${detailLine('Total Paid', `${money(total)} VND`, 'total')}
      </section>

      <section class="activation-timeline">
        <h3>Activation Timeline</h3>
        ${drawerTimelineItem('Request Created', order.createdAt, 'Web Form')}
        ${drawerTimelineItem('Contacted', order.contactedAt, 'Sales Rep')}
        ${drawerTimelineItem('Quote Sent', order.quotedAt, 'Valid for 30 days')}
        ${drawerTimelineItem('Payment Confirmed', order.paidAt, order.paymentStatus || 'Payment pending', 'paid')}
        ${drawerTimelineItem('Provisioning Environment', order.provisionedAt, order.provisioningStep || 'In Progress - Generating tenant ID...', 'current')}
      </section>

      <div class="order-drawer-actions">
        ${canHold ? `<button class="detail-action-btn muted" type="button" data-action="order-hold-provisioning" data-id="${esc(order.id)}">Hold Provisioning</button>` : ''}
        ${actions}
      </div>
    </aside>
  `;
}

function detailLine(label, value, tone = '') {
  return `
    <div class="order-detail-line ${tone}">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </div>
  `;
}

function drawerTimelineItem(label, date, detail = '', tone = '') {
  return `
    <div class="drawer-timeline-item ${date ? 'done' : ''} ${tone}">
      <strong>${esc(label)}</strong>
      <span>${esc(formatShortDate(date) || 'Pending')} ${detail ? `- ${esc(detail)}` : ''}</span>
    </div>
  `;
}

function tableHeader(items) {
  return `<div class="orders-list-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}

function formatDate(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 19);
}

function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function packageLabel(value) {
  const map = { trial: 'Trial Plus', plus: 'Enterprise POS Tier', pro: 'Enterprise POS Tier', starter: 'Starter', restaurant: 'Restaurant', chain: 'Chain' };
  return map[value] || value || '-';
}

function statusLabel(value) {
  return String(value || 'PENDING').replaceAll('_', ' ');
}

function statusTone(value) {
  const status = String(value || '').toUpperCase();
  if (['PROVISIONING', 'APPROVED', 'ON_HOLD'].includes(status)) return 'provisioning';
  if (['PAID', 'COMPLETED', 'ACTIVE'].includes(status)) return 'success';
  if (['REJECTED', 'CANCELLED', 'FAILED', 'PROVISIONING_FAILED'].includes(status)) return 'danger';
  if (['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT'].includes(status)) return 'warning';
  return 'neutral';
}

function shortId(value) {
  return String(value || '').slice(0, 8) || 'order';
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SJ';
}
