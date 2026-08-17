import { renderBrand } from './Brand.js';
import { navLinks } from '../shared/data.js';

export function renderFooter() {
  const links = navLinks
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join('');

  return `
    <footer class="footer">
      <div>
        ${renderBrand()}
        <p>Enterprise-grade point of sale and restaurant management for modern hospitality teams.</p>
      </div>
      <div class="footer-links">${links}</div>
    </footer>
  `;
}
