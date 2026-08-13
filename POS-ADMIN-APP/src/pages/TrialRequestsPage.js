import { esc } from '../utils/format.js';

export function renderTrialRequestsPage(state) {
  const requests = state.trialRequests || [];
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Trial requests</h2>
          <span class="muted">${pendingCount} pending approval</span>
        </div>
      </div>
      <div class="request-list">
        ${requests.map(renderRequest).join('') || '<div class="empty">No trial requests yet</div>'}
      </div>
    </section>
  `;
}

function renderRequest(request) {
  const accountBlock = request.status === 'approved'
    ? `
      <div class="request-account">
        <strong>Account ready to send</strong>
        <span>Portal: http://localhost:3000</span>
        <span>Username: ${esc(request.portalUsername || request.email)}</span>
        <span>Password: ${esc(request.portalPassword || 'Generated in backend')}</span>
      </div>
    `
    : '';

  const actions = request.status === 'pending'
    ? `
      <div class="row-actions">
        <button class="btn" data-action="approve-trial" data-id="${esc(request.id)}">Approve & create tenant</button>
        <button class="btn danger" data-action="reject-trial" data-id="${esc(request.id)}">Reject</button>
      </div>
    `
    : `<span class="muted">Reviewed by ${esc(request.reviewedBy || 'platform')}</span>`;

  return `
    <article class="request-card">
      <div class="request-main">
        <div>
          <strong>${esc(request.restaurantName)}</strong>
          <span>${esc(request.contactName)} · ${esc(request.email)}</span>
          <span>${esc(request.phone || 'No phone')} · ${esc(request.operatingMode)} · ${esc(request.packageTier)}</span>
        </div>
        <span class="badge ${esc(request.status)}">${esc(request.status)}</span>
      </div>
      ${request.message ? `<p>${esc(request.message)}</p>` : ''}
      ${accountBlock}
      ${actions}
    </article>
  `;
}
