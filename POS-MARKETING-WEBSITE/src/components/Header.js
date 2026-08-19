import { renderBrand } from './Brand.js';
import { navLinks } from '../shared/data.js';

export function renderHeader(activeRoute = '#home') {
  const links = navLinks
    .map((item) => `<a href="${item.href}" class="${item.href === activeRoute ? 'active' : ''}">${item.label}</a>`)
    .join('');

  return `
    <header class="site-header" id="top">
      <div class="header-shell">
        ${renderBrand()}
        <nav class="site-nav" aria-label="Main navigation">${links}</nav>
        <div class="header-actions">
          <button class="text-link auth-trigger" type="button" data-action="open-auth" data-auth-mode="signin">Đăng nhập</button>
          <button class="button primary small" type="button" data-action="open-auth" data-auth-mode="signup">Đăng ký</button>
        </div>
        <button class="menu-button" type="button" aria-label="Open menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  `;
}
