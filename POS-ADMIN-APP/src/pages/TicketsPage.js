import { esc } from '../utils/format.js';
import { renderIcon } from '../utils/icons.js';

const statusOptions = [
  ['OPEN', 'Mới'],
  ['IN_PROGRESS', 'Đang xử lý'],
  ['WAITING_CUSTOMER', 'Chờ khách'],
  ['RESOLVED', 'Đã xử lý'],
  ['CLOSED', 'Đã đóng'],
];

export function renderTicketsPage(state) {
  const tickets = filterTickets(state.supportTickets || [], state);
  const selected = (state.supportTickets || []).find((ticket) => ticket.id === state.selectedSupportTicketId) || tickets[0] || null;

  return `
    <section class="tickets-page">
      <header class="tickets-heading">
        <div>
          <h1>Tickets hỗ trợ</h1>
          <p>Quản lý trao đổi với khách hàng trong app, email chỉ là kênh gửi/nhận thông báo.</p>
        </div>
        <button type="button" class="tickets-refresh-btn" data-action="refresh-ticket-data">
          ${renderIcon('refresh-cw')} Làm mới
        </button>
      </header>

      ${state.ticketMessage ? `<div class="tickets-message ${esc(state.ticketTone || 'info')}">${esc(state.ticketMessage)}</div>` : ''}

      <div class="tickets-toolbar">
        <label>
          ${renderIcon('search')}
          <input data-field="supportTicketSearch" value="${esc(state.supportTicketSearch || '')}" placeholder="Tìm ticket, email, mã đơn..." />
        </label>
        <select data-field="supportTicketStatusFilter">
          <option value="all">Tất cả trạng thái</option>
          ${statusOptions.map(([value, label]) => `<option value="${esc(value)}" ${state.supportTicketStatusFilter === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}
        </select>
      </div>

      <div class="tickets-layout">
        <section class="tickets-list">
          ${tickets.map((ticket) => renderTicketListItem(ticket, selected)).join('') || '<div class="tickets-empty">Chưa có ticket hỗ trợ</div>'}
        </section>
        <section class="ticket-detail">
          ${selected ? renderTicketDetail(selected, state) : '<div class="tickets-empty">Chọn một ticket để xem hội thoại</div>'}
        </section>
      </div>
    </section>
  `;
}

function filterTickets(tickets, state) {
  const query = String(state.supportTicketSearch || '').trim().toLowerCase();
  const status = String(state.supportTicketStatusFilter || 'all').toUpperCase();
  return tickets.filter((ticket) => {
    const statusMatch = status === 'ALL' || String(ticket.status || '').toUpperCase() === status;
    const haystack = [
      ticket.id,
      ticket.subject,
      ticket.customerName,
      ticket.email,
      ticket.phone,
      ticket.orderCode,
      ticket.priority,
      ...(ticket.messages || []).map((message) => message.body),
    ].join(' ').toLowerCase();
    return statusMatch && (!query || haystack.includes(query));
  });
}

function renderTicketListItem(ticket, selected) {
  const active = selected?.id === ticket.id ? 'active' : '';
  const latest = [...(ticket.messages || [])].pop();
  return `
    <button type="button" class="ticket-list-item ${active}" data-action="select-support-ticket" data-id="${esc(ticket.id)}">
      <span class="ticket-priority ${esc(priorityTone(ticket.priority))}">${esc(priorityLabel(ticket.priority))}</span>
      <strong>${esc(ticket.subject)}</strong>
      <small>${esc(ticket.customerName)} · ${esc(ticket.email)}</small>
      <p>${esc(latest?.body || 'Chưa có nội dung')}</p>
      <b class="${esc(statusTone(ticket.status))}">${esc(statusLabel(ticket.status))}</b>
    </button>
  `;
}

function renderTicketDetail(ticket, state) {
  return `
    <div class="ticket-detail-head">
      <div>
        <span>${esc(ticket.id)}</span>
        <h2>${esc(ticket.subject)}</h2>
        <p>${esc(ticket.customerName)} · ${esc(ticket.email)} ${ticket.orderCode ? `· ${esc(ticket.orderCode)}` : ''}</p>
      </div>
      <b class="${esc(statusTone(ticket.status))}">${esc(statusLabel(ticket.status))}</b>
    </div>

    <div class="ticket-actions-row">
      ${statusOptions.map(([status, label]) => `
        <button type="button" class="${String(ticket.status).toUpperCase() === status ? 'active' : ''}" data-action="update-support-ticket-status" data-id="${esc(ticket.id)}" data-status="${esc(status)}">${esc(label)}</button>
      `).join('')}
    </div>

    <div class="ticket-thread">
      ${(ticket.messages || []).map(renderMessage).join('') || '<div class="tickets-empty">Chưa có tin nhắn</div>'}
    </div>

    <div class="ticket-reply-box">
      <label>
        <span>Phản hồi qua app và email</span>
        <textarea data-field="supportTicketReplyDraft" rows="5" placeholder="Nhập nội dung phản hồi...">${esc(state.supportTicketReplyDraft || '')}</textarea>
      </label>
      <button type="button" data-action="reply-support-ticket" data-id="${esc(ticket.id)}">
        ${renderIcon('send')} Gửi phản hồi
      </button>
    </div>
  `;
}

function renderMessage(message) {
  const own = String(message.senderType || '').toUpperCase() === 'ADMIN';
  return `
    <article class="ticket-message ${own ? 'admin' : 'customer'}">
      <header>
        <strong>${esc(own ? (message.senderName || 'Admin') : (message.senderName || 'Khách hàng'))}</strong>
        <span>${esc(formatDate(message.createdAt))}</span>
      </header>
      <p>${esc(message.body)}</p>
      ${message.sentByEmail ? '<small>Đã gửi email</small>' : ''}
    </article>
  `;
}

function statusLabel(value) {
  const map = Object.fromEntries(statusOptions);
  return map[String(value || '').toUpperCase()] || String(value || '-');
}

function statusTone(value) {
  const status = String(value || '').toUpperCase();
  if (['RESOLVED', 'CLOSED'].includes(status)) return 'success';
  if (status === 'WAITING_CUSTOMER') return 'warning';
  if (status === 'IN_PROGRESS') return 'progress';
  return 'open';
}

function priorityLabel(value) {
  const map = { LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp' };
  return map[String(value || '').toUpperCase()] || 'Bình thường';
}

function priorityTone(value) {
  const priority = String(value || '').toUpperCase();
  if (priority === 'URGENT') return 'urgent';
  if (priority === 'HIGH') return 'high';
  if (priority === 'LOW') return 'low';
  return 'normal';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}
