const metricMeta = {
  'Total Tenants': { icon: 'tenants', change: '+12% this month', tone: 'positive' },
  Tenants: { icon: 'tenants', change: '+12% this month', tone: 'positive' },
  'Active MRR': { icon: 'mrr', change: '+8.4% this month', tone: 'positive' },
  'Paid Orders': { icon: 'orders', change: '-2.1% this week', tone: 'negative' },
  'Pending Trials': { icon: 'trials', change: 'Stable', tone: 'neutral' },
};

export function renderMetricCard(label, value) {
  const meta = metricMeta[label] || {};
  const displayLabel = label === 'Tenants' ? 'Total Tenants' : label;

  return `
    <article class="metric-card">
      <div class="metric-card-top">
        <span>${displayLabel}</span>
        <i class="metric-icon ${meta.icon || 'default'}"></i>
      </div>
      <strong>${value}</strong>
      <small class="metric-change ${meta.tone || 'neutral'}">${meta.change || 'Stable'}</small>
    </article>
  `;
}
