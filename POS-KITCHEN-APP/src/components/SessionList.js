import { esc, money } from '../shared/format.js';

export function renderSessionList(state) {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Open sessions</h2>
        <button class="btn ghost" data-action="refresh-sessions">Refresh</button>
      </div>
      <div class="panel-body">
        ${state.loadingSessions ? '<div class="loading">Loading sessions...</div>' : ''}
        <div class="session-list">
          ${state.sessions.length === 0 ? '<div class="empty">No open sessions</div>' : state.sessions.map((item) => `
            <div class="session-item ${state.selectedSessionId === item.id ? 'active' : ''}">
              <div class="session-meta">
                <strong>${esc(item.tableCode || item.sessionCode)}</strong>
                <span class="badge open">${esc(item.status)}</span>
              </div>
              <div class="muted">${esc(item.sessionCode)}</div>
              <div class="muted">${item.orderCount || 0} orders - ${money(item.pendingAmount || 0)} pending</div>
              <button class="btn soft" data-action="pick-session" data-id="${esc(item.id)}">Open</button>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
