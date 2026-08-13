export function renderSidebar(activeView) {
  return `
    <aside class="sidebar">
      <div class="brand-block">
        <strong>POS Platform</strong>
        <span>Owner Console</span>
      </div>
      ${navButton('overview', 'Overview', activeView)}
      ${navButton('tenants', 'Tenants', activeView)}
      ${navButton('packages', 'Packages', activeView)}
      ${navButton('accounts', 'Accounts', activeView)}
      ${navButton('orders', 'Orders', activeView)}
      ${navButton('permissions', 'Permissions', activeView)}
      <button class="nav-button soft" data-action="refresh-data">Refresh data</button>
      <button class="nav-button soft" data-action="sign-out">Sign out</button>
    </aside>
  `;
}

function navButton(view, label, activeView) {
  return `<button class="nav-button ${activeView === view ? 'active' : ''}" data-action="view" data-view="${view}">${label}</button>`;
}
