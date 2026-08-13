export function renderHeroSection() {
  return `
    <section class="hero section">
      <div class="hero-copy">
        <p class="eyebrow">Restaurant OS for modern hospitality</p>
        <h1>Run your restaurant smarter, from counter to kitchen.</h1>
        <p class="hero-text">
          Precision POS unifies staff sales, QR ordering, kitchen display, payments, and management analytics in one
          operational platform built for busy restaurants.
        </p>
        <div class="hero-actions">
          <a class="button primary" href="#trial">Start free trial</a>
          <a class="button secondary" href="#demo">View product demo</a>
        </div>
        <div class="trust-row" aria-label="Platform highlights">
          <span><strong>14-day</strong> free trial</span>
          <span><strong>Realtime</strong> sync</span>
          <span><strong>Multi-role</strong> control</span>
        </div>
      </div>
      <div class="hero-visual" aria-label="Product interface preview">
        <img src="assets/home.png" alt="Precision POS marketing homepage preview" />
        <div class="floating-stat">
          <span>Today sales</span>
          <strong>$4,250</strong>
          <small>+12% vs yesterday</small>
        </div>
      </div>
    </section>
  `;
}
