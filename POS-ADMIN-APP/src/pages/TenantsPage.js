import { esc } from '../utils/format.js';

const fallbackTenants = [
  {
    id: 101,
    name: 'Nhà hàng Bean',
    ownerName: 'Nguyễn Sarah',
    ownerEmail: 'sarah@beaneatery.com',
    packageTier: 'pro',
    operatingMode: 'restaurant',
    status: 'active',
    branches: 3,
    users: 5,
    renewalDate: '2024-10-12',
  },
  {
    id: 102,
    name: 'Vinyl & Brews',
    ownerName: 'Trần Marcus',
    ownerEmail: 'marcus@vinylbrews.co',
    packageTier: 'plus',
    operatingMode: 'retail',
    status: 'suspended',
    branches: 1,
    users: 2,
    renewalDate: 'overdue',
  },
  {
    id: 103,
    name: 'Chợ Fresh Finds',
    ownerName: 'Lê Elena',
    ownerEmail: 'elena@freshfinds.com',
    packageTier: 'starter',
    operatingMode: 'simple',
    status: 'active',
    branches: 1,
    users: 1,
    renewalDate: '2024-11-05',
  },
];

export function renderTenantsPage(state) {
  const sourceTenants = state.tenants?.length ? state.tenants : fallbackTenants;
  const packageFilter = activePackageFilter(state.tenantPackageFilter);
  const tenants = filterTenants(sourceTenants, state);
  const detailTenant = sourceTenants.find((tenant) => String(tenant.id) === String(state.selectedTenantDetailId)) || null;
  const pageSize = 10;
  const page = clampPage(state.tenantPage, tenants.length, pageSize);
  const visibleTenants = tenants.slice((page - 1) * pageSize, page * pageSize);
  const selected = new Set((state.selectedTenantIds || []).map(String));
  const active = sourceTenants.filter((tenant) => statusOf(tenant) === 'active' && !isTrialTenant(tenant)).length;
  const trial = sourceTenants.filter(isTrialTenant).length;
  const suspended = sourceTenants.filter((tenant) => statusOf(tenant) === 'suspended').length;
  const totalStores = sourceTenants.reduce((sum, tenant) => sum + Number(tenant.branches || 0), 0);

  return `
    <section class="tenants-page">
      <header class="tenants-heading">
        <div>
          <h1>Tenant</h1>
          <p>Quản lý toàn bộ doanh nghiệp đang sử dụng nền tảng POS.</p>
        </div>
        <div class="tenants-heading-actions">
          <button type="button" class="tenant-export-btn" data-action="export-tenants"><i></i>Xuất dữ liệu</button>
          <button type="button" class="tenant-add-btn" data-action="open-create-tenant"><span></span>Thêm tenant</button>
        </div>
      </header>

      <section class="tenant-metrics">
        ${metricCard('Tổng tenant', sourceTenants.length, 'Tất cả doanh nghiệp', 'neutral')}
        ${metricCard('Đang hoạt động', active, 'Có thể sử dụng POS', 'success')}
        ${metricCard('Dùng thử', trial, 'PLUS-Trial', 'warning')}
        ${metricCard('Tạm ngưng', suspended, 'Đã khóa vận hành', 'danger')}
      </section>

      <section class="tenants-table-card">
        ${selected.size ? `
          <div class="bulk-action-bar">
            <strong>${esc(selected.size)} đã chọn</strong>
            <button type="button" data-action="bulk-tenant-status" data-status="active">Kích hoạt</button>
            <button type="button" data-action="bulk-tenant-status" data-status="suspended">Tạm ngưng</button>
            <button type="button" data-action="clear-tenant-selection">Bỏ chọn</button>
          </div>
        ` : ''}
        <div class="tenants-toolbar">
          <label class="tenant-search">
            <i></i>
            <input data-field="tenantSearch" value="${esc(state.tenantSearch || '')}" aria-label="Tìm tenant" placeholder="Tìm tên tenant hoặc mã..." />
          </label>
          <div class="tenant-filters">
            <select data-field="tenantPackageFilter" aria-label="Lọc gói tenant">
              <option value="all">Tất cả gói</option>
              ${packageOptions().map(({ value, label }) => `<option value="${esc(value)}" ${packageFilter === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}
            </select>
            <select data-field="tenantModeFilter" aria-label="Lọc mô hình tenant">
              <option value="all">Tất cả mô hình</option>
              ${uniqueOptions(sourceTenants.map((tenant) => tenant.operatingMode)).map((value) => `<option value="${esc(value)}" ${state.tenantModeFilter === value ? 'selected' : ''}>${esc(modeLabel(value))}</option>`).join('')}
            </select>
            <select data-field="tenantStatusFilter" aria-label="Lọc trạng thái tenant">
              <option value="all">Trạng thái: Tất cả</option>
              ${uniqueOptions(sourceTenants.map((tenant) => statusOf(tenant))).map((value) => `<option value="${esc(value)}" ${state.tenantStatusFilter === value ? 'selected' : ''}>${esc(statusLabel(value))}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="tenant-table">
          ${tableHeader(['', 'Tên tenant', 'Chủ sở hữu', 'Gói', 'Mô hình', 'Cửa hàng / Người dùng', 'Trạng thái', 'Gia hạn', 'Thao tác'])}
          ${visibleTenants.map((tenant) => renderTenantRow(tenant, selected)).join('') || '<div class="empty">Không có tenant phù hợp bộ lọc</div>'}
        </div>

        <div class="tenant-pagination">
          <span>Hiển thị ${tenants.length ? (page - 1) * pageSize + 1 : 0} đến ${Math.min(page * pageSize, tenants.length)} trong ${tenants.length || 0} mục</span>
          <div>
            ${paginationButtons(page, Math.max(1, Math.ceil(tenants.length / pageSize)), 'set-tenant-page')}
          </div>
        </div>
      </section>
    </section>
    ${detailTenant ? renderTenantDetailDrawer(detailTenant, state) : ''}
    ${state.showCreateTenant ? renderCreateTenantModal(state) : ''}
  `;
}

function filterTenants(tenants, state) {
  const query = String(state.tenantSearch || '').trim().toLowerCase();
  const packageFilter = activePackageFilter(state.tenantPackageFilter);
  return tenants.filter((tenant) => {
    const packageMatch = packageFilter === 'all' || normalizePackageTier(tenant.packageTier) === packageFilter;
    const modeMatch = state.tenantModeFilter === 'all' || !state.tenantModeFilter || tenant.operatingMode === state.tenantModeFilter;
    const statusMatch = state.tenantStatusFilter === 'all' || !state.tenantStatusFilter || tenantMatchesStatusFilter(tenant, state.tenantStatusFilter);
    const haystack = [tenant.id, tenant.name, tenant.ownerName, tenant.ownerEmail, tenant.packageTier, tenant.operatingMode].join(' ').toLowerCase();
    return packageMatch && modeMatch && statusMatch && (!query || haystack.includes(query));
  });
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).toLowerCase()))];
}

