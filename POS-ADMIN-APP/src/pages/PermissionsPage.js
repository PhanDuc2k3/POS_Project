import { esc } from '../utils/format.js';
import { permissionCatalog } from '../data/platform.js';

const roles = [
  ['store_owner', 'Chủ sở hữu', 'Toàn quyền'],
  ['chain_admin', 'Quản trị', 'Cấu hình'],
  ['manager', 'Quản lý', 'Vận hành'],
  ['cashier', 'Nhân viên', 'Thực thi'],
  ['kitchen', 'Theo dõi', 'Chỉ đọc'],
];

const baseGroups = [
  {
    title: 'Quản lý cửa hàng',
    icon: 'store',
    permissions: [
      ['store.manage', 'Quản lý hồ sơ cửa hàng', 'store.profile.write'],
      ['branch.manage', 'Cấu hình giờ hoạt động', 'store.hours.write'],
    ],
  },
  {
    title: 'Danh mục sản phẩm',
    icon: 'catalog',
    permissions: [
      ['product.manage', 'Tạo/sửa sản phẩm', 'catalog.product.write'],
      ['topping.manage', 'Nhập/xuất hàng loạt', 'catalog.bulk.execute', 'GÓI PRO'],
    ],
  },
  {
    title: 'Đơn hàng & tài chính',
    icon: 'finance',
    permissions: [
      ['transaction.view', 'Xử lý hoàn tiền', 'finance.refund.execute'],
    ],
  },
];

export function renderPermissionsPage(state) {
  const groups = buildPermissionGroups();
  const visibleGroups = filterGroups(groups, state.permissionSearch);
  return `
    <section class="permissions-page">
      <header class="permissions-topline">
        <div class="permissions-breadcrumb">Quản trị <span></span> <strong>Phân quyền</strong></div>
        <label class="permissions-search">
          <i></i>
          <input data-field="permissionSearch" value="${esc(state.permissionSearch || '')}" aria-label="Tìm quyền" placeholder="Tìm quyền..." />
        </label>
      </header>

      <section class="permissions-heading">
        <div>
          <h1>Ma trận phân quyền</h1>
          <p>Cấu hình quyền chi tiết cho từng vai trò trên nền tảng. Một số miền có thể bị giới hạn theo gói thuê bao đang hoạt động. Thay đổi sẽ áp dụng toàn cục cho mọi phiên sau khi lưu.</p>
        </div>
        <div class="permissions-actions">
          <button type="button" class="permission-discard-btn" data-action="discard-permissions" ${state.permissionDirty ? '' : 'disabled'}>Bỏ thay đổi</button>
          <button type="button" class="permission-save-btn" data-action="save-permissions" ${state.permissionDirty ? '' : 'disabled'}>Lưu cấu hình</button>
        </div>
      </section>

      <section class="permission-matrix-card">
        <div class="permission-matrix-head">
          <span>Miền / Quyền</span>
          ${roles.map(([, label, note]) => `
            <span>
              <strong>${esc(label)}</strong>
              <small>${esc(note)}</small>
            </span>
          `).join('')}
        </div>
        ${visibleGroups.map((group) => renderGroup(group, state)).join('') || '<div class="empty">Không có quyền phù hợp tìm kiếm</div>'}
      </section>
    </section>
  `;
}

function buildPermissionGroups() {
  const described = new Set(baseGroups.flatMap((group) => group.permissions.map(([id]) => id)));
  const extras = permissionCatalog.filter((permission) => !described.has(permission.id));
  const accessGroups = [
    {
      title: 'Quản trị nền tảng',
      icon: 'store',
      permissions: extras
        .filter((permission) => ['tenant.manage', 'package.assign', 'order.manage', 'account.manage', 'permission.manage', 'audit.view'].includes(permission.id))
        .map((permission) => [permission.id, permission.label, permission.id]),
    },
    {
      title: 'Vận hành',
      icon: 'catalog',
      permissions: extras
        .filter((permission) => !['tenant.manage', 'package.assign', 'order.manage', 'account.manage', 'permission.manage', 'audit.view'].includes(permission.id))
        .map((permission) => [permission.id, permission.label, permission.id]),
    },
  ].filter((group) => group.permissions.length);
  return [...baseGroups, ...accessGroups];
}

function filterGroups(items, queryValue) {
  const query = String(queryValue || '').trim().toLowerCase();
  if (!query) return items;
  return items
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((permission) => [group.title, ...permission].join(' ').toLowerCase().includes(query)),
    }))
    .filter((group) => group.permissions.length);
}

function renderGroup(group, state) {
  return `
    <div class="permission-group-row">
      <strong><i class="${esc(group.icon)}"></i>${esc(group.title)}</strong>
    </div>
    ${group.permissions.map((permission) => renderPermissionRow(permission, state)).join('')}
  `;
}

function renderPermissionRow(permission, state) {
  const [id, label, code, badge] = permission;
  return `
    <div class="permission-matrix-row">
      <span class="permission-capability">
        <strong>${esc(label)}</strong>
        <small>${esc(code)}${badge ? `<b>${esc(badge)}</b>` : ''}</small>
      </span>
      ${roles.map(([role]) => renderPermissionCell(role, id, state)).join('')}
    </div>
  `;
}

function renderPermissionCell(role, permission, state) {
  const permissions = state.permissionDraft || state.permissions || {};
  const enabled = new Set(permissions?.[role] || []);
  const checked = enabled.has(permission);
  return `
    <label class="permission-check-cell">
      <input
        type="checkbox"
        data-action="toggle-permission-draft"
        data-role="${esc(role)}"
        data-permission="${esc(permission)}"
        ${checked ? 'checked' : ''}
      />
    </label>
  `;
}
