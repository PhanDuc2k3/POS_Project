const config = require('../../../shared/config');
const logger = require('../../../shared/logger');
const mailer = require('../../../shared/mailer');

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

function orderStatusLabel(status) {
  const labels = {
    PENDING: 'Dang cho xu ly',
    CONTACTED: 'Da lien he',
    QUOTED: 'Da gui bao gia',
    WAITING_PAYMENT: 'Dang cho thanh toan',
    PAID: 'Da thanh toan',
    APPROVED: 'Da duyet',
    PROVISIONING: 'Dang khoi tao',
    ACTIVE: 'Da kich hoat',
    REJECTED: 'Da tu choi',
    CANCELLED: 'Da huy',
    ON_HOLD: 'Tam dung',
    PROVISIONING_FAILED: 'Khoi tao loi',
  };
  return labels[String(status || '').toUpperCase()] || String(status || 'Dang xu ly');
}

function orderStatusUrl(order) {
  const code = encodeURIComponent(order.orderCode || order.id || '');
  return `${config.MARKETING_APP_ORIGIN}/#order/${code}`;
}

function mailHtml(title, rows, footer = '') {
  const list = rows
    .filter((row) => row.value !== undefined && row.value !== null && row.value !== '')
    .map((row) => `<p style="margin:8px 0"><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</p>`)
    .join('');
  return [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#10143a">',
    `<h2 style="margin:0 0 16px">${escapeHtml(title)}</h2>`,
    list,
    footer ? `<p style="margin:18px 0 0">${footer}</p>` : '',
    '</div>',
  ].join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textFromRows(title, rows, footer = '') {
  return [
    title,
    '',
    ...rows
      .filter((row) => row.value !== undefined && row.value !== null && row.value !== '')
      .map((row) => `${row.label}: ${row.value}`),
    footer ? '' : null,
    footer || null,
  ].filter(Boolean).join('\n');
}

function sendLater(factory) {
  Promise.resolve()
    .then(factory)
    .catch((error) => logger.warn('Email notification failed', { error: error.message }));
}

function notifyAdmin(subject, rows) {
  if (!config.ADMIN_NOTIFY_EMAIL) return;
  sendLater(() => mailer.sendMail({
    to: config.ADMIN_NOTIFY_EMAIL,
    subject,
    text: textFromRows(subject, rows),
    html: mailHtml(subject, rows),
  }));
}

function notifyMarketingSignup(signup) {
  if (!signup?.email) return;
  const subject = 'POS Platform - Xac nhan dang ky tai khoan';
  const rows = [
    { label: 'Ho ten', value: signup.name },
    { label: 'Email', value: signup.email },
    { label: 'Trang thai', value: signup.status },
  ];
  sendLater(() => mailer.sendMail({
    to: signup.email,
    subject,
    text: textFromRows(subject, rows, 'Ban co the tiep tuc tao don dang ky goi POS tren website.'),
    html: mailHtml(subject, rows, 'Ban co the tiep tuc tao don dang ky goi POS tren website.'),
  }));
}

function notifyOrderCreated(order) {
  if (!order?.email) return;
  const subject = `POS Platform - Da nhan don ${order.orderCode || order.id}`;
  const rows = orderRows(order);
  const footer = `Theo doi trang thai don tai: ${orderStatusUrl(order)}`;
  sendLater(() => mailer.sendMail({
    to: order.email,
    subject,
    text: textFromRows(subject, rows, footer),
    html: mailHtml(subject, rows, `Theo doi trang thai don tai: <a href="${escapeHtml(orderStatusUrl(order))}">${escapeHtml(orderStatusUrl(order))}</a>`),
  }));
  notifyAdmin(`Don hang moi ${order.orderCode || order.id}`, rows);
}

function notifyOrderStatusChanged(order) {
  if (!order?.email) return;
  const subject = `POS Platform - Don ${order.orderCode || order.id}: ${orderStatusLabel(order.status)}`;
  const rows = orderRows(order);
  const footer = `Theo doi trang thai don tai: ${orderStatusUrl(order)}`;
  sendLater(() => mailer.sendMail({
    to: order.email,
    subject,
    text: textFromRows(subject, rows, footer),
    html: mailHtml(subject, rows, `Theo doi trang thai don tai: <a href="${escapeHtml(orderStatusUrl(order))}">${escapeHtml(orderStatusUrl(order))}</a>`),
  }));
}

function notifyTrialRequestSubmitted(request) {
  if (!request?.email) return;
  const subject = `POS Platform - Da nhan yeu cau dung thu ${request.id}`;
  const rows = trialRows(request);
  sendLater(() => mailer.sendMail({
    to: request.email,
    subject,
    text: textFromRows(subject, rows, 'Doi ngu POS Platform se kiem tra va phan hoi som.'),
    html: mailHtml(subject, rows, 'Doi ngu POS Platform se kiem tra va phan hoi som.'),
  }));
  notifyAdmin(`PLUS-Trial dang cho ${request.id}`, rows);
}

function notifyTrialRequestReviewed(request) {
  if (!request?.email) return;
  const subject = `POS Platform - Yeu cau dung thu ${request.status}`;
  const rows = trialRows(request);
  sendLater(() => mailer.sendMail({
    to: request.email,
    subject,
    text: textFromRows(subject, rows),
    html: mailHtml(subject, rows),
  }));
}

function notifySalesLeadCreated(lead) {
  notifyAdmin(`Lead ban hang moi ${lead.id}`, [
    { label: 'Khach hang', value: lead.name },
    { label: 'Email', value: lead.email },
    { label: 'Dien thoai', value: lead.phone },
    { label: 'Noi dung', value: lead.message },
  ]);
}

function notifySupportTicketCreated(ticket, message) {
  if (ticket?.email) {
    const subject = `POS Platform - Da nhan ticket ${ticket.id}`;
    const rows = ticketRows(ticket);
    sendLater(() => mailer.sendMail({
      to: ticket.email,
      subject,
      text: textFromRows(subject, rows, 'Doi ngu ho tro se phan hoi trong thoi gian som nhat.'),
      html: mailHtml(subject, rows, 'Doi ngu ho tro se phan hoi trong thoi gian som nhat.'),
    }));
  }

  notifyAdmin(`Ticket ho tro moi ${ticket.id}`, [
    ...ticketRows(ticket),
    { label: 'Noi dung', value: message?.body || '' },
  ]);
}

function notifySupportTicketReply(ticket, message) {
  if (!ticket?.email || !message?.body) return;
  const subject = `POS Platform - Phan hoi ticket ${ticket.id}`;
  const rows = ticketRows(ticket);
  const text = [
    subject,
    '',
    ...rows.map((row) => `${row.label}: ${row.value}`),
    '',
    'Noi dung phan hoi:',
    message.body,
  ].join('\n');
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#10143a">',
    `<h2 style="margin:0 0 16px">${escapeHtml(subject)}</h2>`,
    rows.map((row) => `<p style="margin:8px 0"><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</p>`).join(''),
    '<hr style="border:none;border-top:1px solid #dce1ef;margin:18px 0" />',
    `<p>${escapeHtml(message.body).replace(/\n/g, '<br>')}</p>`,
    '</div>',
  ].join('');
  sendLater(() => mailer.sendMail({ to: ticket.email, subject, text, html }));
}

