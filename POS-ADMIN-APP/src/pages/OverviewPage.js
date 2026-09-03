import { renderMetricCard } from '../components/MetricCard.js';
import { esc, money } from '../utils/format.js';

const packageTones = ['green', 'blue', 'gold', 'red'];
const actionableOrderStatuses = new Set(['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT', 'PAID', 'APPROVED', 'PROVISIONING', 'PROVISIONING_FAILED', 'ON_HOLD']);
const actionableLeadStatuses = new Set(['NEW', 'CONTACTED']);
const mrrRangeOptions = [
  { value: '1d', label: '1 ngày', points: 24, unit: 'hour' },
  { value: '7d', label: '7 ngày', points: 7, unit: 'day' },
  { value: '30d', label: '1 tháng', points: 30, unit: 'day' },
  { value: '90d', label: '3 tháng', points: 13, unit: 'week' },
  { value: '180d', label: '6 tháng', points: 6, unit: 'month' },
  { value: '365d', label: '1 năm', points: 12, unit: 'month' },
];

Object.assign(mrrRangeOptions.find((item) => item.value === '1d'), { points: 12, unit: 'hour', step: 2 });

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
  const actions = normalizeOpenActions(summary.actionRequired) || buildActions({ orders, tenants, trialRequests, salesLeads });
  const recentOrders = normalizeRecentOrders(summary.recentOrders) || buildRecentOrders(orders, tenants);
  const health = normalizeTenantHealth(summary.tenantHealth) || buildTenantHealth(tenants);
  const mrrRange = normalizeMrrRange(state.mrrRange);
  const mrrTrend = normalizeMrrTrend(summary.mrrTrend, mrrRange) || buildMrrTrend(mrrRange);
  const mrrBars = buildMrrBars(mrrTrend, mrrRange);

  return `
    <section class="platform-overview">
      <div class="overview-heading">
        <h1>Tổng quan nền tảng</h1>
        <p>Theo dõi khách hàng, doanh thu, onboarding và vận hành nền tảng.</p>
      </div>

      <section class="metric-grid overview-metrics">
        ${renderMetricCard('Total Tenants', tenantCount.toLocaleString('vi-VN'))}
        ${renderMetricCard('Active MRR', money(activeMrr))}
        ${renderMetricCard('Paid Orders', paidOrders.toLocaleString('vi-VN'))}
        ${renderMetricCard('Pending Trials', pendingTrials.toLocaleString('vi-VN'))}
      </section>

      <div class="overview-dashboard-grid">
        <section class="panel overview-panel mrr-panel">
          <div class="panel-title-row mrr-title-row">
            <h2>Doanh thu theo thời gian</h2>
            <div class="mrr-range-tabs" role="tablist" aria-label="Chọn thời gian doanh thu">
              ${mrrRangeOptions.map((item) => `
                <button type="button" class="${item.value === mrrRange ? 'active' : ''}" data-action="set-mrr-range" data-range="${esc(item.value)}">${esc(item.label)}</button>
              `).join('')}
            </div>
          </div>
          ${renderMrrBarTrend(mrrBars, mrrRange)}
        </section>

        <aside class="panel overview-panel action-panel">
          <div class="action-panel-title">
            <span class="alert-dot"></span>
            <h2>Cần xử lý</h2>
          </div>
          <div class="action-list">
            ${actions.map((item) => `
              <button type="button" class="action-item ${esc(item.tone)}" data-action="open-overview-item" data-view="${esc(item.view)}" data-type="${esc(item.type)}" data-id="${esc(item.id)}">
                <strong>${esc(item.title)}</strong>
                <span>${esc(item.detail)}</span>
              </button>
            `).join('') || '<div class="empty">Hiện chưa có việc vận hành cần xử lý</div>'}
          </div>
        </aside>

        <section class="panel overview-panel subscription-panel">
          <h2>Phân bổ gói thuê bao</h2>
          ${renderSubscriptionChart(subscriptions)}
        </section>

        <section class="panel overview-panel recent-orders-panel">
          <div class="panel-title-row">
            <h2>Đơn đăng ký gần đây</h2>
            <button type="button" data-action="view" data-view="orders">Xem tất cả</button>
          </div>
          <div class="mini-table">
            <div class="mini-table-head">
              <span>Mã đơn</span>
              <span>Tenant</span>
              <span>Số tiền</span>
              <span>Trạng thái</span>
            </div>
            ${recentOrders.map((order) => `
              <div class="mini-table-row">
                <span>${esc(order.id)}</span>
                <span>${esc(order.tenant)}</span>
                <span>${esc(order.amount)}</span>
                <span class="status-pill ${esc(statusTone(order.status))}">${esc(statusLabel(order.status))}</span>
              </div>
            `).join('') || '<div class="empty">Chưa có đơn đăng ký gần đây</div>'}
          </div>
        </section>

        <section class="panel overview-panel health-panel">
          <h2>Sức khỏe tenant</h2>
          <div class="health-item active">
            <div><span>Đang hoạt động</span><strong>${health.active.toLocaleString('vi-VN')}</strong></div>
            <b><i style="width: ${health.activePct}%"></i></b>
          </div>
          <div class="health-item suspended">
            <div><span>Tạm ngưng</span><strong>${health.suspended.toLocaleString('vi-VN')}</strong></div>
            <b><i style="width: ${health.suspendedPct}%"></i></b>
          </div>
          <div class="tier-grid">
            <div><span>Gói Pro</span><strong>${health.pro.toLocaleString('vi-VN')}</strong></div>
            <div><span>Gói Plus</span><strong>${health.plus.toLocaleString('vi-VN')}</strong></div>
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
    label: item.label || item.tier || 'Không xác định',
    value: Number(item.value || 0),
    tone: packageTones[index % packageTones.length],
  }));
}

function normalizeOpenActions(items) {
  if (!Array.isArray(items)) return null;
  return items.map((item) => ({
    type: item.type || '',
    id: item.id || '',
    title: item.title || 'Cần xử lý',
    detail: item.detail || '',
    tone: item.tone || '',
    view: item.view === 'requests' ? 'orders' : item.view || 'overview',
    status: item.status || item.orderStatus || item.paymentStatus || '',
  })).filter(isActionOpen);
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

function normalizeMrrTrend(source, selectedRange) {
  const items = Array.isArray(source) ? source : source?.ranges?.[selectedRange];
  if (!Array.isArray(items) || !items.length) return null;
  return items.map((item, index) => ({
    label: item.label || item.month || item.at || String(index + 1),
    at: item.at || '',
    start: item.start || '',
    end: item.end || '',
    value: Number(item.value || 0),
  }));
}

function buildActions({ orders, tenants, trialRequests, salesLeads }) {
  const tenantById = new Map((tenants || []).map((tenant) => [String(tenant.id), tenant]));
  const actions = [];

  orders
    .filter((order) => actionableOrderStatuses.has(String(order.status || '').toUpperCase()))
    .forEach((order) => {
      const status = String(order.status || '').toUpperCase();
      const tenant = tenantById.get(String(order.tenantId));
      actions.push({
        type: 'order',
        id: order.id || order.orderCode || '',
        status,
        title: `${order.orderCode || order.id} - ${statusLabel(status)}`,
        detail: order.companyName || tenant?.name || order.customerName || 'Đơn thuê bao',
        tone: status === 'PROVISIONING_FAILED' ? 'danger' : '',
        view: 'orders',
      });
    });

  const pendingTrial = trialRequests.find((request) => String(request.status || '').toLowerCase() === 'pending');
  if (pendingTrial) {
    actions.push({
      type: 'trial',
      id: pendingTrial.id,
      status: pendingTrial.status || 'pending',
      title: `PLUS-Trial đang chờ - ${pendingTrial.id}`,
      detail: pendingTrial.restaurantName || pendingTrial.contactName || 'PLUS-Trial',
      tone: '',
      view: 'orders',
    });
  }

  salesLeads
    .filter((lead) => actionableLeadStatuses.has(String(lead.status || '').toUpperCase()))
    .forEach((newLead) => {
      actions.push({
        type: 'lead',
        id: newLead.id,
        status: newLead.status || 'NEW',
        title: `Lead bán hàng mới - ${newLead.id}`,
        detail: newLead.name || newLead.phone || 'Lead bán hàng',
        tone: '',
        view: 'orders',
      });
    });

  return actions.filter(isActionOpen);
}

function isActionOpen(item) {
  const type = String(item?.type || '').toLowerCase();
  const status = String(item?.status || '').toUpperCase();
  if (!status) return true;
  if (type === 'order') return actionableOrderStatuses.has(status);
  if (type === 'trial') return String(item.status || '').toLowerCase() === 'pending';
  if (type === 'lead') return actionableLeadStatuses.has(status);
  return !['ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED', 'LOST', 'QUALIFIED', 'DONE'].includes(status);
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

function buildMrrTrend(selectedRange) {
  const option = mrrRangeOptions.find((item) => item.value === selectedRange) || mrrRangeOptions[2];
  return Array.from({ length: option.points }, (_, index) => ({
    label: mrrBarLabel(index, option),
    value: 0,
  }));
}

function normalizeMrrRange(value) {
  const range = String(value || '30d');
  return mrrRangeOptions.some((item) => item.value === range) ? range : '30d';
}

function buildMrrBars(trend, selectedRange) {
  const option = mrrRangeOptions.find((item) => item.value === selectedRange) || mrrRangeOptions[2];
  const source = trend?.length ? trend : buildMrrTrend(selectedRange);
  return source.slice(-option.points).map((item, index) => ({
    label: item.label || mrrBarLabel(index, option),
    value: Math.max(0, Math.round(Number(item.value || 0))),
  }));
}

function mrrBarLabel(index, option) {
  if (option.unit === 'hour') {
    const step = Number(option.step || 1);
    return String(index * step);
  }
  if (option.unit === 'week') return `T${index + 1}`;
  if (option.unit === 'month') {
    const month = new Date();
    month.setMonth(month.getMonth() - (option.points - index - 1));
    return month.toLocaleDateString('vi-VN', { month: 'short' });
  }
  return option.points === 7 ? `Ngày ${index + 1}` : `${index + 1}`;
}

function rangeGrowthLabel(selectedRange) {
  const option = mrrRangeOptions.find((item) => item.value === selectedRange) || mrrRangeOptions[2];
  return option.label.toLowerCase();
}

function rangeUnitLabel(selectedRange) {
  const option = mrrRangeOptions.find((item) => item.value === selectedRange) || mrrRangeOptions[2];
  const labels = {
    hour: 'khung giờ',
    day: 'ngày',
    week: 'tuần',
    month: 'tháng',
  };
  return labels[option.unit] || 'mốc';
}

function renderMrrBarTrend(bars, selectedRange) {
  const values = bars.map((item) => Number(item.value || 0));
  const max = Math.max(...values, 1);
  const first = values[0] || 0;
  const last = values.at(-1) || 0;
  const periodTotal = values.reduce((sum, value) => sum + value, 0);
  const growth = first ? Math.round(((last - first) / first) * 100) : 0;
  const unitLabel = rangeUnitLabel(selectedRange);
  const wavePath = buildMrrWavePath(values, max);

  return `
    <div class="mrr-stage modern">
      <div class="modern-chart-head">
        <div>
          <span>Doanh thu phát sinh theo ${esc(unitLabel)}</span>
          <strong>${esc(money(periodTotal))} VND</strong>
          <small>Mỗi điểm là số tiền kiếm được trong từng ${esc(unitLabel)}</small>
        </div>
        <b>${growth >= 0 ? '+' : ''}${growth}% / ${esc(rangeGrowthLabel(selectedRange))}</b>
      </div>
      <div class="mrr-modern-body mrr-bar-body">
        <div class="mrr-axis">
          ${axisLabels(max).map((label) => `<span>${esc(label)}</span>`).join('')}
        </div>
        <div class="mrr-bar-chart" style="--bar-count: ${bars.length}">
          <svg class="mrr-wave-svg" viewBox="0 0 1000 156" preserveAspectRatio="none" aria-hidden="true">
            <path class="mrr-wave-glow" d="${esc(wavePath)}" />
            <path class="mrr-wave-line" d="${esc(wavePath)}" />
          </svg>
          ${bars.map((item, index) => {
            const percent = Math.max(4, Math.round((Number(item.value || 0) / max) * 100));
            const isLast = index === bars.length - 1;
            return `
              <div class="mrr-bar-item ${isLast ? 'current' : ''}">
                <b style="height: ${percent}%" title="${esc(item.label)}: ${esc(money(item.value))} VND"></b>
                <span>${esc(item.label)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="mrr-modern-footer">
        <span><i></i>Doanh thu từng ${esc(unitLabel)}</span>
        <span><i></i>Khoảng ${esc(rangeGrowthLabel(selectedRange))}</span>
        <strong>Điểm gần nhất: ${esc(money(last))} VND</strong>
      </div>
    </div>
  `;
}

function buildMrrWavePath(values, max) {
  const width = 1000;
  const height = 156;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - Math.max(0.04, Number(value || 0) / max) * height;
    return { x, y };
  });

  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const distance = (point.x - previous.x) * 0.5;
    return `${path} C ${(previous.x + distance).toFixed(2)} ${previous.y.toFixed(2)}, ${(point.x - distance).toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`);
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
          <span>Doanh thu định kỳ hàng tháng</span>
          <strong>${esc(money(activeMrr))} VND</strong>
          <small>Tính từ tenant đang hoạt động và gói đã gán</small>
        </div>
        <b>${growth >= 0 ? '+' : ''}${growth}% theo năm</b>
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
        <span><i></i>MRR ước tính</span>
        <span><i></i>Tốc độ hiện tại</span>
        <strong>Hiện tại: ${esc(money(activeMrr))} VND</strong>
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
          <strong>${total.toLocaleString('vi-VN')}</strong>
          <span>tenant</span>
        </div>
        <div>
          <span>Cơ cấu gói</span>
          <strong>${leading ? `${pct(leading.value, total)}% ${leading.label}` : 'Chưa có tenant'}</strong>
          <small>Phân bổ được tính từ gói tenant do API nền tảng trả về.</small>
        </div>
      </div>
      <div class="subscription-modern-list">
        ${subscriptions.map((item) => {
          const percent = pct(item.value, total);
          return `
            <div class="subscription-modern-item ${esc(item.tone)}">
              <div>
                <span>${esc(item.label)}</span>
                <strong>${item.value.toLocaleString('vi-VN')}</strong>
              </div>
              <b><i style="width: ${percent}%"></i></b>
              <small>${percent}% tenant</small>
            </div>
          `;
        }).join('') || '<div class="empty">Chưa có dữ liệu thuê bao</div>'}
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
  const status = String(value || 'PENDING').toUpperCase();
  const map = {
    PENDING: 'Đang chờ',
    CONTACTED: 'Đã liên hệ',
    QUOTED: 'Đã báo giá',
    WAITING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    APPROVED: 'Đã duyệt',
    ACTIVE: 'Đang hoạt động',
    COMPLETED: 'Hoàn tất',
    PROVISIONING_FAILED: 'Khởi tạo lỗi',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
    ON_HOLD: 'Tạm giữ',
  };
  return map[status] || status.replaceAll('_', ' ');
}

function statusTone(value) {
  const status = String(value || '').toUpperCase();
  if (['PAID', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(status)) return 'paid';
  if (['PROVISIONING_FAILED', 'REJECTED', 'CANCELLED'].includes(status)) return 'danger';
  if (['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT', 'ON_HOLD'].includes(status)) return 'pending';
  return 'pending';
}
