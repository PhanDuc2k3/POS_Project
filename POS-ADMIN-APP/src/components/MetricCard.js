const metricMeta = {
  'Total Tenants': { icon: 'tenants', change: '+12% tháng này', tone: 'positive' },
  Tenants: { icon: 'tenants', change: '+12% tháng này', tone: 'positive' },
  'Active MRR': { icon: 'mrr', change: '+8,4% tháng này', tone: 'positive' },
  'Paid Orders': { icon: 'orders', change: '-2,1% tuần này', tone: 'negative' },
  'Pending Trials': { icon: 'trials', change: 'Ổn định', tone: 'neutral' },
};

const metricLabels = {
  'Total Tenants': 'Tổng tenant',
  Tenants: 'Tổng tenant',
  'Active MRR': 'MRR đang hoạt động',
  'Paid Orders': 'Đơn đăng ký đã thanh toán',
  'Pending Trials': 'PLUS-Trial đang chờ',
};

export function renderMetricCard(label, value) {
  const meta = metricMeta[label] || {};
  const displayLabel = metricLabels[label] || label;

  return `
    <article class="metric-card">
      <div class="metric-card-top">
        <span>${displayLabel}</span>
        <i class="metric-icon ${meta.icon || 'default'}"></i>
      </div>
      <strong>${value}</strong>
      <small class="metric-change ${meta.tone || 'neutral'}">${meta.change || 'Ổn định'}</small>
    </article>
  `;
}
