import { features } from '../shared/data.js';

export function renderFeaturesSection() {
  const cards = features
    .map((item) => `
      <article class="feature-card ${item.tone || ''}">
        <span class="icon">${item.number}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>
    `)
    .join('');

  return `
    <section class="section" id="features">
      <div class="section-heading">
        <p class="eyebrow">Core features</p>
        <h2>Every workflow your restaurant needs.</h2>
        <p>Built from the Stitch design reference into a complete web experience for the POS platform.</p>
      </div>
      <div class="feature-grid">
        <article class="feature-card large">
          <div>
            <span class="icon">01</span>
            <h3>Lightning-fast Staff POS</h3>
            <p>Touch-friendly order entry, modifiers, payment status, and receipt printing for high-volume service.</p>
          </div>
          <img src="assets/features.png" alt="Feature page preview showing POS interface" />
        </article>
        ${cards}
      </div>
    </section>
  `;
}
