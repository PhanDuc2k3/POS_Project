import { products } from '../shared/data.js';

export function renderProductPage() {
  const cards = products
    .map((product) => `
      <article class="content-card product-card">
        <img src="${product.image}" alt="${product.title}" />
        <div>
          <h3>${product.title}</h3>
          <p>${product.text}</p>
        </div>
      </article>
    `)
    .join('');

  return `
    <main class="page-main">
      <section class="section page-hero">
        <p class="eyebrow">Sản phẩm</p>
        <h1>Bộ công cụ POS cho vận hành nhà hàng hiện đại.</h1>
        <p>Từ quầy thu ngân đến QR order, bếp, thanh toán và quản lý doanh thu, các module được thiết kế để làm việc cùng nhau.</p>
      </section>
      <section class="section content-grid">${cards}</section>
    </main>
  `;
}
