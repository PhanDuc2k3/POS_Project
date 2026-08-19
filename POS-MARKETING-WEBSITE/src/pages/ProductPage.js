import { featureComparison, hardwareProducts, products, softwareProducts } from '../shared/data.js';

function renderMark(value) {
  if (typeof value === 'string') return `<span class="feature-text">${value}</span>`;
  return value ? '<span class="feature-yes">✓</span>' : '<span class="feature-no">—</span>';
}

function getSelectedProduct() {
  const [, slug] = window.location.hash.split('/');
  return products.find((product) => product.slug === slug) || null;
}

function renderProductCard(product) {
  const highlights = product.highlights
    .slice(0, 3)
    .map((item) => `<li>${item}</li>`)
    .join('');

  return `
    <a class="content-card product-card" href="#products/${product.slug}" aria-label="Xem chi tiết ${product.title}">
      <span class="product-card-badge">${product.badge}</span>
      <img src="${product.image}" alt="${product.title}" />
      <div class="product-card-body">
        <div>
          <p class="product-package">${product.package}</p>
          <h3>${product.title}</h3>
          <p>${product.text}</p>
        </div>
        <ul>${highlights}</ul>
        <span class="product-card-link">Xem chi tiết</span>
      </div>
    </a>
  `;
}

function renderProductSection({ eyebrow, title, text, items, modifier = '' }) {
  const cards = items.map(renderProductCard).join('');

  return `
    <section class="section product-category ${modifier}">
      <div class="section-heading">
        <p class="eyebrow">${eyebrow}</p>
        <h2>${title}</h2>
        <p>${text}</p>
      </div>
      <div class="content-grid product-grid">${cards}</div>
    </section>
  `;
}

function renderProductList() {
  const rows = featureComparison
    .map((row) => `
      <tr>
        <th>${row.feature}</th>
        <td>${renderMark(row.trial)}</td>
        <td>${renderMark(row.plus)}</td>
        <td>${renderMark(row.pro)}</td>
      </tr>
    `)
    .join('');

  return `
    <main class="page-main">
      <section class="section page-hero product-hero">
        <p class="eyebrow">Sản phẩm</p>
        <h1>Phần mềm để vận hành. Phần cứng để triển khai tại điểm bán.</h1>
        <p>Precision POS tách rõ gói phần mềm và thiết bị phần cứng. Các thiết bị như máy POS, kiosk và màn hình bếp đều được tích hợp với app để đồng bộ đơn hàng.</p>
      </section>
      <section class="section solution-choice">
        <article class="choice-card">
          <p class="eyebrow">Phần mềm</p>
          <h2>Trial Plus, PLUS và PRO</h2>
          <div class="choice-flow">
            <span>Trial Plus 1 tuần</span>
            <span>PLUS</span>
            <span>PRO</span>
          </div>
        </article>
        <article class="choice-card pro">
          <p class="eyebrow">Phần cứng</p>
          <h2>Thiết bị tích hợp với app</h2>
          <div class="choice-flow">
            <span>POS</span>
            <span>Kiosk</span>
            <span>Màn hình bếp</span>
            <span>Máy in</span>
          </div>
        </article>
      </section>
      ${renderProductSection({
        eyebrow: 'Phần mềm',
        title: 'Chọn gói theo mô hình vận hành',
        text: 'Bắt đầu bằng Trial Plus 1 tuần, sau đó nâng cấp lên PLUS cho bán tại quầy hoặc PRO cho workflow nhà hàng đầy đủ.',
        items: softwareProducts,
        modifier: 'software-products',
      })}
      ${renderProductSection({
        eyebrow: 'Phần cứng',
        title: 'Thiết bị triển khai tại cửa hàng',
        text: 'Máy POS, kiosk đặt đồ ăn nhanh, màn hình bếp và máy in được thiết kế để chạy cùng hệ sinh thái app.',
        items: hardwareProducts,
        modifier: 'hardware-products',
      })}
      <section class="section comparison-panel product-comparison">
        <div class="section-heading center">
          <p class="eyebrow">Software comparison</p>
          <h2>So sánh Trial Plus, PLUS và PRO</h2>
        </div>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Tính năng</th>
              <th>Trial Plus</th>
              <th>PLUS</th>
              <th>PRO</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    </main>
  `;
}

function renderProductDetail(product) {
  const otherProducts = products
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .map((item) => `<a href="#products/${item.slug}">${item.title}</a>`)
    .join('');

  const highlights = product.highlights.map((item) => `<li>${item}</li>`).join('');
  const modules = product.modules.map((item) => `<span>${item}</span>`).join('');
  const metrics = product.metrics
    .map((item) => `
      <div>
        <strong>${item.value}</strong>
        <span>${item.label}</span>
      </div>
    `)
    .join('');

  return `
    <main class="page-main product-detail-main">
      <section class="section product-detail-hero">
        <div class="product-detail-copy">
          <a class="back-link" href="#products">← Tất cả sản phẩm</a>
          <p class="eyebrow">${product.badge}</p>
          <h1>${product.title}</h1>
          <p>${product.summary}</p>
          <div class="product-detail-actions">
            <a class="button primary" href="#trial">Đăng ký tư vấn</a>
            <a class="button secondary" href="#products">So sánh gói</a>
          </div>
        </div>
        <figure class="product-detail-visual">
          <img src="${product.image}" alt="${product.title}" />
          <figcaption>${product.package}</figcaption>
        </figure>
      </section>
      <section class="section product-detail-grid">
        <article class="product-detail-panel">
          <p class="eyebrow">Phù hợp với</p>
          <h2>${product.bestFor}</h2>
          <ul class="product-detail-list">${highlights}</ul>
        </article>
        <aside class="product-detail-side">
          <div class="product-detail-metrics">${metrics}</div>
          <div class="module-cloud">${modules}</div>
        </aside>
      </section>
      <section class="section related-products">
        <p class="eyebrow">${product.category === 'hardware' ? 'Thiết bị liên quan' : 'Gói phần mềm liên quan'}</p>
        <div>${otherProducts}</div>
      </section>
    </main>
  `;
}

export function renderProductPage() {
  const selectedProduct = getSelectedProduct();
  return selectedProduct ? renderProductDetail(selectedProduct) : renderProductList();
}
