export function renderDemoSection() {
  return `
    <section class="section demo" id="demo">
      <div class="section-heading">
        <p class="eyebrow">Product demo</p>
        <h2>Explore the interface ecosystem.</h2>
        <p>Preview the product pages from the supplied Stitch concept in one polished marketing site.</p>
      </div>
      <div class="demo-grid">
        <figure>
          <img src="assets/demo.png" alt="Product demo page preview" />
          <figcaption>Product ecosystem gallery</figcaption>
        </figure>
        <figure>
          <img src="assets/pricing.png" alt="Pricing page preview" />
          <figcaption>Pricing and package comparison</figcaption>
        </figure>
      </div>
    </section>
  `;
}
