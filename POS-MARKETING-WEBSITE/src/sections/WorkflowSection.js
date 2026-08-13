import { workflowSteps } from '../shared/data.js';

export function renderWorkflowSection() {
  const steps = workflowSteps
    .map((item, index) => `
      <article>
        <span>${index + 1}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>
    `)
    .join('');

  return `
    <section class="section workflow" id="workflow">
      <div class="section-heading">
        <p class="eyebrow">How it works</p>
        <h2>One order, synchronized everywhere.</h2>
      </div>
      <div class="steps">${steps}</div>
    </section>
  `;
}
