import { faqs, featureComparison, plans, storeSlotHighlights } from '../shared/data.js';
import { renderIcon } from '../shared/icons.js';

function renderMark(value) {
  return value
    ? `<span class="feature-yes">${renderIcon('check')}</span>`
    : `<span class="feature-no">${renderIcon('minus')}</span>`;
  return value ? '<span class="feature-yes">✓</span>' : '<span class="feature-no">—</span>';
}

export function renderPricingSection() {
  const cards = plans
    .map((plan) => `
      <article class="price-card ${plan.recommended ? 'recommended' : ''}">
        ${plan.recommended ? '<div class="badge">Phù hợp nhà hàng</div>' : ''}
        <h3>${plan.name}</h3>
        <p>${plan.description}</p>
        <div class="price">${plan.price}${plan.suffix ? `<span>${plan.suffix}</span>` : ''}</div>
        <p class="store-included">Bao gồm ${plan.includedStores} cửa hàng</p>
        <ul>${plan.features.map((feature) => `<li>${renderIcon('check', 'list-icon')}${feature}</li>`).join('')}</ul>
        <a class="button ${plan.recommended ? 'primary' : 'secondary'}" href="${plan.href}" data-action="select-package" data-package="${plan.packageCode || plan.name.toLowerCase()}">${plan.cta}</a>
      </article>
    `)
    .join('');

  const storeItems = storeSlotHighlights.map((item) => `<li>${renderIcon('circle-check', 'list-icon')}${item}</li>`).join('');
  const comparisonRows = featureComparison
    .map((row) => `
      <tr>
        <th>${row.feature}</th>
        <td>${renderMark(row.plus)}</td>
        <td>${renderMark(row.pro)}</td>
      </tr>
    `)
    .join('');
  const faqItems = faqs
    .map((item) => `
      <article class="faq-item">
        <h3>${item.question}</h3>
        <p>${item.answer}</p>
      </article>
    `)
    .join('');

  return `
    <section class="section pricing" id="pricing">
      <div class="section-heading">
        <p class="eyebrow">Pricing</p>
        <h2>Chọn PLUS hoặc PRO, sau đó mở rộng bằng Store Slot.</h2>
        <p>Không tách Single/Multi thành gói riêng. Package quyết định tính năng, số cửa hàng quyết định maxStores.</p>
      </div>
      <div class="pricing-grid">${cards}</div>
      <div class="store-slot-panel">
        <div>
          <p class="eyebrow">Store Slot</p>
          <h3>Bắt đầu với một cửa hàng. Mở rộng khi bạn cần.</h3>
        </div>
        <ul>${storeItems}</ul>
      </div>
      <div class="comparison-panel">
        <div class="section-heading center">
          <p class="eyebrow">PLUS vs PRO</p>
          <h2>Khách nhìn 5 giây là hiểu khác biệt.</h2>
        </div>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Tính năng</th>
              <th>PLUS</th>
              <th>PRO</th>
            </tr>
          </thead>
          <tbody>${comparisonRows}</tbody>
        </table>
      </div>
      <div class="faq-grid">${faqItems}</div>
    </section>
  `;
}
