import { renderMetricCard } from '../components/MetricCard.js';
import { esc, money } from '../utils/format.js';

const packageTones = ['green', 'blue', 'gold', 'red'];

export function renderOverviewPage(state) {
  const summary = state.summary || {};
  const tenants = state.tenants || [];
  const orders = state.orders || [];
  const trialRequests = state.trialRequests || [];
  const salesLeads = state.salesLeads || [];
  const tenantCount = Number(summary.tenants ?? tenants.length ?? 0);
  const activeMrr = Number(summary.activeMrr || 0);
  const paidOrders = Number(summary.paidOrders ?? countPaidOrders(orders));
  const pendingTrials = Number(summary.pendingTrials ?? countPendingTrials(trialRequests));
  const subscriptions = normalizeDistribution(summary.packageDistribution) || buildSubscriptionDistribution(tenants, state.packages || []);
  const actions = normalizeActions(summary.actionRequired) || buildActions({ orders, tenants, trialRequests, salesLeads });
  const recentOrders = normalizeRecentOrders(summary.recentOrders) || buildRecentOrders(orders, tenants);
  const health = normalizeTenantHealth(summary.tenantHealth) || buildTenantHealth(tenants);
  const mrrTrend = normalizeMrrTrend(summary.mrrTrend) || buildMrrTrend(activeMrr);
  const mrrPoints = mrrTrend.map((item) => item.value);
  const mrrMonths = mrrTrend.map((item) => item.month);

  return `
    <section class="platform-overview">
      <div class="overview-heading">
        <h1>Platform Overview</h1>
        <p>Monitor customers, revenue, onboarding and platform operations.</p>
      </div>

      <section class="metric-grid overview-metrics">
        ${renderMetricCard('Total Tenants', tenantCount.toLocaleString('en-US'))}
        ${renderMetricCard('Active MRR', money(activeMrr))}
        ${renderMetricCard('Paid Orders', paidOrders.toLocaleString('en-US'))}
        ${renderMetricCard('Pending Trials', pendingTrials.toLocaleString('en-US'))}
      </section>

      <div class="overview-dashboard-grid">
        <section class="panel overview-panel mrr-panel">
          <h2>MRR Trend</h2>
          ${renderMrrTrend(mrrPoints, mrrMonths, activeMrr)}
        </section>

        <aside class="panel overview-panel action-panel">
          <div class="action-panel-title">
            <span class="alert-dot"></span>
            <h2>Action Required</h2>
          </div>
          <div class="action-list">
            ${actions.map((item) => `
              <button type="button" class="action-item ${esc(item.tone)}" data-action="open-overview-item" data-view="${esc(item.view)}" data-type="${esc(item.type)}" data-id="${esc(item.id)}">
                <strong>${esc(item.title)}</strong>
                <span>${esc(item.detail)}</span>
              </button>
            `).join('') || '<div class="empty">No operational actions right now</div>'}
          </div>
        </aside>

        <section class="panel overview-panel subscription-panel">
          <h2>Subscription Distribution</h2>
          ${renderSubscriptionChart(subscriptions)}
        </section>

        <section class="panel overview-panel recent-orders-panel">
          <div class="panel-title-row">
            <h2>Recent Orders</h2>
            <button type="button" data-action="view" data-view="orders">View All</button>
          </div>
          <div class="mini-table">
            <div class="mini-table-head">
              <span>Order ID</span>
              <span>Tenant</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            ${recentOrders.map((order) => `
              <div class="mini-table-row">
                <span>${esc(order.id)}</span>
                <span>${esc(order.tenant)}</span>
                <span>${esc(order.amount)}</span>
                <span class="status-pill ${esc(statusTone(order.status))}">${esc(statusLabel(order.status))}</span>
              </div>
            `).join('') || '<div class="empty">No recent orders yet</div>'}
          </div>
        </section>

        <section class="panel overview-panel health-panel">
          <h2>Tenant Health Summary</h2>
          <div class="health-item active">
            <div><span>Active</span><strong>${health.active.toLocaleString('en-US')}</strong></div>
            <b><i style="width: ${health.activePct}%"></i></b>
          </div>
          <div class="health-item suspended">
            <div><span>Suspended</span><strong>${health.suspended.toLocaleString('en-US')}</strong></div>
            <b><i style="width: ${health.suspendedPct}%"></i></b>
          </div>
          <div class="tier-grid">
            <div><span>Pro Tier</span><strong>${health.pro.toLocaleString('en-US')}</strong></div>
            <div><span>Plus Tier</span><strong>${health.plus.toLocaleString('en-US')}</strong></div>
          </div>
        </section>
      </div>
    </section>
  `;
}