function orderRows(order) {
  return [
    { label: 'Ma don', value: order.orderCode || order.id },
    { label: 'Khach hang', value: order.customerName },
    { label: 'Cong ty', value: order.companyName },
    { label: 'Email', value: order.email },
    { label: 'Dien thoai', value: order.phone },
    { label: 'Goi', value: order.packageTier },
    { label: 'So tien', value: formatVnd(order.amount) },
    { label: 'Trang thai', value: orderStatusLabel(order.status) },
    { label: 'Thanh toan', value: order.paymentStatus },
  ];
}

function trialRows(request) {
  return [
    { label: 'Ma yeu cau', value: request.id },
    { label: 'Nha hang', value: request.restaurantName },
    { label: 'Nguoi lien he', value: request.contactName },
    { label: 'Email', value: request.email },
    { label: 'Dien thoai', value: request.phone },
    { label: 'Goi', value: request.packageTier },
    { label: 'Trang thai', value: request.status },
  ];
}

function ticketRows(ticket) {
  return [
    { label: 'Ma ticket', value: ticket.id },
    { label: 'Tieu de', value: ticket.subject },
    { label: 'Khach hang', value: ticket.customerName },
    { label: 'Email', value: ticket.email },
    { label: 'Dien thoai', value: ticket.phone },
    { label: 'Ma don lien quan', value: ticket.orderCode },
    { label: 'Muc uu tien', value: ticket.priority },
    { label: 'Trang thai', value: ticket.status },
  ];
}

module.exports = {
  notifyMarketingSignup,
  notifyOrderCreated,
  notifyOrderStatusChanged,
  notifyTrialRequestSubmitted,
  notifyTrialRequestReviewed,
  notifySalesLeadCreated,
  notifySupportTicketCreated,
  notifySupportTicketReply,
};
