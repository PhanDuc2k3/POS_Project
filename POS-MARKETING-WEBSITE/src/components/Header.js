import { renderBrand } from './Brand.js';
import { navLinks } from '../shared/data.js';

export function renderHeader() {
  const links = navLinks.map((item) => `<a href="${item.href}">${item.label}</a>`).join('');

  return `
    <header class="site-header" id="top">
      ${renderBrand()}
      <button class="menu-button" type="button" aria-label="Open menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav class="site-nav" aria-label="Main navigation">${links}</nav>
      <div class="header-actions">
        <a class="text-link" href="#signin">Sign in</a>
        <a class="button primary small" href="#trial">Start free trial</a>
      </div>
    </header>
  `;
}
