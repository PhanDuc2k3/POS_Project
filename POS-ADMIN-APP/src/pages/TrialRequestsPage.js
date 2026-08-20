import { esc } from '../utils/format.js';

const fallbackRequests = [
  {
    id: 'TR-2041',
    restaurantName: 'Northstar Bistro',
    contactName: 'Amelia Chen',
    email: 'amelia@northstar.test',
    phone: '(555) 014-2219',
    packageTier: 'pro',
    operatingMode: 'restaurant',
    status: 'pending',
    message: 'Needs kitchen display and customer ordering for two locations.',
    createdAt: '2026-08-18T09:30:00Z',
  },
  {
    id: 'TR-2038',
    restaurantName: 'Urban Beans',
    contactName: 'Jon Bell',
    email: 'jon@urbanbeans.test',
    phone: '(555) 012-8870',
    packageTier: 'plus',
    operatingMode: 'simple',
    status: 'approved',
    portalUsername: 'trial_2038',
    portalPassword: 'Generated',
    reviewedBy: 'platform',
    createdAt: '2026-08-16T14:10:00Z',
  },
  {
    id: 'TR-2034',
    restaurantName: 'Deli Square',
    contactName: 'Priya Rao',
    email: 'priya@delisquare.test',
    phone: '(555) 018-1092',
    packageTier: 'trial',
    operatingMode: 'retail',
    status: 'rejected',
    reviewedBy: 'platform',
    message: 'Requested unsupported custom hardware during trial.',
    createdAt: '2026-08-14T11:05:00Z',
  },
];

const fallbackLeads = [
  { id: 'lead-1', name: 'Golden Spoon Group', phone: '(555) 012-4411', email: 'ops@goldenspoon.test', status: 'new', message: 'Interested in multi-branch deployment.', createdAt: '2026-08-19' },
  { id: 'lead-2', name: 'Market Lane', phone: '(555) 019-8820', email: 'hello@marketlane.test', status: 'contacted', message: 'Asked for pricing comparison.', createdAt: '2026-08-17' },
];

export function renderTrialRequestsPage(state) {
  const requests = state.trialRequests?.length ? state.trialRequests : fallbackRequests;
  const leads = state.salesLeads?.length ? state.salesLeads : fallbackLeads;
  const selected = requests.find((request) => String(request.id) === String(state.selectedTrialRequestId)) || null;
  const pendingCount = requests.filter((request) => statusOf(request) === 'pending').length;
  const approvedCount = requests.filter((request) => statusOf(request) === 'approved').length;
  const rejectedCount = requests.filter((request) => statusOf(request) === 'rejected').length;

  return `
    <section class="trial-page ${selected ? 'detail-open' : ''}">
      <header class="trial-heading">
        <div>
          <h1>Trial Requests</h1>
          <p>Review inbound trial applications and convert qualified businesses into tenants.</p>
        </div>
        <button type="button" class="trial-refresh-btn" data-action="refresh-data"><i></i>Refresh</button>
      </header>

      <section class="trial-metrics">
        ${metricCard('Pending Review', pendingCount || 18, '+6%', 'warning')}
        ${metricCard('Approved Trials', approvedCount || 42, '+12%', 'success')}
        ${metricCard('Rejected', rejectedCount || 7, '-3%', 'danger')}
        ${metricCard('Sales Leads', leads.length || 24, '+9%', 'neutral')}
      </section>

      <div class="trial-workspace">
        <section class="trial-table-card">
          <div class="trial-tabs">
            ${['All Requests', 'Pending', 'Approved', 'Rejected'].map((label, index) => `
              <button type="button" class="${index === 0 ? 'active' : ''}">${label}</button>
            `).join('')}
          </div>

          <div class="trial-toolbar">
            <label class="trial-search">
              <i></i>
              <input aria-label="Search trial requests" placeholder="Search restaurant, contact, email..." />
            </label>
            <div class="trial-filters">
              <button type="button">All Packages</button>
              <button type="button">All Modes</button>
              <button type="button">Newest First</button>
            </div>
          </div>

          <div class="trial-table">
            ${tableHeader(['Request', 'Contact', 'Package', 'Mode', 'Status', 'Submitted', 'Actions'])}
            ${requests.map((request) => renderRequestRow(request)).join('') || '<div class="empty">No trial requests yet</div>'}
          </div>
        </section>

        <aside class="sales-leads-panel">
          <div class="sales-leads-head">
            <h2>Sales Leads</h2>
            <span>${esc(leads.length)} contact requests</span>
          </div>
          <div class="sales-lead-list">
            ${leads.map(renderLeadCard).join('') || '<div class="empty">No sales leads yet</div>'}
          </div>
        </aside>
      </div>

      ${selected ? renderRequestDetail(selected) : ''}
    </section>
  `;
}

function renderRequestRow(request) {
  const status = statusOf(request);
  return `
    <div class="trial-table-row">
      <button type="button" class="trial-request-cell" data-action="select-trial-request" data-id="${esc(request.id)}">
        <span>${esc(initials(request.restaurantName))}</span>
        <strong>${esc(request.restaurantName || '-')}</strong>
        <small>${esc(request.id)}</small>
      </button>
      <span class="trial-contact">
        <strong>${esc(request.contactName || '-')}</strong>
        <small>${esc(request.email || '-')}</small>
      </span>
      <span><b class="trial-package ${esc(packageTone(request.packageTier))}">${esc(packageLabel(request.packageTier))}</b></span>
      <span class="trial-mode">${esc(modeLabel(request.operatingMode))}</span>
      <span><b class="trial-status ${esc(status)}">${esc(statusLabel(status))}</b></span>
      <span class="trial-date">${esc(formatDate(request.createdAt))}</span>
      <span class="trial-row-actions">
        <button type="button" data-action="select-trial-request" data-id="${esc(request.id)}" aria-label="Open request detail"></button>
      </span>
    </div>
  `;
}

