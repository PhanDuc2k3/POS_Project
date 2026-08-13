import { metrics } from '../shared/data.js';

export function renderMetricsSection() {
  return `
    <section class="section metrics" aria-label="Business outcomes">
      ${metrics.map((item) => `<div><strong>${item.value}</strong><span>${item.label}</span></div>`).join('')}
    </section>
  `;
}
