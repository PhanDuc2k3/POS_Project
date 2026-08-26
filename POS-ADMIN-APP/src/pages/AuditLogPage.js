import { esc } from '../utils/format.js';

export function renderAuditLogPage(state) {
  const activity = state.activity?.items || [];
  const sessions = state.sessions || [];
  const total = state.activity?.total || activity.length;

  return `
    <section class="audit-page">
      <header class="audit-heading">
        <div>
          <h1>Trung tâm bảo mật</h1>
          <p>Quản lý phiên đăng nhập đang hoạt động và rà soát hoạt động bảo mật tài khoản.</p>
        </div>
        <button type="button" class="audit-refresh-btn" data-action="refresh-audit-data"><i></i>Làm mới</button>
      </header>

      <section class="audit-metrics">
        ${metricCard('Tổng sự kiện', total)}
        ${metricCard('Phiên hoạt động', sessions.length)}
        ${metricCard('Sự kiện bảo mật', countSecurityEvents(activity))}
        ${metricCard('Sự kiện mới nhất', latestEventLabel(activity))}
      </section>

      <section class="session-management-card">
        <div class="security-section-head">
          <div>
            <h2>Quản lý phiên</h2>
            <p>Rà soát thiết bị tin cậy và thu hồi truy cập khi phiên đăng nhập có dấu hiệu lạ.</p>
          </div>
          <div class="security-section-actions">
            <span>${esc(sessions.length)} đang hoạt động</span>
            <button type="button" class="logout-all-btn" data-action="logout-all-devices">Đăng xuất mọi thiết bị</button>
          </div>
        </div>
        <div class="session-table">
          <div class="session-table-head">
            <span>Thiết bị</span>
            <span>Client</span>
            <span>Vị trí</span>
            <span>Dùng gần nhất</span>
            <span>Thao tác</span>
          </div>
          ${sessions.map(renderSessionRow).join('') || '<div class="session-empty">Không tìm thấy phiên hoạt động</div>'}
        </div>
      </section>

      <section class="audit-table-card">
        <div class="security-section-head">
          <div>
            <h2>Nhật ký hoạt động</h2>
            <p>Các sự kiện đăng nhập, hồ sơ, mật khẩu, phiên và bảo mật gần đây.</p>
          </div>
          <span>${esc(activity.length)} đang hiển thị</span>
        </div>
        <div class="audit-table-head">
          <span>Thao tác</span>
          <span>Chi tiết</span>
          <span>Địa chỉ IP</span>
          <span>Thời điểm tạo</span>
        </div>
        <div class="audit-table-body">
          ${activity.map(renderAuditRow).join('') || '<div class="audit-empty">Không tìm thấy sự kiện kiểm toán</div>'}
        </div>
      </section>
    </section>
  `;
}

function renderSessionRow(session) {
  const title = session.deviceName || session.browser || session.deviceType || 'Thiết bị không xác định';
  const client = [session.clientType, session.browser, session.os].filter(Boolean).join(' / ');
  return `
    <article class="session-table-row">
      <span>
        <strong>${esc(title)} ${session.isCurrent ? '<em>Hiện tại</em>' : ''}</strong>
        <small>${esc(session.deviceId || session.screenResolution || 'Chưa có mã thiết bị')}</small>
      </span>
      <span>${esc(client || '-')}</span>
      <span>${esc(session.ipAddress || '-')}</span>
      <span>${esc(formatDate(session.lastUsed || session.createdAt))}</span>
      <span>
        <button type="button" class="session-revoke-btn" data-action="revoke-session" data-id="${esc(session.id)}">Thu hồi</button>
      </span>
    </article>
  `;
}

function renderAuditRow(item) {
  return `
    <article class="audit-table-row">
      <span>
        <strong>${esc(formatAction(item.action))}</strong>
        <small>${esc(item.action || '-')}</small>
      </span>
      <span>${esc(item.details || 'Không có chi tiết')}</span>
      <span>${esc(item.ipAddress || '-')}</span>
      <span>${esc(formatDate(item.createdAt))}</span>
    </article>
  `;
}

function metricCard(label, value) {
  return `
    <article class="audit-metric">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </article>
  `;
}

function countSecurityEvents(items) {
  return items.filter((item) => /PASSWORD|SECURITY|SESSION|LOGIN|LOGOUT|RESET/i.test(item.action || '')).length;
}

function latestEventLabel(items) {
  return items[0]?.action ? formatAction(items[0].action) : '-';
}

function formatAction(value) {
  return String(value || '-')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
