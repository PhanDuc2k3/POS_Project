import { companyLocations } from '../shared/data.js';

export function renderLocationPage() {
  const locations = companyLocations
    .map((location) => `
      <article class="content-card location-card">
        <h3>${location.city}</h3>
        <p>${location.address}</p>
        <span>${location.phone}</span>
      </article>
    `)
    .join('');

  return `
    <main class="page-main">
      <section class="section page-hero">
        <p class="eyebrow">Địa điểm công ty</p>
        <h1>Kết nối với đội ngũ Precision POS.</h1>
        <p>Chúng tôi hỗ trợ tư vấn triển khai, demo sản phẩm và đồng hành trong quá trình đưa hệ thống vào vận hành.</p>
      </section>
      <section class="section location-layout">
        <div class="location-map" aria-label="Company location map">
          <span>Precision POS</span>
        </div>
        <div class="location-list">${locations}</div>
      </section>
    </main>
  `;
}
