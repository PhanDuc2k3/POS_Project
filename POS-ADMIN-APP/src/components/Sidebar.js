const navItems = [
  ['overview', 'Overview', 'grid'],
  ['orders', 'Orders', 'receipt'],
  ['requests', 'Trial Requests', 'request'],
  ['tenants', 'Tenants', 'tenant'],
  ['accounts', 'Accounts', 'accounts'],
  ['packages', 'Packages', 'package'],
  ['permissions', 'Permissions', 'key'],
];

export function renderSidebar(activeView) {
  return `
    <aside class="sidebar">
      <div class="brand-block">
        <div class="brand-mark"></div>
        <div>
          <strong>POS Platform</strong>
          <span>Admin Console</span>
        </div>
      </div>

      <button class="new-tenant-btn" data-action="view" data-view="tenants">
        <span class="plus-mark"></span>
        New Tenant
      </button>

      <nav class="sidebar-nav">
        ${navItems.map(([view, label, icon]) => navButton(view, label, icon, activeView)).join('')}
      </nav>

      <div class="sidebar-footer">
        <button class="nav-button utility" data-action="refresh-data"><i class="nav-icon sync"></i>Sync</button>
        <button class="nav-button utility" data-action="view" data-view="accounts"><i class="nav-icon profile"></i>Profile</button>
        <button class="nav-button utility" data-action="sign-out"><i class="nav-icon signout"></i>Sign Out</button>
      </div>
    </aside>
  `;
}

function navButton(view, label, icon, activeView) {
  return `
    <button class="nav-button ${activeView === view ? 'active' : ''}" data-action="view" data-view="${view}">
      <i class="nav-icon ${icon}"></i>
      ${label}
    </button>
  `;
}
