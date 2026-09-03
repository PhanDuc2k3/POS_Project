import { news } from '../shared/data.js';
import { renderIcon } from '../shared/icons.js';

function getSelectedArticle() {
  const [, slug] = window.location.hash.split('/');
  return news.find((item) => item.slug === slug) || null;
}

function renderTags(tags) {
  return tags.map((tag) => `<span>${tag}</span>`).join('');
}

function renderNewsCard(item, isFeature = false) {
  return `
    <a class="content-card news-card ${isFeature ? 'featured' : ''}" href="#news/${item.slug}" aria-label="Đọc tin ${item.title}">
      <img src="${item.image}" alt="${item.title}" />
      <div class="news-card-body">
        <div class="news-meta">
          <span>${item.category}</span>
          <span>${item.date}</span>
          <span>${item.readTime}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        <div class="news-tags">${renderTags(item.tags)}</div>
        <strong>Đọc bài viết</strong>
      </div>
    </a>
  `;
}

function renderNewsList() {
  const [featuredArticle, ...otherArticles] = news;
  const cards = otherArticles.map((item) => renderNewsCard(item)).join('');

  return `
    <main class="page-main news-main">
      <section class="section page-hero news-hero">
        <p class="eyebrow">Tin tức</p>
        <h1>Cập nhật sản phẩm, phần cứng và câu chuyện vận hành.</h1>
        <p>Theo dõi thay đổi mới của Precision POS, kinh nghiệm triển khai tại cửa hàng và các cải tiến dành cho đội ngũ F&B.</p>
      </section>
      <section class="section news-feature">
        <div class="section-heading">
          <p class="eyebrow">Bài nổi bật</p>
          <h2>Những cập nhật đáng chú ý</h2>
        </div>
        ${renderNewsCard(featuredArticle, true)}
      </section>
      <section class="section news-library">
        <div class="section-heading">
          <p class="eyebrow">Thư viện tin tức</p>
          <h2>Bài viết mới nhất</h2>
        </div>
        <div class="content-grid three-columns">${cards}</div>
      </section>
    </main>
  `;
}

function renderNewsDetail(article) {
  const relatedArticles = news
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3)
    .map((item) => `<a href="#news/${item.slug}">${item.title}</a>`)
    .join('');

  const takeaways = article.takeaways.map((item) => `<li>${renderIcon('check', 'list-icon')}${item}</li>`).join('');
  const sections = article.sections
    .map((section) => `
      <section>
        <h2>${section.heading}</h2>
        <p>${section.body}</p>
      </section>
    `)
    .join('');

  return `
    <main class="page-main news-detail-main">
      <article class="section news-detail">
        <a class="back-link" href="#news">← Tất cả tin tức</a>
        <header class="news-detail-header">
          <div class="news-meta">
            <span>${article.category}</span>
            <span>${article.date}</span>
            <span>${article.readTime}</span>
          </div>
          <h1>${article.title}</h1>
          <p>${article.summary}</p>
          <div class="news-tags">${renderTags(article.tags)}</div>
        </header>
        <img class="news-detail-image" src="${article.image}" alt="${article.title}" />
        <div class="news-detail-layout">
          <aside class="news-takeaways">
            <p class="eyebrow">Tóm tắt</p>
            <ul>${takeaways}</ul>
          </aside>
          <div class="news-article-body">
            ${sections}
            <div class="news-author">
              <span>Người viết</span>
              <strong>${article.author}</strong>
            </div>
          </div>
        </div>
      </article>
      <section class="section related-news">
        <p class="eyebrow">Bài viết liên quan</p>
        <div>${relatedArticles}</div>
      </section>
    </main>
  `;
}

export function renderNewsPage() {
  const selectedArticle = getSelectedArticle();
  return selectedArticle ? renderNewsDetail(selectedArticle) : renderNewsList();
}
