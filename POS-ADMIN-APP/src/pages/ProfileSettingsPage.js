import { API_URL } from '../services/api.js';
import { esc } from '../utils/format.js';
import { roleLabels } from '../data/platform.js';

export function renderProfileSettingsPage(state) {
  const user = state.user || {};
  const draft = state.profileDraft || {};
  const security = state.securityDraft || {};
  const password = state.passwordDraft || {};
  const sessions = state.sessions || [];
  const avatarUrl = user.avatar ? `${API_URL.replace('/api', '')}${user.avatar}` : '';
  const activePanel = state.settingsPanel || '';

  return `
    <section class="settings-page">
      <header class="settings-heading">
        <div>
          <h1>Hồ sơ quản trị</h1>
          <p>Xem thông tin quản trị nền tảng và mở các thiết lập tài khoản khi cần.</p>
        </div>
        <button type="button" class="settings-refresh-btn" data-action="refresh-security-data"><i></i>Làm mới</button>
      </header>

      ${state.securityMessage ? `<div class="settings-message ${esc(state.securityTone || 'info')}">${esc(state.securityMessage)}</div>` : ''}

      <div class="settings-layout">
        <section class="admin-profile-hero">
          <div class="admin-profile-main">
            <div class="profile-avatar-xl ${avatarUrl ? 'has-image' : ''}">
              ${avatarUrl ? `<img src="${esc(avatarUrl)}" alt="${esc(user.displayName || user.username || 'Ảnh đại diện')}" />` : esc(initials(user.displayName || user.username))}
            </div>
            <div class="admin-profile-copy">
              <span>Quản trị nền tảng</span>
              <h2>${esc(user.displayName || user.username || 'Quản trị nền tảng')}</h2>
              <p>${esc(user.email || 'Chưa cấu hình email')}</p>
              <div class="admin-profile-badges">
                <b>${esc(roleLabels[user.role] || user.role || 'Quản trị')}</b>
                <b>${user.hasSecurityQuestion ? 'Đã đặt câu hỏi bảo mật' : 'Chưa có câu hỏi bảo mật'}</b>
                <b>${esc(sessions.length)} phiên hoạt động</b>
              </div>
            </div>
          </div>
          <div class="admin-profile-details">
            ${infoTile('Tên đăng nhập', user.username)}
            ${infoTile('Email', user.email)}
            ${infoTile('Vai trò', roleLabels[user.role] || user.role)}
            ${infoTile('Đăng nhập gần nhất', formatDate(user.lastLogin))}
            ${infoTile('Ngày tạo', formatDate(user.createdAt))}
            ${infoTile('Bảo mật', user.hasSecurityQuestion ? 'Đã cấu hình' : 'Cần thiết lập')}
          </div>
        </section>

        <section class="profile-action-panel">
          ${actionButton('profile', 'Cập nhật thông tin', 'Tên và email', activePanel)}
          ${actionButton('password', 'Đổi mật khẩu', 'Cần mật khẩu hiện tại', activePanel)}
          ${actionButton('security', 'Câu hỏi bảo mật', user.hasSecurityQuestion ? 'Cập nhật câu hỏi khôi phục' : 'Đặt câu hỏi khôi phục', activePanel)}
          ${actionButton('avatar', 'Ảnh đại diện', 'Tải lên hoặc gỡ ảnh', activePanel)}
          ${actionButton('sessions', 'Phiên đăng nhập', `${sessions.length} thiết bị đang hoạt động`, activePanel)}
        </section>

      </div>

      ${activePanel ? `
        <div class="settings-modal-backdrop" data-action="set-settings-panel" data-panel=""></div>
        <section class="settings-card settings-modal" role="dialog" aria-modal="true" aria-label="${esc(panelTitle(activePanel))}">
          <div class="settings-card-head">
            <h2>${esc(panelTitle(activePanel))}</h2>
            <button type="button" class="settings-close-btn" data-action="set-settings-panel" data-panel="" aria-label="Đóng"></button>
          </div>
          ${renderPanel(activePanel, { draft, security, password, sessions, user })}
        </section>
      ` : ''}
    </section>
  `;
}

