import { renderBrand } from './Brand.js';
import { navLinks } from '../shared/data.js';
import { renderIcon } from '../shared/icons.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderHeader(activeRoute = '#home', state = {}) {
  const profileActive = activeRoute === '#profile' || activeRoute === '#order';
  const navItems = state.marketingSignup?.signupToken
    ? [...navLinks, { href: '#profile', label: 'Cá nhân' }]
    : navLinks;
  const links = navItems
    .map((item) => `<a href="${item.href}" class="${item.href === activeRoute || (item.href === '#profile' && profileActive) ? 'active' : ''}">${item.label}</a>`)
    .join('');

  const signup = state.marketingSignup || null;
  const actions = signup?.signupToken ? `
          <a class="account-chip ${profileActive ? 'active' : ''}" href="#profile" title="${esc(signup.email || signup.name)}">
            ${renderIcon('circle-user-round', 'account-icon')}
            <span>${esc(signup.name || signup.email)}</span>
          </a>
          <button class="button secondary small auth-button logout-button" type="button" data-action="logout">Đăng xuất</button>
  ` : `
          <button class="auth-login-button" type="button" data-action="open-auth" data-auth-mode="signin">Đăng nhập</button>
          <button class="button primary small auth-button" type="button" data-action="open-auth" data-auth-mode="signup">Đăng ký</button>
  `;

  return `
    <header class="site-header" id="top">
      <div class="header-shell">
        ${renderBrand()}
        <nav class="site-nav" aria-label="Main navigation">${links}</nav>
        <div class="header-actions">${actions}</div>
        <button class="menu-button" type="button" aria-label="Open menu" aria-expanded="false">
          ${renderIcon('menu')}
        </button>
      </div>
    </header>
  `;
}