function renderCreateTenantModal(state) {
  const draft = state.tenantDraft || {};
  const packageTier = normalizePackageTier(draft.packageTier || 'trial');
  const packageSelectOptions = packageOptions().map((item) => `
    <option value="${esc(item.value)}" ${packageTier === item.value ? 'selected' : ''}>
      ${esc(item.label)}
    </option>
  `).join('');

  return `
    <div class="tenant-create-backdrop" data-action="close-create-tenant"></div>
    <section class="tenant-create-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-create-title">
      <header class="tenant-create-head">
        <div>
          <h2 id="tenant-create-title">Tạo tenant</h2>
          <p>Thêm doanh nghiệp trực tiếp mà không cần đi qua yêu cầu dùng thử.</p>
        </div>
        <button type="button" data-action="close-create-tenant" aria-label="Đóng form tạo tenant"></button>
      </header>

      <div class="tenant-create-form">
        <label class="tenant-create-field">
          <span>Tên tenant</span>
          <input data-field="tenantName" value="${esc(draft.name || '')}" placeholder="Tên doanh nghiệp" />
        </label>
        <label class="tenant-create-field">
          <span>Tên chủ sở hữu</span>
          <input data-field="tenantOwnerName" value="${esc(draft.ownerName || '')}" placeholder="Chủ sở hữu chính" />
        </label>
        <label class="tenant-create-field">
          <span>Email chủ sở hữu</span>
          <input data-field="tenantOwnerEmail" type="email" value="${esc(draft.ownerEmail || '')}" placeholder="owner@example.com" />
        </label>
        <label class="tenant-create-field">
          <span>Gói dịch vụ</span>
          <select data-field="tenantPackageTier">${packageSelectOptions}</select>
        </label>
        <label class="tenant-create-field">
          <span>Mô hình vận hành</span>
          <select data-field="tenantOperatingMode">
            <option value="simple" ${String(draft.operatingMode || 'simple') === 'simple' ? 'selected' : ''}>Đơn giản</option>
            <option value="restaurant" ${String(draft.operatingMode || '') === 'restaurant' ? 'selected' : ''}>Nhà hàng</option>
            <option value="retail" ${String(draft.operatingMode || '') === 'retail' ? 'selected' : ''}>Bán lẻ</option>
          </select>
        </label>
        <label class="tenant-create-field">
          <span>Trạng thái</span>
          <select data-field="tenantStatus">
            <option value="active" ${String(draft.status || 'active') === 'active' ? 'selected' : ''}>Đang hoạt động</option>
            <option value="trial" ${String(draft.status || '') === 'trial' ? 'selected' : ''}>Dùng thử</option>
            <option value="suspended" ${String(draft.status || '') === 'suspended' ? 'selected' : ''}>Tạm ngưng</option>
          </select>
        </label>
        <label class="tenant-create-field tenant-create-field-wide">
          <span>Ngày gia hạn</span>
          <input data-field="tenantRenewalDate" type="date" value="${esc(draft.renewalDate || '')}" />
        </label>
      </div>

      <footer class="tenant-create-actions">
        <button type="button" class="tenant-create-secondary" data-action="close-create-tenant">Hủy</button>
        <button type="button" class="tenant-create-primary" data-action="create-tenant">Tạo tenant</button>
      </footer>
    </section>
  `;
}

