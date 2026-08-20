import { renderMetricCard } from '../components/MetricCard.js';
import { money } from '../utils/format.js';

const mrrPoints = [22, 24, 30, 36, 42, 47, 54, 61, 69, 77, 88, 112];
const subscriptions = [
  ['Basic', 2850, 'green'],
  ['Standard', 350, 'red'],
  ['Pro', 1780, 'blue'],
  ['Plus', 920, 'gold'],
];

const actions = [
  ['Order #4092 - Payment Wait', 'Global Retail Inc.', ''],
  ['Approval Needed - Provisioning', 'Cafe Metro', ''],
  ['Failed Provisioning', 'Boutique X (ID: 991)', 'danger'],
  ['Pending Trial Request', 'TechStore NYC', ''],
  ['Order #4088 - Approval Wait', 'Salon Chic', ''],
];

const recentOrders = [
  ['#4093', 'Burger King Loc 12', '$120.00', 'Paid'],
  ['#4092', 'Global Retail Inc.', '$450.00', 'Pending'],
  ['#4091', 'Coffee Shop 9', '$80.00', 'Paid'],
  ['#4090', 'Spa Retreat', '$210.00', 'Paid'],
];

export function renderOverviewPage(state) {
  const summary = state.summary || {};
  const tenantCount = summary.tenants || 1248;
  const activeMrr = summary.activeMrr ? money(summary.activeMrr) : '$84,200';
  const paidOrders = summary.paidOrders || 342;
  const pendingTrials = summary.pendingTrials || 18;

  return `
    <section class="platform-overview">
      <div class="overview-heading">
        <h1>Platform Overview</h1>
        <p>Monitor customers, revenue, onboarding and platform operations.</p>
      </div>

      <section class="metric-grid overview-metrics">
        ${renderMetricCard('Total Tenants', tenantCount.toLocaleString('en-US'))}
        ${renderMetricCard('Active MRR', activeMrr)}
        ${renderMetricCard('Paid Orders', paidOrders.toLocaleString('en-US'))}
        ${renderMetricCard('Pending Trials', pendingTrials.toLocaleString('en-US'))}
      </section>

      <div class="overview-dashboard-grid">
        <section class="panel overview-panel mrr-panel">
          <h2>MRR Trend</h2>
          ${renderMrrTrend()}
        </section>

        <aside class="panel overview-panel action-panel">
          <div class="action-panel-title">
            <span class="alert-dot"></span>
            <h2>Action Required</h2>
          </div>
          <div class="action-list">
            ${actions.map(([title, detail, tone]) => `
              <div class="action-item ${tone}">
                <strong>${title}</strong>
                <span>${detail}</span>
              </div>
            `).join('')}
          </div>
        </aside>

        <section class="panel overview-panel subscription-panel">
          <h2>Subscription Distribution</h2>
          ${renderSubscriptionChart()}
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
            ${recentOrders.map(([id, tenant, amount, status]) => `
              <div class="mini-table-row">
                <span>${id}</span>
                <span>${tenant}</span>
                <span>${amount}</span>
                <span class="status-pill ${status.toLowerCase()}">${status}</span>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="panel overview-panel health-panel">
          <h2>Tenant Health Summary</h2>
          <div class="health-item active">
            <div><span>Active</span><strong>1,180</strong></div>
            <b><i style="width: 96%"></i></b>
          </div>
          <div class="health-item suspended">
            <div><span>Suspended</span><strong>24</strong></div>
            <b><i style="width: 9%"></i></b>
          </div>
          <div class="tier-grid">
            <div><span>Pro Tier</span><strong>450</strong></div>
            <div><span>Plus Tier</span><strong>730</strong></div>
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderMrrTrend() {
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
  const growth = Math.round(((mrrPoints.at(-1) - mrrPoints[0]) / mrrPoints[0]) * 100);

  return `
    <div class="mrr-stage modern">
      <div class="modern-chart-head">
        <div>
          <span>Monthly Recurring Revenue</span>
          <strong>$2.4M</strong>
          <small>Net expansion across active tenants</small>
        </div>
        <b>+${growth}% YoY</b>
      </div>
      <div class="mrr-modern-body">
        <div class="mrr-axis">
          <span>$2.4M</span>
          <span>$1.8M</span>
          <span>$1.2M</span>
          <span>$0.6M</span>
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
          ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => `<span>${m}</span>`).join('')}
      </div>
      <div class="mrr-modern-footer">
        <span><i></i>Expansion MRR</span>
        <span><i></i>Forecast</span>
        <strong>Dec peak: $2.4M</strong>
      </div>
    </div>
  `;
}

function renderSubscriptionChart() {
  const total = subscriptions.reduce((sum, [, value]) => sum + value, 0);

  return `
    <div class="subscription-stage modern">
      <div class="subscription-summary">
        <div class="subscription-ring" aria-hidden="true">
          <strong>${total.toLocaleString('en-US')}</strong>
          <span>tenants</span>
        </div>
        <div>
          <span>Package Mix</span>
          <strong>${Math.round((subscriptions.find(([tier]) => tier === 'Basic')?.[1] || 0) / total * 100)}% Basic</strong>
          <small>Pro and Plus continue to expand among multi-location operators.</small>
        </div>
      </div>
      <div class="subscription-modern-list">
        ${subscriptions.map(([tier, value, tone]) => {
          const pct = Math.round((value / total) * 100);
          return `
            <div class="subscription-modern-item ${tone}">
              <div>
                <span>${tier}</span>
                <strong>${value.toLocaleString('en-US')}</strong>
              </div>
              <b><i style="width: ${pct}%"></i></b>
              <small>${pct}% of tenants</small>
            </div>
          `;
        }).join('')}
      </div>
      <div class="subscription-modern-cards">
        ${subscriptions.slice(0, 3).map(([tier, value, tone]) => `
          <article class="${tone}">
            <span>${tier}</span>
            <strong>${Math.round((value / total) * 100)}%</strong>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}
