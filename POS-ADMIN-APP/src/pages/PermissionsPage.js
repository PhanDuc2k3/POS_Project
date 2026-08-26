import { esc } from '../utils/format.js';
import { packageCatalog, permissionCatalog } from '../data/platform.js';

const groupDefinitions = [
  {
    title: 'Quản trị nền tảng',
    icon: 'store',
    permissions: ['tenant.manage', 'package.assign', 'order.manage', 'account.manage', 'permission.manage', 'audit.view'],
  },
  {
    title: 'Cửa hàng & danh mục',
    icon: 'catalog',
    permissions: ['store.manage', 'branch.manage', 'menu.manage', 'staff.manage', 'staff.view'],
  },
  {
    title: 'Bán hàng & vận hành',
    icon: 'finance',
    permissions: ['transaction.view', 'billing.view', 'pos.sell', 'payment.collect', 'kitchen.view', 'kitchen.update'],
  },
];

const defaultPackagePermissions = {
  trial: ['store.manage', 'menu.manage', 'transaction.view', 'pos.sell', 'payment.collect'],
  plus: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect'],
  pro: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect', 'kitchen.view', 'kitchen.update'],
  starter: ['store.manage', 'menu.manage', 'transaction.view', 'billing.view', 'pos.sell', 'payment.collect'],
  restaurant: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect', 'kitchen.view', 'kitchen.update'],
  chain: ['store.manage', 'branch.manage', 'menu.manage', 'transaction.view', 'staff.manage', 'staff.view', 'billing.view', 'pos.sell', 'payment.collect', 'kitchen.view', 'kitchen.update'],
};

export function renderPermissionsPage(state) {
  const packages = preferredPackages(state.packages?.length ? state.packages : packageCatalog);
  const groups = filterGroups(buildPermissionGroups(), state.permissionSearch);
  const dirty = Boolean(state.packagePermissionDirty || state.permissionDirty);

  return `
    <section class="permissions-page package-permissions-page">
      <header class="permissions-topline">
        <div class="permissions-breadcrumb">Quản trị <span></span> <strong>Quyền theo gói</strong></div>
        <label class="permissions-search">
          <i></i>
          <input data-field="permissionSearch" value="${esc(state.permissionSearch || '')}" aria-label="Tìm quyền" placeholder="Tìm quyền hoặc gói..." />
        </label>
      </header>

      <section class="permissions-heading">
        <div>
          <h1>Setup quyền cho từng gói</h1>
          <p>Cấu hình quyền/tính năng mà tenant được sử dụng theo gói dịch vụ. Thay đổi ở đây áp dụng ở cấp package, tách riêng với phân quyền vai trò nhân sự.</p>
        </div>
        <div class="permissions-actions">
          <button type="button" class="permission-discard-btn" data-action="discard-permissions" ${dirty ? '' : 'disabled'}>Bỏ thay đổi</button>
          <button type="button" class="permission-save-btn" data-action="save-permissions" ${dirty ? '' : 'disabled'}>Lưu cấu hình</button>
        </div>
      </section>

      <section class="package-permission-summary">
        ${packages.map((pkg) => renderPackageSummary(pkg, state)).join('')}
      </section>

      <section class="permission-matrix-card package-permission-matrix" style="--package-count: ${esc(packages.length)}">
        <div class="permission-matrix-head">
          <span>Quyền / Tính năng</span>
          ${packages.map((pkg) => `
            <span>
              <strong>${esc(packageName(pkg))}</strong>
              <small>${esc(pkg.level || pkg.id)}</small>
            </span>
          `).join('')}
        </div>
        ${groups.map((group) => renderGroup(group, packages, state)).join('') || '<div class="empty">Không có quyền phù hợp tìm kiếm</div>'}
      </section>
    </section>
  `;
}

function renderPackageSummary(pkg, state) {
  const enabled = packagePermissions(pkg.id, state, pkg).length;
  return `
    <article class="package-permission-card ${esc(pkg.id)}">
      <span>${esc(pkg.level || 'Gói')}</span>
      <strong>${esc(packageName(pkg))}</strong>
      <small>${enabled}/${permissionCatalog.length} quyền đang bật</small>
    </article>
  `;
}

function buildPermissionGroups() {
  const described = new Set(groupDefinitions.flatMap((group) => group.permissions));
  const extras = permissionCatalog.filter((permission) => !described.has(permission.id)).map((permission) => permission.id);
  return [
    ...groupDefinitions,
    ...(extras.length ? [{ title: 'Khác', icon: 'catalog', permissions: extras }] : []),
  ].map((group) => ({
    ...group,
    permissions: group.permissions
      .map((id) => permissionCatalog.find((permission) => permission.id === id))
      .filter(Boolean),
  })).filter((group) => group.permissions.length);
}

function filterGroups(items, queryValue) {
  const query = String(queryValue || '').trim().toLowerCase();
  if (!query) return items;
  return items
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((permission) => [group.title, permission.id, permission.label].join(' ').toLowerCase().includes(query)),
    }))
    .filter((group) => group.permissions.length);
}

function renderGroup(group, packages, state) {
  return `
    <div class="permission-group-row">
      <strong><i class="${esc(group.icon)}"></i>${esc(group.title)}</strong>
    </div>
    ${group.permissions.map((permission) => renderPermissionRow(permission, packages, state)).join('')}
  `;
}

function renderPermissionRow(permission, packages, state) {
  return `
    <div class="permission-matrix-row">
      <span class="permission-capability">
        <strong>${esc(permission.label)}</strong>
        <small>${esc(permission.id)}</small>
      </span>
      ${packages.map((pkg) => renderPermissionCell(pkg, permission.id, state)).join('')}
    </div>
  `;
}

function renderPermissionCell(pkg, permission, state) {
  const enabled = new Set(packagePermissions(pkg.id, state, pkg));
  const checked = enabled.has(permission);
  return `
    <label class="permission-check-cell" title="${esc(packageName(pkg))} / ${esc(permission)}">
      <input
        type="checkbox"
        data-action="toggle-permission-draft"
        data-package="${esc(pkg.id)}"
        data-permission="${esc(permission)}"
        ${checked ? 'checked' : ''}
      />
    </label>
  `;
}

function packagePermissions(packageId, state, pkg) {
  const draft = state.packagePermissionDraft || buildPackagePermissionMap(state.packages?.length ? state.packages : packageCatalog);
  return draft[packageId] || pkg.permissions || [];
}

function buildPackagePermissionMap(packages) {
  return Object.fromEntries((packages || []).map((pkg) => [pkg.id, [...(pkg.permissions?.length ? pkg.permissions : defaultPackagePermissions[pkg.id] || [])]]));
}

function preferredPackages(packages) {
  const order = ['trial', 'plus', 'pro', 'starter', 'restaurant', 'chain'];
  const selected = order.map((id) => packages.find((pkg) => pkg.id === id)).filter(Boolean);
  const extra = packages.filter((pkg) => !order.includes(pkg.id));
  return selected.length ? [...selected, ...extra] : packages;
}

function packageName(pkg) {
  return pkg.name || String(pkg.id || '').toUpperCase();
}
