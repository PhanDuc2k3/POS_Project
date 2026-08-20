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
    ['order-provision', 'Force Complete'],
  ],
  PROVISIONING: [
    ['order-provision', 'Force Complete'],
  ],
};

export function renderOrdersPage(state, helpers) {
  const orders = state.orders || [];
  const selected = orders.find((order) => order.id === state.selectedOrderId || order.orderCode === state.selectedOrderId) || null;

  return `
    <section class="orders-page ${selected ? 'detail-open' : ''}">
      <header class="orders-heading">
        <h1>Orders</h1>
        <p>Manage customer purchases from request to activation.</p>
      </header>

      <div class="order-filter-tabs" aria-label="Order filters">
        ${['All Orders', 'Pending', 'In Progress', 'Paid', 'Provisioning', 'Completed'].map((label, index) => `
          <button type="button" class="${index === 0 ? 'active' : ''}">${label}</button>
        `).join('')}
      </div>

      <section class="orders-card">
        <div class="order-filter-row">
          <button type="button">Package: All <i></i></button>
          <button type="button">Status: Any <i></i></button>
          <button type="button">Date: Last 30 Days <i></i></button>
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
  const actions = (ORDER_ACTIONS[String(order.status || '').toUpperCase()] || [])
    .map(([action, label, tone]) => `<button class="detail-action-btn ${tone || 'primary'}" data-action="${action}" data-id="${esc(order.id)}">${esc(label)}</button>`)
    .join('');
  const tenantName = order.tenantId ? helpers.tenantName(order.tenantId) : '';
  const total = Number(order.amount || 0);
  const base = Math.round(total * 0.72);
  const hardware = Math.max(0, total - base);

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
        <button class="detail-action-btn muted" type="button">Hold Provisioning</button>
        ${actions || '<button class="detail-action-btn primary" type="button">Force Complete</button>'}
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
  if (['PROVISIONING', 'APPROVED'].includes(status)) return 'provisioning';
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
