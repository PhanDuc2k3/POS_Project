import { news } from '../shared/data.js';

export function renderNewsPage() {
  const items = news
    .map((item) => `
      <article class="content-card news-card">
        <span>${item.date}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>
    `)
    .join('');

  return `
    <main class="page-main">
      <section class="section page-hero">
        <p class="eyebrow">Tin tức</p>
        <h1>Cập nhật sản phẩm và câu chuyện vận hành.</h1>
        <p>Theo dõi các thay đổi mới nhất của Precision POS, kinh nghiệm triển khai và các cải tiến dành cho đội ngũ nhà hàng.</p>
      </section>
      <section class="section content-grid three-columns">${items}</section>
    </main>
  `;
}
