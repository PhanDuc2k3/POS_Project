import { renderIcon } from '../utils/icons.js';

const navItems = [
  ['overview', 'Tổng quan', 'grid'],
  ['orders', 'Đơn đăng ký', 'receipt'],
  ['tenants', 'Tenant', 'tenant'],
  ['accounts', 'Tài khoản', 'accounts'],
  ['packages', 'Gói dịch vụ', 'package'],
  ['permissions', 'Phân quyền', 'key'],
  ['audit', 'Nhật ký kiểm toán', 'audit'],
];

export function renderSidebar(activeView) {
  return `
    <aside class="sidebar">
      <div class="brand-block">
        <div class="brand-mark"></div>
        <div>
          <strong>POS Platform</strong>
          <span>Bảng quản trị</span>
        </div>
      </div>

      <button class="new-tenant-btn" data-action="open-create-tenant">
        ${renderIcon('plus', 'plus-mark')}
        Tạo tenant
      </button>

      <nav class="sidebar-nav">
        ${navItems.map(([view, label, icon]) => navButton(view, label, icon, activeView)).join('')}
      </nav>

      <div class="sidebar-footer">
        <button class="nav-button utility" data-action="refresh-data"><i class="nav-icon sync"></i>Đồng bộ</button>
        <button class="nav-button utility" data-action="view" data-view="settings"><i class="nav-icon profile"></i>Hồ sơ</button>
        <button class="nav-button utility" data-action="sign-out"><i class="nav-icon signout"></i>Đăng xuất</button>
      </div>
    </aside>
  `;
}

function navButton(view, label, icon, activeView) {
  return `
    <button class="nav-button ${activeView === view ? 'active' : ''}" data-action="view" data-view="${view}">
      ${renderIcon(icon, 'nav-icon')}
      ${label}
    </button>
  `;
}
