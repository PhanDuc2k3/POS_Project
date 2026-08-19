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
    ['order-provision', 'Provision'],
  ],
};

export function renderOrdersPage(state, helpers) {
  const orders = state.orders || [];
  const selected = orders.find((order) => order.id === state.selectedOrderId || order.orderCode === state.selectedOrderId) || orders[0] || null;

  return `
    <div class="orders-layout">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Orders</h2>
            <span class="muted">${orders.length} purchase requests</span>
          </div>
        </div>
        <div class="table orders-table">
          ${tableHeader(['Order', 'Customer', 'Company', 'Package', 'Stores', 'Devices', 'Payment', 'Status', 'Date'])}
          ${orders.map((order) => renderOrderRow(order, selected)).join('') || '<div class="empty">No orders yet</div>'}
        </div>
      </section>
      ${selected ? renderOrderDetail(selected, helpers) : ''}
    </div>
  `;
}

function renderOrderRow(order, selected) {
  const active = selected && selected.id === order.id ? 'active' : '';
  return `
    <button class="table-row order-row ${active}" data-action="select-order" data-id="${esc(order.id)}">
      <strong>${esc(order.orderCode || order.id)}</strong>
      <span>${esc(order.customerName || '-')}</span>
      <span>${esc(order.companyName || '-')}</span>
      <span>${esc(packageLabel(order.packageTier))}</span>
      <span>${esc(order.requestedStoreCount || 1)}</span>
      <span>${esc(order.requestedDeviceCount || 0)}</span>
      <span><span class="badge ${esc(order.paymentStatus || 'UNPAID')}">${esc(order.paymentStatus || 'UNPAID')}</span></span>
      <span><span class="badge ${esc(order.status)}">${esc(order.status)}</span></span>
      <span>${esc(formatDate(order.createdAt))}</span>
    </button>
  `;
}

function renderOrderDetail(order, helpers) {
  const actions = (ORDER_ACTIONS[order.status] || [])
    .map(([action, label, tone]) => `<button class="btn ${tone || ''}" data-action="${action}" data-id="${esc(order.id)}">${label}</button>`)
    .join('');
  const tenantName = order.tenantId ? helpers.tenantName(order.tenantId) : '';

  return `
    <section class="panel order-detail">
      <div class="panel-head">
        <div>
          <h2>${esc(order.orderCode || order.id)}</h2>
          <span class="muted">${esc(order.orderType || 'MANAGED')} order</span>
        </div>
        <span class="badge ${esc(order.status)}">${esc(order.status)}</span>
      </div>
      <div class="detail-grid">
        ${detailBlock('Customer Information', [
          ['Name', order.customerName],
          ['Email', order.email],
          ['Phone', order.phone],
        ])}
        ${detailBlock('Company Information', [
          ['Company', order.companyName],
          ['Business Type', order.businessType || '-'],
          ['Notes', order.note || '-'],
        ])}
        ${detailBlock('Package Information', [
          ['Package', packageLabel(order.packageTier)],
          ['Requested Stores', order.requestedStoreCount || 1],
          ['Requested Devices', order.requestedDeviceCount || 0],
          ['Amount', `${money(order.amount)} VND`],
        ])}
        ${detailBlock('Payment', [
          ['Payment Status', order.paymentStatus || 'UNPAID'],
          ['Paid At', formatDate(order.paidAt)],
        ])}
        ${detailBlock('Provisioning Information', [
          ['Tenant', tenantName || '-'],
          ['Tenant ID', order.tenantId || '-'],
          ['Step', order.provisioningStep || '-'],
          ['Failure', order.failureReason || '-'],
        ])}
      </div>
      <div class="order-actions">${actions || '<span class="muted">No available action for this status</span>'}</div>
      <div class="timeline">
        ${timelineItem('Created', order.createdAt)}
        ${timelineItem('Contacted', order.contactedAt)}
        ${timelineItem('Quoted', order.quotedAt)}
        ${timelineItem('Paid', order.paidAt)}
        ${timelineItem('Approved', order.approvedAt, order.approvedBy)}
        ${timelineItem('Provisioned', order.provisionedAt)}
      </div>
    </section>
  `;
}

function detailBlock(title, rows) {
  return `
    <article class="detail-block">
      <strong>${esc(title)}</strong>
      ${rows.map(([label, value]) => `
        <div>
          <span>${esc(label)}</span>
          <b>${esc(value ?? '-')}</b>
        </div>
      `).join('')}
    </article>
  `;
}

function timelineItem(label, date, by = '') {
  return `
    <div class="timeline-item ${date ? 'done' : ''}">
      <strong>${esc(label)}</strong>
      <span>${esc(formatDate(date) || 'Pending')}${by ? ` · ${esc(by)}` : ''}</span>
    </div>
  `;
}

function tableHeader(items) {
  return `<div class="table-row table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}

function formatDate(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 19);
}

function packageLabel(value) {
  const map = { plus: 'PLUS', pro: 'PRO', starter: 'Starter', restaurant: 'Restaurant', chain: 'Chain' };
  return map[value] || value || '-';
}
