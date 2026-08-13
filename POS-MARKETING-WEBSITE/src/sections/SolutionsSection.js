import { solutions } from '../shared/data.js';

export function renderSolutionsSection() {
  const items = solutions
    .map((item) => `<div><strong>${item.title}</strong><span>${item.text}</span></div>`)
    .join('');

  return `
    <section class="section split" id="solutions">
      <div>
        <p class="eyebrow">Solutions</p>
        <h2>Choose the operating model that fits your venue.</h2>
        <p>
          From small counter-service stores to full-service restaurants and multi-branch chains, Precision POS keeps
          the same clean control surface while enabling more advanced workflows as you grow.
        </p>
        <div class="solution-list">${items}</div>
      </div>
      <img class="panel-image" src="assets/solutions.png" alt="Solutions page preview" />
    </section>
  `;
}
