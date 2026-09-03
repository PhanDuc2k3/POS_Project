const iconMap = {
  accounts: 'users',
  audit: 'clipboard-list',
  catalog: 'boxes',
  default: 'activity',
  email: 'mail',
  finance: 'circle-dollar-sign',
  grid: 'layout-dashboard',
  key: 'key-round',
  mrr: 'badge-dollar-sign',
  orders: 'receipt',
  package: 'package',
  profile: 'circle-user-round',
  receipt: 'receipt-text',
  request: 'file-clock',
  signout: 'log-out',
  store: 'store',
  sync: 'refresh-cw',
  tenant: 'building-2',
  tenants: 'building-2',
  tickets: 'messages-square',
  trials: 'flask-conical',
};

export function renderIcon(name, className = 'lucide-icon') {
  return `<i data-lucide="${iconMap[name] || name}" class="${className}" aria-hidden="true"></i>`;
}

function replaceClassIcons(selector, baseClass = '') {
  document.querySelectorAll(selector).forEach((element) => {
    if (element.dataset.lucide) return;
    const key = [...element.classList].find((item) => item !== baseClass && iconMap[item]);
    if (!key) return;
    element.setAttribute('data-lucide', iconMap[key]);
    element.setAttribute('aria-hidden', 'true');
  });
}

function fillEmptyIcon(selector, name) {
  document.querySelectorAll(selector).forEach((element) => {
    if (element.dataset.lucide) return;
    if (element.querySelector('[data-lucide]')) return;
    if (['I', 'SPAN'].includes(element.tagName)) {
      element.setAttribute('data-lucide', iconMap[name] || name);
      element.setAttribute('aria-hidden', 'true');
      element.classList.add('lucide-icon');
      return;
    }
    element.insertAdjacentHTML('afterbegin', renderIcon(name));
  });
}

function enhanceIconMarkup() {
  replaceClassIcons('.nav-icon', 'nav-icon');
  replaceClassIcons('.metric-icon', 'metric-icon');
  replaceClassIcons('.section-icon', 'section-icon');
  replaceClassIcons('.permission-group-row i');
  fillEmptyIcon('.top-search > i, .permissions-search > i, .accounts-search > i', 'search');
  fillEmptyIcon('.tenant-search > i, .trial-search > i', 'search');
  fillEmptyIcon('.accounts-tenant-filter > i', 'building-2');
  fillEmptyIcon('.brand-mark', 'shield-check');
  fillEmptyIcon('.top-icon.notification-trigger', 'bell');
  fillEmptyIcon('.top-icon.settings', 'settings');
  fillEmptyIcon('.top-avatar', 'circle-user-round');
  fillEmptyIcon('.plus-mark, .account-invite-open > span', 'plus');
  fillEmptyIcon('.tenant-add-btn > span', 'plus');
  fillEmptyIcon('.audit-refresh-btn > i, .trial-refresh-btn > i, .settings-refresh-btn > i', 'refresh-cw');
  fillEmptyIcon('.tenant-export-btn > i', 'download');
  fillEmptyIcon('.package-card-picker', 'pencil');
  fillEmptyIcon('.package-limits dt > i', 'gauge');
  fillEmptyIcon('.comparison-toggle > i', 'chevron-down');
  fillEmptyIcon('.package-edit-head button, .account-detail-head button, .invite-account-head button, .ban-account-head button', 'x');
  fillEmptyIcon('.order-detail-close, .order-reject-head button, .tenant-detail-close, .tenant-create-head button, .settings-close-btn, .trial-detail-head button', 'x');
  fillEmptyIcon('.accounts-icon-btn.filter', 'sliders-horizontal');
  fillEmptyIcon('.accounts-icon-btn.export', 'download');
  fillEmptyIcon('.account-actions button', 'chevron-right');
  fillEmptyIcon('.trial-row-actions button', 'chevron-right');
  fillEmptyIcon('.avatar-dropzone > i', 'camera');
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
