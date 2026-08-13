import { plans } from '../shared/data.js';

export function renderPricingSection() {
  const cards = plans
    .map((plan) => `
      <article class="price-card ${plan.recommended ? 'recommended' : ''}">
        ${plan.recommended ? '<div class="badge">Recommended</div>' : ''}
        <h3>${plan.name}</h3>
        <p>${plan.description}</p>
        <div class="price">${plan.price}${plan.suffix ? `<span>${plan.suffix}</span>` : ''}</div>
        <ul>${plan.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
        <a class="button ${plan.recommended ? 'primary' : 'secondary'}" href="${plan.href}">${plan.cta}</a>
      </article>
    `)
    .join('');

  return `
    <section class="section pricing" id="pricing">
      <div class="section-heading">
        <p class="eyebrow">Pricing</p>
        <h2>Plans for every stage.</h2>
      </div>
      <div class="pricing-grid">${cards}</div>
    </section>
  `;
}
