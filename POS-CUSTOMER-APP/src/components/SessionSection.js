import { esc, money } from '../shared/format.js';

export function renderSessionSection(state, active) {
  return `
    <aside class="panel">
      <div class="panel-head">
        <h2>Session & Cart</h2>
        <button class="btn soft" data-action="clear-cart">Clear</button>
      </div>
      <div class="panel-body">
        <div class="field-row">
          <label class="field">
            <span>Table</span>
            <input data-field="tableCode" value="${esc(state.tableCode)}" placeholder="B12" />
          </label>
          <label class="field">
            <span>Guests</span>
            <input data-field="guestCount" type="number" min="1" value="${esc(state.guestCount)}" />
          </label>
        </div>
        <label class="field">
          <span>Session note</span>
          <textarea data-field="sessionNote" placeholder="Smoke free, corner table">${esc(state.sessionNote)}</textarea>
        </label>
        <div class="section-footer">
          ${active ? `
            <div class="session-meta">
              <strong>${esc(active.tableCode || active.sessionCode)}</strong>
              <span class="badge open">${esc(active.status)}</span>
            </div>
            <div class="muted">${esc(active.sessionCode)} - ${active.orderCount || 0} orders</div>
          ` : '<div class="empty">No active session yet</div>'}
        </div>
        ${active && active.orders && active.orders.length ? `
          <div class="order-list" style="margin-top: 12px;">
            ${active.orders.map((order) => `
              <div class="order-item">
                <div class="session-meta">
                  <strong>${esc(order.orderNumber)}</strong>
                  <span class="badge ${esc(order.status)}">${esc(order.status)}</span>
                </div>
                <div class="muted">${money(order.finalTotal)} - ${esc(order.sourceApp || 'customer')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="cart-list" style="margin-top:12px;">
          ${state.cart.length === 0 ? '<div class="empty">Cart is empty</div>' : state.cart.map((item) => `
            <div class="cart-item">
              <div>
                <strong>${esc(item.name)}</strong>
                <div class="muted">${money(item.price)} x ${item.qty}</div>
              </div>
              <div class="cart-actions">
                <button type="button" data-action="dec-cart" data-id="${esc(item.id)}">-</button>
                <button type="button" data-action="inc-cart" data-id="${esc(item.id)}">+</button>
                <button type="button" data-action="remove-cart" data-id="${esc(item.id)}">x</button>
              </div>
            </div>
          `).join('')}
        </div>
        <label class="field" style="margin-top:12px;">
          <span>Order note</span>
          <textarea data-field="orderNote" placeholder="Less sugar, extra ice">${esc(state.orderNote)}</textarea>
        </label>
        <div class="cart-summary">
          <div class="line-row"><span>Total items</span><strong>${state.cart.reduce((sum, item) => sum + item.qty, 0)}</strong></div>
          <div class="line-row"><span>Amount</span><strong>${money(state.cart.reduce((sum, item) => sum + item.qty * item.price, 0))}</strong></div>
          <button class="btn" style="width:100%; margin-top:12px;" data-action="send-order">Send order</button>
        </div>
      </div>
    </aside>
  `;
}
