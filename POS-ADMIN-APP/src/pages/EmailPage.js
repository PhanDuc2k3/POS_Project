import { esc } from '../utils/format.js';
import { renderIcon } from '../utils/icons.js';

export function renderEmailPage(state) {
  const status = state.emailStatus || {};
  const outbox = state.emailOutbox?.items || [];
  const draft = state.emailTestDraft || {};
  const isSmtpReady = Boolean(status.enabled);

  return `
    <section class="email-page">
      <header class="email-heading">
        <div>
          <h1>Quản lý email</h1>
          <p>Cấu hình SMTP, gửi thử và kiểm tra outbox email hệ thống.</p>
        </div>
        <button type="button" class="email-refresh-btn" data-action="refresh-email-data">
          ${renderIcon('refresh-cw')} Làm mới
        </button>
      </header>

      ${state.emailMessage ? `<div class="email-message ${esc(state.emailTone || 'info')}">${esc(state.emailMessage)}</div>` : ''}

      <div class="email-status-grid">
        ${renderStatusCard('Trạng thái SMTP', isSmtpReady ? 'Đang bật' : 'Outbox local', isSmtpReady ? 'success' : 'warning', isSmtpReady ? 'mail-check' : 'inbox')}
        ${renderStatusCard('SMTP host', status.host || 'Chưa cấu hình', '', 'server')}
        ${renderStatusCard('Cổng', status.port || '-', '', 'network')}
        ${renderStatusCard('Người gửi', status.from || '-', '', 'send')}
      </div>

      <div class="email-layout">
        <section class="email-card">
          <div class="email-card-head">
            <div>
              <span>SMTP runtime</span>
              <h2>Cấu hình đang dùng</h2>
            </div>
            <small>${esc(status.dryRun ? 'Dry-run bật' : 'Dry-run tắt')}</small>
          </div>
          <div class="email-config-list">
            ${renderConfigRow('Secure TLS', status.secure ? 'Có' : 'Không')}
            ${renderConfigRow('STARTTLS', status.starttls ? 'Có' : 'Không')}
            ${renderConfigRow('Đăng nhập SMTP', status.hasAuth ? 'Đã cấu hình' : 'Chưa có')}
            ${renderConfigRow('Email admin nhận thông báo', status.adminNotifyEmail || 'Chưa cấu hình')}
            ${renderConfigRow('Outbox local', status.outboxDir || '-')}
          </div>
        </section>

        <section class="email-card">
          <div class="email-card-head">
            <div>
              <span>Gửi thử</span>
              <h2>Kiểm tra email</h2>
            </div>
          </div>
          <div class="email-test-form">
            <label>
              <span>Email nhận</span>
              <input data-field="emailTestTo" value="${esc(draft.to || '')}" placeholder="admin@pos.local" />
            </label>
            <button type="button" data-action="send-test-email">
              ${renderIcon('send')} Gửi test
            </button>
          </div>
          <p class="email-muted">Nếu SMTP chưa bật hoặc gửi lỗi, hệ thống sẽ ghi email vào outbox local để kiểm tra nội dung.</p>
        </section>
      </div>

      <section class="email-card outbox-card">
        <div class="email-card-head">
          <div>
            <span>Outbox</span>
            <h2>Email local gần đây</h2>
          </div>
          <small>${esc(outbox.length)} email</small>
        </div>
        <div class="email-outbox-list">
          ${outbox.map(renderOutboxItem).join('') || '<div class="email-empty">Chưa có email trong outbox</div>'}
        </div>
      </section>
    </section>
  `;
}

function renderStatusCard(label, value, tone, icon) {
  return `
    <article class="email-status-card ${esc(tone || '')}">
      <div>${renderIcon(icon)}</div>
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </article>
  `;
}

function renderConfigRow(label, value) {
  return `
    <div class="email-config-row">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </div>
  `;
}

function renderOutboxItem(item) {
  return `
    <article class="email-outbox-item">
      <div>
        <strong>${esc(item.subject || '(Không có tiêu đề)')}</strong>
        <span>${esc(item.to || '-')}</span>
      </div>
      <small>${esc(formatDate(item.updatedAt))}</small>
    </article>
  `;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