function renderTenantRow(tenant, selected) {
  const status = statusOf(tenant);
  const initials = tenantInitials(tenant.name);
  const branches = Number(tenant.branches || 0);
  const users = Number(tenant.users || 0);
  const nextActionLabel = status === 'active' ? 'Tạm ngưng' : 'Kích hoạt';

  return `
    <div class="tenant-table-row">
      <label class="tenant-check"><input type="checkbox" data-action="toggle-tenant-selection" data-id="${esc(tenant.id)}" ${selected.has(String(tenant.id)) ? 'checked' : ''} /></label>
      <button type="button" class="tenant-name-cell" data-action="select-tenant" data-id="${esc(tenant.id)}">
        <span>${esc(initials)}</span>
        <strong>${esc(tenant.name)}</strong>
        <small>${esc(tenantId(tenant.id))}</small>
      </button>
      <span class="tenant-owner">
        <strong>${esc(tenant.ownerName || tenant.owner || '-')}</strong>
        <small>${esc(tenant.ownerEmail || tenant.email || '-')}</small>
      </span>
      <span><b class="tenant-package ${esc(packageTone(tenant.packageTier))}">${esc(packageLabel(tenant.packageTier))}</b></span>
      <span class="tenant-mode">${esc(modeLabel(tenant.operatingMode))}</span>
      <span class="tenant-scale">
        <strong>${esc(branches)} / ${esc(users)}</strong>
        <small>${branches === 1 ? 'Cửa hàng' : 'Cửa hàng'}</small>
      </span>
      <span><b class="tenant-status ${esc(status)}">${esc(statusLabel(status))}</b></span>
      <span class="tenant-renewal ${String(tenant.renewalDate || '').toLowerCase() === 'overdue' ? 'overdue' : ''}">${esc(formatRenewal(tenant.renewalDate))}</span>
      <span class="tenant-actions">
        <b class="tenant-next-action ${status === 'active' ? 'danger' : 'success'}">${esc(nextActionLabel)}</b>
      </span>
    </div>
  `;
}

