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
          <h1>Admin Profile</h1>
          <p>View platform admin information and open account controls when needed.</p>
        </div>
        <button type="button" class="settings-refresh-btn" data-action="refresh-security-data"><i></i>Refresh</button>
      </header>

      ${state.securityMessage ? `<div class="settings-message ${esc(state.securityTone || 'info')}">${esc(state.securityMessage)}</div>` : ''}

      <div class="settings-layout">
        <section class="admin-profile-hero">
          <div class="admin-profile-main">
            <div class="profile-avatar-xl ${avatarUrl ? 'has-image' : ''}">
              ${avatarUrl ? `<img src="${esc(avatarUrl)}" alt="${esc(user.displayName || user.username || 'Avatar')}" />` : esc(initials(user.displayName || user.username))}
            </div>
            <div class="admin-profile-copy">
              <span>Platform Admin</span>
              <h2>${esc(user.displayName || user.username || 'Platform Admin')}</h2>
              <p>${esc(user.email || 'No email configured')}</p>
              <div class="admin-profile-badges">
                <b>${esc(roleLabels[user.role] || user.role || 'Admin')}</b>
                <b>${user.hasSecurityQuestion ? 'Security Question Set' : 'Security Question Missing'}</b>
                <b>${esc(sessions.length)} Active Sessions</b>
              </div>
            </div>
          </div>
          <div class="admin-profile-details">
            ${infoTile('Username', user.username)}
            ${infoTile('Email', user.email)}
            ${infoTile('Role', roleLabels[user.role] || user.role)}
            ${infoTile('Last Login', formatDate(user.lastLogin))}
            ${infoTile('Created At', formatDate(user.createdAt))}
            ${infoTile('Security', user.hasSecurityQuestion ? 'Configured' : 'Needs setup')}
          </div>
        </section>

        <section class="profile-action-panel">
          ${actionButton('profile', 'Update Info', 'Name and email', activePanel)}
          ${actionButton('password', 'Change Password', 'Requires current password', activePanel)}
          ${actionButton('security', 'Security Question', user.hasSecurityQuestion ? 'Update recovery question' : 'Set recovery question', activePanel)}
          ${actionButton('avatar', 'Avatar', 'Upload or remove image', activePanel)}
          ${actionButton('sessions', 'Sessions', `${sessions.length} active devices`, activePanel)}
        </section>

      </div>

      ${activePanel ? `
        <div class="settings-modal-backdrop" data-action="set-settings-panel" data-panel=""></div>
        <section class="settings-card settings-modal" role="dialog" aria-modal="true" aria-label="${esc(panelTitle(activePanel))}">
          <div class="settings-card-head">
            <h2>${esc(panelTitle(activePanel))}</h2>
            <button type="button" class="settings-close-btn" data-action="set-settings-panel" data-panel="" aria-label="Close"></button>
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
        ${field('Display Name', 'profileDisplayName', draft.displayName ?? user.displayName ?? '')}
        ${field('Email', 'profileEmail', draft.email ?? user.email ?? '', 'email')}
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-secondary-btn" data-action="refresh-security-data">Reset</button>
        <button type="button" class="settings-primary-btn" data-action="save-profile">Save Profile</button>
      </div>
    `;
  }
  if (activePanel === 'password') {
    return `
      <div class="settings-editor-body">
        ${field('Current Password', 'passwordCurrent', password.current || '', 'password')}
        ${field('New Password', 'passwordNew', password.next || '', 'password')}
        ${field('Confirm New Password', 'passwordConfirm', password.confirm || '', 'password')}
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-danger-btn" data-action="change-password">Change Password</button>
      </div>
    `;
  }
  if (activePanel === 'security') {
    return `
      <div class="settings-editor-body">
        <label class="settings-field">
          <span>Question</span>
          <textarea data-field="securityQuestion" rows="3" placeholder="Example: What was your first store name?">${esc(security.question ?? user.securityQuestion ?? '')}</textarea>
        </label>
        ${field('Answer', 'securityAnswer', security.answer || '', 'password')}
        ${field('Current Password', 'securityCurrentPassword', security.currentPassword || '', 'password')}
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-primary-btn" data-action="save-security-question">Save Question</button>
      </div>
    `;
  }
  if (activePanel === 'avatar') {
    return `
      <div class="settings-editor-body avatar-editor-body">
        <label class="avatar-dropzone">
          <input type="file" data-action="upload-avatar" accept="image/png,image/jpeg,image/webp" />
          <i></i>
          <strong>Upload Avatar</strong>
          <span>PNG, JPG, WebP up to 2MB</span>
        </label>
      </div>
      <div class="settings-actions">
        <button type="button" class="settings-secondary-btn" data-action="delete-avatar">Remove Avatar</button>
      </div>
    `;
  }
  if (activePanel === 'sessions') {
    return `
      <div class="settings-session-toolbar">
        <span>${esc(sessions.length)} active sessions</span>
        <button type="button" class="logout-all-btn" data-action="logout-all-devices">Logout All Devices</button>
      </div>
      <div class="settings-list">
        ${sessions.map(renderSession).join('') || '<div class="settings-empty">No active sessions found</div>'}
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
    profile: 'Update Information',
    password: 'Change Password',
    security: 'Security Question',
    avatar: 'Avatar',
    sessions: 'Active Sessions',
  };
  return titles[panel] || 'Profile Action';
}

function renderSession(session) {
  const title = session.deviceName || session.browser || session.deviceType || 'Unknown device';
  const detail = [session.browser, session.os, session.ipAddress].filter(Boolean).join(' / ');
  return `
    <article class="settings-list-item">
      <div>
        <strong>${esc(title)} ${session.isCurrent ? '<em>Current</em>' : ''}</strong>
        <span>${esc(detail || 'No device details')}</span>
        <small>Last used ${esc(formatDate(session.lastUsed || session.createdAt))}</small>
      </div>
      <button type="button" data-action="revoke-session" data-id="${esc(session.id)}">Revoke</button>
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
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