function renderRequestDetail(request) {
  const pending = statusOf(request) === 'pending';
  return `
    <div class="trial-detail-backdrop" data-action="close-trial-request"></div>
    <aside class="trial-detail-drawer" role="dialog" aria-modal="true" aria-label="Trial request detail">
      <header class="trial-detail-head">
        <div>
          <h2>${esc(request.restaurantName || 'Trial Request')}</h2>
          <p>${esc(request.id)} · Submitted ${esc(formatDate(request.createdAt))}</p>
        </div>
        <b class="trial-status ${esc(statusOf(request))}">${esc(statusLabel(statusOf(request)))}</b>
        <button type="button" data-action="close-trial-request" aria-label="Close trial request"></button>
      </header>

      <section class="trial-contact-card">
        <span>${esc(initials(request.contactName || request.restaurantName))}</span>
        <div>
          <strong>${esc(request.contactName || '-')}</strong>
          <small>${esc(request.email || '-')}</small>
          <small>${esc(request.phone || 'No phone')}</small>
        </div>
      </section>

      <section class="trial-info-box">
        <h3>Request Details</h3>
        ${infoRow('Business', request.restaurantName)}
        ${infoRow('Package', packageLabel(request.packageTier))}
        ${infoRow('Operating Mode', modeLabel(request.operatingMode))}
        ${infoRow('Message', request.message || 'No message provided')}
      </section>

      ${statusOf(request) === 'approved' ? accountBlock(request) : ''}

      <section class="trial-review-timeline">
        <h3>Review Timeline</h3>
        ${timelineItem('Request Received', request.createdAt, 'Website trial form', 'done')}
        ${timelineItem('Qualification Review', pending ? '' : request.reviewedAt, pending ? 'Waiting for platform admin' : `Reviewed by ${request.reviewedBy || 'platform'}`, pending ? 'current' : 'done')}
        ${timelineItem('Tenant Provisioning', request.portalUsername ? request.reviewedAt : '', request.portalUsername ? 'Portal credentials generated' : 'Pending approval', request.portalUsername ? 'done' : '')}
      </section>

      <div class="trial-detail-actions">
        ${pending ? `
          <button type="button" class="trial-secondary-btn" data-action="reject-trial" data-id="${esc(request.id)}">Reject</button>
          <button type="button" class="trial-primary-btn" data-action="approve-trial" data-id="${esc(request.id)}">Approve & Create Tenant</button>
        ` : '<button type="button" class="trial-primary-btn" data-action="close-trial-request">Done</button>'}
      </div>
    </aside>
  `;
}

function renderLeadCard(lead) {
  return `
    <article class="sales-lead-card">
      <div>
        <strong>${esc(lead.name || '-')}</strong>
        <span>${esc(lead.phone || 'No phone')} · ${esc(lead.email || 'No email')}</span>
      </div>
      <b>${esc(statusLabel(statusOf(lead)))}</b>
      ${lead.message ? `<p>${esc(lead.message)}</p>` : ''}
      <small>${esc(formatDate(lead.createdAt))}</small>
    </article>
  `;
}

function accountBlock(request) {
  return `
    <section class="trial-account-ready">
      <h3>Account Ready</h3>
      ${infoRow('Portal', 'http://localhost:3000')}
      ${infoRow('Username', request.portalUsername || request.email)}
      ${infoRow('Password', request.portalPassword || 'Generated in backend')}
    </section>
  `;
}

function metricCard(label, value, change, tone) {
  return `
    <article class="trial-metric ${tone}">
      <span>${esc(label)}</span>
      <strong>${Number(value || 0).toLocaleString('en-US')}</strong>
      <small>${esc(change)}</small>
    </article>
  `;
}

function tableHeader(items) {
  return `<div class="trial-table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}

function infoRow(label, value) {
  return `
    <div class="trial-info-row">
      <span>${esc(label)}</span>
      <strong>${esc(value || '-')}</strong>
    </div>
  `;
}

function timelineItem(label, date, detail, tone = '') {
  return `
    <div class="trial-timeline-item ${esc(tone)}">
      <strong>${esc(label)}</strong>
      <span>${date ? `${esc(formatDate(date))} · ` : ''}${esc(detail || 'Pending')}</span>
    </div>
  `;
}

function statusOf(item) {
  return String(item.status || 'pending').toLowerCase();
}

function statusLabel(value) {
  const map = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', new: 'New', contacted: 'Contacted' };
  return map[value] || value;
}

function packageLabel(value) {
  const map = { pro: 'PRO', plus: 'PLUS', trial: 'TRIAL', starter: 'STARTER' };
  return map[String(value || '').toLowerCase()] || String(value || '-').toUpperCase();
}

function packageTone(value) {
  const tier = String(value || '').toLowerCase();
  if (tier === 'pro') return 'pro';
  if (tier === 'plus') return 'plus';
  return 'trial';
}

function modeLabel(value) {
  const mode = String(value || '').toLowerCase();
  if (mode === 'restaurant') return 'Restaurant';
  if (mode === 'retail') return 'Retail';
  return mode ? mode[0].toUpperCase() + mode.slice(1) : '-';
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'TR';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