function renderTenantDetailDrawer(tenant, state) {
  const status = statusOf(tenant);
  const branches = Number(tenant.branches || 0);
  const users = Number(tenant.users || 0);
  const packageDraft = normalizePackageTier(state.packageDraft || tenant.packageTier);
  const modeDraft = state.modeDraft || tenant.operatingMode || 'simple';
  const overrides = state.packageOverrides || {};
  const nextActionLabel = status === 'active' ? 'Tạm ngưng tenant' : 'Kích hoạt tenant';

  return `
    <div class="tenant-detail-backdrop" data-action="close-tenant-detail"></div>
    <aside class="tenant-detail-drawer" role="dialog" aria-modal="true" aria-label="Chi tiết tenant">
      <header class="tenant-detail-head">
        <div class="tenant-detail-avatar">${esc(tenantInitials(tenant.name))}</div>
        <div>
          <p class="tenant-detail-eyebrow">Chi tiết tenant</p>
          <h2>${esc(tenant.name || '-')}</h2>
          <span>${esc(tenantId(tenant.id))} · ${esc(packageLabel(tenant.packageTier))} · ${esc(modeLabel(tenant.operatingMode))}</span>
        </div>
        <b class="tenant-status ${esc(status)}">${esc(statusLabel(status))}</b>
        <button type="button" class="tenant-detail-close" data-action="close-tenant-detail" aria-label="Đóng chi tiết tenant"></button>
      </header>

      <section class="tenant-detail-grid">
        ${detailItem('Chủ sở hữu', tenant.ownerName || tenant.owner || '-')}
        ${detailItem('Email chủ sở hữu', tenant.ownerEmail || tenant.email || '-')}
        ${detailItem('Cửa hàng', branches)}
        ${detailItem('Người dùng', users)}
        ${detailItem('Ngày gia hạn', formatRenewal(tenant.renewalDate))}
        ${detailItem('Trạng thái', statusLabel(status))}
      </section>

      <section class="tenant-detail-panel">
        <h3>Cấu hình gói</h3>
        <div class="tenant-detail-form">
          <label>
            <span>Gói dịch vụ</span>
            <select data-field="packageDraft">
              ${packageOptions().map((item) => `<option value="${esc(item.value)}" ${packageDraft === item.value ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}
            </select>
          </label>
          <label>
            <span>Mô hình vận hành</span>
            <select data-field="modeDraft">
              <option value="simple" ${modeDraft === 'simple' ? 'selected' : ''}>Đơn giản</option>
              <option value="restaurant" ${modeDraft === 'restaurant' ? 'selected' : ''}>Nhà hàng</option>
              <option value="retail" ${modeDraft === 'retail' ? 'selected' : ''}>Bán lẻ</option>
              <option value="chain" ${modeDraft === 'chain' ? 'selected' : ''}>Chuỗi</option>
            </select>
          </label>
          <label class="tenant-detail-check">
            <input type="checkbox" data-field="packageBetaAnalytics" ${overrides.betaAnalytics ? 'checked' : ''} />
            <span>Bật Beta Analytics</span>
          </label>
          <label class="tenant-detail-check">
            <input type="checkbox" data-field="packageWaiveSetupFee" ${overrides.waiveSetupFee !== false ? 'checked' : ''} />
            <span>Miễn phí thiết lập</span>
          </label>
        </div>
        ${state.packageMessage ? `<p class="tenant-detail-message">${esc(state.packageMessage)}</p>` : ''}
      </section>

      <section class="tenant-detail-panel">
        <h3>Thao tác nhanh</h3>
        <div class="tenant-detail-actions">
          <button type="button" class="primary" data-action="apply-package">Áp dụng cấu hình</button>
          <button type="button" data-action="create-order">Tạo đơn gia hạn</button>
          <button type="button" class="${status === 'active' ? 'danger' : 'success'}" data-action="toggle-status" data-id="${esc(tenant.id)}">${esc(nextActionLabel)}</button>
        </div>
      </section>
    </aside>
  `;
}

function detailItem(label, value) {
  return `
    <div class="tenant-detail-item">
      <span>${esc(label)}</span>
      <strong>${esc(value ?? '-')}</strong>
    </div>
  `;
}

function clampPage(value, total, pageSize) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, Number(value || 1)), max);
}

function paginationButtons(page, totalPages, action) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  const output = [`<button type="button" data-action="${action}" data-page="${Math.max(1, page - 1)}" ${page === 1 ? 'disabled' : ''}>Trước</button>`];
  let previous = 0;
  pages.forEach((item) => {
    if (previous && item - previous > 1) output.push('<button type="button" disabled>...</button>');
    output.push(`<button type="button" data-action="${action}" data-page="${item}" class="${item === page ? 'active' : ''}">${item}</button>`);
    previous = item;
  });
  output.push(`<button type="button" data-action="${action}" data-page="${Math.min(totalPages, page + 1)}" ${page === totalPages ? 'disabled' : ''}>Sau</button>`);
  return output.join('');
}

function metricCard(label, value, change, tone) {
  return `
    <article class="tenant-metric ${tone}">
      <span>${esc(label)}</span>
      <strong>${Number(value || 0).toLocaleString('vi-VN')}</strong>
      <small>${esc(change)}</small>
    </article>
  `;
}

function tableHeader(items) {
  return `<div class="tenant-table-head">${items.map((item, index) => `<span>${index === 0 ? '<input type="checkbox" data-action="toggle-all-tenants" aria-label="Chọn tenant đang hiển thị" />' : esc(item)}</span>`).join('')}</div>`;
}

function tenantId(id) {
  return `TN-${String(id || '0000').padStart(4, '0').slice(-4)}`;
}

function tenantInitials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'TN';
}

function statusOf(tenant) {
  return String(tenant.status || 'active').toLowerCase();
}

function isTrialTenant(tenant) {
  return statusOf(tenant) === 'trial' || normalizePackageTier(tenant.packageTier) === 'trial';
}

function tenantMatchesStatusFilter(tenant, filter) {
  const status = String(filter || '').toLowerCase();
  if (status === 'trial') return isTrialTenant(tenant);
  if (status === 'active') return statusOf(tenant) === 'active' && !isTrialTenant(tenant);
  return statusOf(tenant) === status;
}

function statusLabel(value) {
  if (value === 'trial') return 'Dùng thử';
  return value === 'suspended' ? 'Tạm ngưng' : 'Đang hoạt động';
}

function packageOptions() {
  return [
    { value: 'trial', label: 'PLUS-Trial' },
    { value: 'plus', label: 'PLUS' },
    { value: 'pro', label: 'PRO' },
  ];
}

function activePackageFilter(value) {
  const filter = String(value || 'all').toLowerCase();
  return ['all', 'trial', 'plus', 'pro'].includes(filter) ? filter : 'all';
}

function normalizePackageTier(value) {
  const tier = String(value || '').toLowerCase();
  if (['trial', 'trial-plus', 'plus-trial'].includes(tier)) return 'trial';
  if (['plus', 'starter'].includes(tier)) return 'plus';
  if (['pro', 'restaurant', 'chain'].includes(tier)) return 'pro';
  return tier || 'trial';
}

function packageLabel(value) {
  const map = { pro: 'PRO', plus: 'PLUS', trial: 'PLUS-Trial' };
  return map[normalizePackageTier(value)] || String(value || '-').toUpperCase();
}

function packageTone(value) {
  const tier = normalizePackageTier(value);
  if (tier === 'pro') return 'pro';
  if (tier === 'plus') return 'plus';
  return 'trial';
}

function modeLabel(value) {
  const mode = String(value || '').toLowerCase();
  if (mode === 'restaurant') return 'Nhà hàng';
  if (mode === 'retail') return 'Bán lẻ';
  if (mode === 'simple') return 'Đơn giản';
  if (mode === 'chain') return 'Chuỗi';
  return mode ? mode[0].toUpperCase() + mode.slice(1) : '-';
}

function formatRenewal(value) {
  if (!value) return '-';
  if (String(value).toLowerCase() === 'overdue') return 'Quá hạn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
