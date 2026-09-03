export function renderIcon(name, className = 'lucide-icon') {
  return `<i data-lucide="${name}" class="${className}" aria-hidden="true"></i>`;
}

function addLeadingIcon(selector, name, className = 'lucide-icon') {
  document.querySelectorAll(selector).forEach((element) => {
    stripLeadingTextMarker(element);
    if (element.querySelector('[data-lucide]')) return;
    element.insertAdjacentHTML('afterbegin', renderIcon(name, className));
  });
}

function addTrailingIcon(selector, name, className = 'lucide-icon') {
  document.querySelectorAll(selector).forEach((element) => {
    stripTrailingTextMarker(element);
    if (element.querySelector('[data-lucide]')) return;
    element.insertAdjacentHTML('beforeend', renderIcon(name, className));
  });
}

function stripLeadingTextMarker(element) {
  const firstNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (!firstNode) return;
  firstNode.textContent = firstNode.textContent.replace(/^\s*(←|â†)\s*/, '');
}

function stripTrailingTextMarker(element) {
  const lastNode = [...element.childNodes].reverse().find((node) => node.nodeType === Node.TEXT_NODE);
  if (!lastNode) return;
  lastNode.textContent = lastNode.textContent.replace(/\s*(→|â†’)\s*$/, '');
}

function enhanceIconMarkup() {
  addLeadingIcon('.auth-login-button', 'log-in');
  addLeadingIcon('.auth-button[data-auth-mode="signup"]', 'user-plus');
  addLeadingIcon('.logout-button', 'log-out');
  addLeadingIcon('.back-link', 'arrow-left');
  addTrailingIcon('.product-card-link', 'arrow-right');
  addTrailingIcon('.news-card-body > strong', 'arrow-right');
  addTrailingIcon('.hero-actions .button.primary, .price-card .button, .support-contact .button', 'arrow-right');
  addLeadingIcon('.hero-actions .button.secondary, .product-detail-actions .button.secondary', 'monitor-play');
}

export function renderLucideIcons() {
  enhanceIconMarkup();

  if (!window.lucide?.createIcons) return;

  window.lucide.createIcons({
    attrs: {
      'aria-hidden': 'true',
      focusable: 'false',
    },
  });
}
