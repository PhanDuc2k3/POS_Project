import { esc } from '../utils/format.js';

export function renderAuditLogPage(state) {
  const activity = state.activity?.items || [];
  const sessions = state.sessions || [];
  const total = state.activity?.total || activity.length;

  return `
    <section class="audit-page">
      <header class="audit-heading">
        <div>
          <h1>Security Center</h1>
          <p>Manage active login sessions and review account security activity.</p>
        </div>
        <button type="button" class="audit-refresh-btn" data-action="refresh-audit-data"><i></i>Refresh</button>
      </header>

      <section class="audit-metrics">
        ${metricCard('Total Events', total)}
        ${metricCard('Active Sessions', sessions.length)}
        ${metricCard('Security Events', countSecurityEvents(activity))}
        ${metricCard('Latest Event', latestEventLabel(activity))}
      </section>

      <section class="session-management-card">
        <div class="security-section-head">
          <div>
            <h2>Session Management</h2>
            <p>Review trusted devices and revoke access when a session looks unfamiliar.</p>
          </div>
          <div class="security-section-actions">
            <span>${esc(sessions.length)} active</span>
            <button type="button" class="logout-all-btn" data-action="logout-all-devices">Logout All Devices</button>
          </div>
        </div>
        <div class="session-table">
          <div class="session-table-head">
            <span>Device</span>
            <span>Client</span>
            <span>Location</span>
            <span>Last Used</span>
            <span>Action</span>
          </div>
          ${sessions.map(renderSessionRow).join('') || '<div class="session-empty">No active sessions found</div>'}
        </div>
      </section>

      <section class="audit-table-card">
        <div class="security-section-head">
          <div>
            <h2>Activity Log</h2>
            <p>Recent login, profile, password, session and security events.</p>
          </div>
          <span>${esc(activity.length)} visible</span>
        </div>
        <div class="audit-table-head">
          <span>Action</span>
          <span>Details</span>
          <span>IP Address</span>
          <span>Created</span>
        </div>
        <div class="audit-table-body">
          ${activity.map(renderAuditRow).join('') || '<div class="audit-empty">No audit events found</div>'}
        </div>
      </section>
    </section>
  `;
}

function renderSessionRow(session) {
  const title = session.deviceName || session.browser || session.deviceType || 'Unknown device';
  const client = [session.clientType, session.browser, session.os].filter(Boolean).join(' / ');
  return `
    <article class="session-table-row">
      <span>
        <strong>${esc(title)} ${session.isCurrent ? '<em>Current</em>' : ''}</strong>
        <small>${esc(session.deviceId || session.screenResolution || 'No device id')}</small>
      </span>
      <span>${esc(client || '-')}</span>
      <span>${esc(session.ipAddress || '-')}</span>
      <span>${esc(formatDate(session.lastUsed || session.createdAt))}</span>
      <span>
        <button type="button" class="session-revoke-btn" data-action="revoke-session" data-id="${esc(session.id)}">Revoke</button>
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
      <span>${esc(item.details || 'No details')}</span>
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
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
