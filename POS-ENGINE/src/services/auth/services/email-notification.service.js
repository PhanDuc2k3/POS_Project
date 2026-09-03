const mailer = require('../../../shared/mailer');
const logger = require('../../../shared/logger');

function sendLater(factory) {
  Promise.resolve()
    .then(factory)
    .catch((error) => logger.warn('Auth email notification failed', { error: error.message }));
}

function notifyPasswordReset(user) {
  if (!user?.email) return;
  const subject = 'POS Platform - Mat khau vua duoc dat lai';
  const text = [
    'Mat khau POS Platform cua ban vua duoc dat lai thanh cong.',
    '',
    `Tai khoan: ${user.username || user.email}`,
    'Neu ban khong thuc hien thao tac nay, hay lien he quan tri vien ngay.',
  ].join('\n');
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#10143a">',
    '<h2 style="margin:0 0 16px">Mat khau vua duoc dat lai</h2>',
    '<p>Mat khau POS Platform cua ban vua duoc dat lai thanh cong.</p>',
    `<p><strong>Tai khoan:</strong> ${escapeHtml(user.username || user.email)}</p>`,
    '<p>Neu ban khong thuc hien thao tac nay, hay lien he quan tri vien ngay.</p>',
    '</div>',
  ].join('');

  sendLater(() => mailer.sendMail({
    to: user.email,
    subject,
    text,
    html,
  }));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  notifyPasswordReset,
};