function countPaidOrders(orders) {
  return orders.filter((order) => ['PAID', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(String(order.paymentStatus || order.status || '').toUpperCase())).length;
}

function countPendingTrials(trialRequests) {
  return trialRequests.filter((request) => String(request.status || '').toLowerCase() === 'pending').length;
}

function buildSubscriptionDistribution(tenants, packages) {
  const labels = Object.fromEntries((packages || []).map((pkg) => [pkg.id, pkg.name || pkg.id]));
  const counts = tenants.reduce((items, tenant) => {
    const tier = tenant.packageTier || 'unknown';
    items[tier] = (items[tier] || 0) + 1;
    return items;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .map(([tier, value], index) => ({
      tier,
      label: labels[tier] || tier,
      value,
      tone: packageTones[index % packageTones.length],
    }));
}

function normalizeDistribution(items) {
  if (!Array.isArray(items)) return null;
  return items.map((item, index) => ({
    tier: item.tier || 'unknown',
    label: item.label || item.tier || 'Unknown',
    value: Number(item.value || 0),
    tone: packageTones[index % packageTones.length],
  }));
}

function normalizeActions(items) {
  if (!Array.isArray(items)) return null;
  return items.map((item) => ({
    type: item.type || '',
    id: item.id || '',
    title: item.title || 'Action required',
    detail: item.detail || '',
    tone: item.tone || '',
    view: item.view || 'overview',
  }));
}

function normalizeRecentOrders(items) {
  if (!Array.isArray(items)) return null;
  return items.map((order) => ({
    id: order.orderCode || order.id || '-',
    tenant: order.tenantName || order.companyName || order.customerName || '-',
    amount: `${money(order.amount)} VND`,
    status: order.status || 'PENDING',
  }));
}

function normalizeTenantHealth(value) {
  if (!value || typeof value !== 'object') return null;
  const total = Number(value.total || 0);
  const tiers = value.tiers || {};
  return {
    active: Number(value.active || 0),
    suspended: Number(value.suspended || 0),
    pro: Number(tiers.pro || 0),
    plus: Number(tiers.plus || 0),
    activePct: pct(value.active, total),
    suspendedPct: pct(value.suspended, total),
  };
}

function normalizeMrrTrend(items) {
  if (!Array.isArray(items) || !items.length) return null;
  return items.map((item, index) => ({
    month: item.month || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index] || '',
    value: Number(item.value || 0),
  }));
}

function buildActions({ orders, tenants, trialRequests, salesLeads }) {
  const tenantById = new Map((tenants || []).map((tenant) => [String(tenant.id), tenant]));
  const actions = [];

  orders
    .filter((order) => ['WAITING_PAYMENT', 'PAID', 'PROVISIONING_FAILED', 'ON_HOLD'].includes(String(order.status || '').toUpperCase()))
    .slice(0, 3)
    .forEach((order) => {
      const status = String(order.status || '').toUpperCase();
      const tenant = tenantById.get(String(order.tenantId));
      actions.push({
        title: `${order.orderCode || order.id} - ${statusLabel(status)}`,
        detail: order.companyName || tenant?.name || order.customerName || 'Subscription order',
        tone: status === 'PROVISIONING_FAILED' ? 'danger' : '',
        view: 'orders',
      });
    });

  const pendingTrial = trialRequests.find((request) => String(request.status || '').toLowerCase() === 'pending');
  if (pendingTrial) {
    actions.push({
      title: `Pending Trial Request - ${pendingTrial.id}`,
      detail: pendingTrial.restaurantName || pendingTrial.contactName || 'Trial request',
      tone: '',
      view: 'requests',
    });
  }

  const newLead = salesLeads.find((lead) => String(lead.status || '').toUpperCase() === 'NEW');
  if (newLead) {
    actions.push({
      title: `New Sales Lead - ${newLead.id}`,
      detail: newLead.name || newLead.phone || 'Sales lead',
      tone: '',
      view: 'requests',
    });
  }

  return actions.slice(0, 5);
}

function buildRecentOrders(orders, tenants) {
  const tenantById = new Map((tenants || []).map((tenant) => [String(tenant.id), tenant]));
  return [...orders]
    .sort((left, right) => (new Date(right.createdAt).getTime() || 0) - (new Date(left.createdAt).getTime() || 0))
    .slice(0, 4)
    .map((order) => {
      const tenant = tenantById.get(String(order.tenantId));
      return {
        id: order.orderCode || order.id || '-',
        tenant: order.companyName || tenant?.name || order.customerName || '-',
        amount: `${money(order.amount)} VND`,
        status: order.status || 'PENDING',
      };
    });
}

function buildTenantHealth(tenants) {
  const total = tenants.length || 0;
  const active = tenants.filter((tenant) => String(tenant.status || '').toLowerCase() === 'active').length;
  const suspended = tenants.filter((tenant) => String(tenant.status || '').toLowerCase() === 'suspended').length;
  return {
    active,
    suspended,
    pro: tenants.filter((tenant) => String(tenant.packageTier || '').toLowerCase() === 'pro').length,
    plus: tenants.filter((tenant) => String(tenant.packageTier || '').toLowerCase() === 'plus').length,
    activePct: pct(active, total),
    suspendedPct: pct(suspended, total),
  };
}

function buildMrrPoints(activeMrr) {
  const current = Number(activeMrr || 0);
  if (!current) return Array.from({ length: 12 }, () => 0);
  return Array.from({ length: 12 }, (_, index) => Math.round(current * (0.72 + index * 0.028)));
}

function renderMrrTrend(mrrPoints, months, activeMrr) {
  const min = Math.min(...mrrPoints);
  const max = Math.max(...mrrPoints);
  const range = max - min || 1;
  const chartWidth = 1000;
  const chartHeight = 220;
  const chartTop = 24;
  const chartBottom = 34;
  const plotHeight = chartHeight - chartTop - chartBottom;
  const points = mrrPoints.map((value, index) => {
    const x = (index / (mrrPoints.length - 1)) * chartWidth;
    const y = chartTop + (1 - ((value - min) / range)) * plotHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const lastY = chartTop + (1 - ((mrrPoints.at(-1) - min) / range)) * plotHeight;
  const area = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;
  const first = mrrPoints[0] || 0;
  const last = mrrPoints.at(-1) || 0;
  const growth = first ? Math.round(((last - first) / first) * 100) : 0;

  return `
    <div class="mrr-stage modern">
      <div class="modern-chart-head">
        <div>
          <span>Monthly Recurring Revenue</span>
          <strong>${esc(money(activeMrr))} VND</strong>
          <small>Calculated from active tenants and assigned packages</small>
        </div>
        <b>${growth >= 0 ? '+' : ''}${growth}% YoY</b>
      </div>
      <div class="mrr-modern-body">
        <div class="mrr-axis">
          ${axisLabels(max).map((label) => `<span>${esc(label)}</span>`).join('')}
        </div>
        <svg class="mrr-modern-svg" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="mrr-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.34" />
              <stop offset="100%" stop-color="#4f46e5" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g class="grid-lines">
            <line x1="0" y1="34" x2="${chartWidth}" y2="34" />
            <line x1="0" y1="78" x2="${chartWidth}" y2="78" />
            <line x1="0" y1="122" x2="${chartWidth}" y2="122" />
            <line x1="0" y1="166" x2="${chartWidth}" y2="166" />
          </g>
          <polygon points="${area}" fill="url(#mrr-gradient)" />
          <polyline points="${points}" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
          <polyline points="${points}" fill="none" stroke="#a5b4fc" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".16" vector-effect="non-scaling-stroke" />
          <circle cx="${chartWidth}" cy="${lastY.toFixed(2)}" r="2.8" fill="#4f46e5" vector-effect="non-scaling-stroke" />
        </svg>
      </div>
      <div class="chart-months modern-months">
          ${months.map((month) => `<span>${esc(month)}</span>`).join('')}
      </div>
      <div class="mrr-modern-footer">
        <span><i></i>Derived MRR</span>
        <span><i></i>Current run rate</span>
        <strong>Current: ${esc(money(activeMrr))} VND</strong>
      </div>
    </div>
  `;
}

function renderSubscriptionChart(subscriptions) {
  const total = subscriptions.reduce((sum, item) => sum + item.value, 0);
  const leading = subscriptions[0];

  return `
    <div class="subscription-stage modern">
      <div class="subscription-summary">
        <div class="subscription-ring" aria-hidden="true">
          <strong>${total.toLocaleString('en-US')}</strong>
          <span>tenants</span>
        </div>
        <div>
          <span>Package Mix</span>
          <strong>${leading ? `${pct(leading.value, total)}% ${leading.label}` : 'No tenants'}</strong>
          <small>Distribution is calculated from the tenant package tier returned by the platform API.</small>
        </div>
      </div>
      <div class="subscription-modern-list">
        ${subscriptions.map((item) => {
          const percent = pct(item.value, total);
          return `
            <div class="subscription-modern-item ${esc(item.tone)}">
              <div>
                <span>${esc(item.label)}</span>
                <strong>${item.value.toLocaleString('en-US')}</strong>
              </div>
              <b><i style="width: ${percent}%"></i></b>
              <small>${percent}% of tenants</small>
            </div>
          `;
        }).join('') || '<div class="empty">No subscription data yet</div>'}
      </div>
      <div class="subscription-modern-cards">
        ${subscriptions.slice(0, 3).map((item) => `
          <article class="${esc(item.tone)}">
            <span>${esc(item.label)}</span>
            <strong>${pct(item.value, total)}%</strong>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function axisLabels(max) {
  const top = Math.max(Number(max || 0), 1);
  return [top, top * 0.75, top * 0.5, top * 0.25].map((value) => money(Math.round(value)));
}

function pct(value, total) {
  return total ? Math.round((Number(value || 0) / total) * 100) : 0;
}

function statusLabel(value) {
  return String(value || 'PENDING').replaceAll('_', ' ');
}

function statusTone(value) {
  const status = String(value || '').toUpperCase();
  if (['PAID', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(status)) return 'paid';
  if (['PROVISIONING_FAILED', 'REJECTED', 'CANCELLED'].includes(status)) return 'danger';
  if (['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT', 'ON_HOLD'].includes(status)) return 'pending';
  return 'pending';
}