function renderPanel(activePanel, context) {
  const { draft, security, password, sessions, user } = context;
  if (activePanel === 'profile') {
    return `
      <div class="settings-form-grid">
        ${field('Tên hiển thị', 'profileDisplayName', draft.displayName ?? user.displayName ?? '')}
        ${field('Email', 'profileEmail', draft.email ?? user.email ?? '', 'email')}
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-secondary-btn" data-action="refresh-security-data">Đặt lại</button>
        <button type="button" class="settings-primary-btn" data-action="save-profile">Lưu hồ sơ</button>
      </div>
    `;
  }
  if (activePanel === 'password') {
    return `
      <div class="settings-editor-body">
        ${field('Mật khẩu hiện tại', 'passwordCurrent', password.current || '', 'password')}
        ${field('Mật khẩu mới', 'passwordNew', password.next || '', 'password')}
        ${field('Xác nhận mật khẩu mới', 'passwordConfirm', password.confirm || '', 'password')}
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-danger-btn" data-action="change-password">Đổi mật khẩu</button>
      </div>
    `;
  }
  if (activePanel === 'security') {
    return `
      <div class="settings-editor-body">
        <label class="settings-field">
          <span>Câu hỏi</span>
          <textarea data-field="securityQuestion" rows="3" placeholder="Ví dụ: Tên cửa hàng đầu tiên của bạn là gì?">${esc(security.question ?? user.securityQuestion ?? '')}</textarea>
        </label>
        ${field('Câu trả lời', 'securityAnswer', security.answer || '', 'password')}
        ${field('Mật khẩu hiện tại', 'securityCurrentPassword', security.currentPassword || '', 'password')}
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-primary-btn" data-action="save-security-question">Lưu câu hỏi</button>
      </div>
    `;
  }
  if (activePanel === 'avatar') {
    return `
      <div class="settings-editor-body avatar-editor-body">
        <label class="avatar-dropzone">
          <input type="file" data-action="upload-avatar" accept="image/png,image/jpeg,image/webp" />
          <i></i>
          <strong>Tải ảnh đại diện</strong>
          <span>PNG, JPG, WebP tối đa 2MB</span>
        </label>
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-secondary-btn" data-action="delete-avatar">Gỡ ảnh đại diện</button>
      </div>
    `;
  }
  if (activePanel === 'sessions') {
    return `
      <div class="settings-session-toolbar">
        <span>${esc(sessions.length)} phiên hoạt động</span>
        <button type="button" class="logout-all-btn" data-action="logout-all-devices">Đăng xuất mọi thiết bị</button>
      </div>
      <div class="settings-list">
        ${sessions.map(renderSession).join('') || '<div class="settings-empty">Không tìm thấy phiên hoạt động</div>'}
      </div>
    `;
  }
  return '';
}

function field(label, fieldName, value, type = 'text') {
  return `
    <label class="settings-field">
      <span>${esc(label)}</span>
      <input type="${esc(type)}" data-field="${esc(fieldName)}" value="${esc(value)}" />
    </label>
  `;
}

function infoTile(label, value) {
  return `
    <div class="admin-info-tile">
      <span>${esc(label)}</span>
      <strong>${esc(value || '-')}</strong>
    </div>
  `;
}

function actionButton(panel, label, note, activePanel) {
  return `
    <button type="button" class="profile-action-btn ${activePanel === panel ? 'active' : ''}" data-action="set-settings-panel" data-panel="${esc(panel)}">
      <span>${esc(label)}</span>
      <small>${esc(note)}</small>
    </button>
  `;
}

function panelTitle(panel) {
  const titles = {
    profile: 'Cập nhật thông tin',
    password: 'Đổi mật khẩu',
    security: 'Câu hỏi bảo mật',
    avatar: 'Ảnh đại diện',
    sessions: 'Phiên hoạt động',
  };
  return titles[panel] || 'Thao tác hồ sơ';
}

function renderSession(session) {
  const title = session.deviceName || session.browser || session.deviceType || 'Thiết bị không xác định';
  const detail = [session.browser, session.os, session.ipAddress].filter(Boolean).join(' / ');
  return `
    <article class="settings-list-item">
      <div>
        <strong>${esc(title)} ${session.isCurrent ? '<em>Hiện tại</em>' : ''}</strong>
        <span>${esc(detail || 'Chưa có chi tiết thiết bị')}</span>
        <small>Dùng gần nhất ${esc(formatDate(session.lastUsed || session.createdAt))}</small>
      </div>
      <button type="button" data-action="revoke-session" data-id="${esc(session.id)}">Thu hồi</button>
    </article>
  `;
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PA';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
