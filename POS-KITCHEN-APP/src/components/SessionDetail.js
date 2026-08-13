import { esc, money } from '../shared/format.js';

export function renderSessionDetail(session) {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Session detail</h2>
      </div>
      <div class="panel-body">
        ${session ? `
          <div class="session-meta" style="margin-bottom: 10px;">
            <strong>${esc(session.tableCode || session.sessionCode)}</strong>
            <span class="badge open">${esc(session.status)}</span>
          </div>
          <div class="muted" style="margin-bottom: 14px;">Guests ${esc(session.guestCount || 1)} - ${esc(session.sessionCode)}</div>
          <div class="order-list">
            ${(session.orders || []).length === 0 ? '<div class="empty">No orders yet</div>' : (session.orders || []).map((order) => `
              <div class="order-item">
                <div class="session-meta">
                  <strong>${esc(order.orderNumber)}</strong>
                  <span class="badge ${esc(order.status)}">${esc(order.status)}</span>
                </div>
                <div class="muted">${money(order.finalTotal)} - ${esc(order.sourceApp || 'pos')}</div>
              </div>
            `).join('')}
          </div>
          <div class="section-footer">
            <div class="line-row"><span>Orders</span><strong>${session.orderCount || 0}</strong></div>
            <div class="line-row"><span>Total</span><strong>${money(session.totalAmount || 0)}</strong></div>
            <div class="line-row"><span>Pending</span><strong>${money(session.pendingAmount || 0)}</strong></div>
          </div>
        ` : '<div class="empty">Pick a session from the left</div>'}
      </div>
    </section>
  `;
}
