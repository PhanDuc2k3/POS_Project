import { esc, money } from '../utils/format.js';
import { packageCatalog } from '../data/platform.js';

const packageUi = {
  plus: {
    label: 'PLUS',
    badge: 'Gói cơ bản',
    price: '$199',
    unit: '/tháng',
    summary: 'Cảnh báo hạ gói: giới hạn còn 3 cửa hàng.',
    limits: [
      ['Giới hạn cửa hàng', 'Tối đa 3'],
      ['Máy POS/cửa hàng', '5'],
    ],
    included: ['POS lõi', 'Báo cáo cơ bản', 'Portal quản trị'],
    disabled: ['Màn hình bếp', 'Ứng dụng riêng'],
  },
  pro: {
    label: 'PRO',
    badge: 'Gói cao cấp',
    price: '$499',
    unit: '/tháng',
    ribbon: 'Phổ biến nhất',
    summary: 'Bao gồm tất cả module và không giới hạn cửa hàng.',
    limits: [
      ['Giới hạn cửa hàng', 'Không giới hạn'],
      ['Máy POS/cửa hàng', 'Không giới hạn'],
    ],
    included: ['POS lõi', 'Báo cáo nâng cao', 'Portal quản trị', 'Màn hình bếp', 'Ứng dụng riêng'],
    disabled: [],
  },
  trial: {
    label: 'TRIAL',
    badge: 'Dùng thử',
    price: '$0',
    unit: '/tháng',
    summary: 'Quyền dùng thử cho onboarding và demo.',
    limits: [
      ['Giới hạn cửa hàng', '1'],
      ['Máy POS/cửa hàng', '2'],
    ],
    included: ['POS lõi', 'Menu demo', 'Báo cáo bán hàng'],
    disabled: ['Màn hình bếp', 'Ứng dụng riêng'],
  },
};

export function renderPackagesPage(state, helpers) {
  const displayPackages = preferredPackages(state.packages?.length ? state.packages : packageCatalog);

  return `
    <section class="packages-page">
      <header class="packages-heading">
        <h1>Gói dịch vụ</h1>
        <p>Quản lý giá, mô tả và module của từng gói dịch vụ.</p>
      </header>

      <div class="packages-layout">
        <section class="package-catalog-area">
          <div class="package-section-title">
            <i class="section-icon catalog"></i>
            <h2>Danh mục gói nội bộ</h2>
          </div>

          <div class="package-catalog-grid">
            ${displayPackages.map((pkg) => renderPackageCard(pkg)).join('')}
          </div>

          <button type="button" class="comparison-toggle" data-action="toggle-package-comparison">
            <span>${state.showPackageComparison ? 'Ẩn bảng so sánh module chi tiết' : 'Xem bảng so sánh module chi tiết'}</span>
            <i></i>
          </button>

          ${state.showPackageComparison ? renderPackageComparison(displayPackages) : ''}
        </section>

      </div>
      ${state.packageEditDraft ? renderPackageEditModal(state.packageEditDraft) : ''}
    </section>
  `;
}

function renderPackageComparison(packages) {
  const modules = [...new Set(packages.flatMap((pkg) => {
    const ui = getPackageUi(pkg);
    return [...ui.included, ...ui.disabled];
  }))];

  return `
    <section class="package-comparison-card" style="--package-count: ${esc(packages.length)}">
      <div class="package-comparison-head">
        <span>Module</span>
        ${packages.map((pkg) => {
          const ui = getPackageUi(pkg);
          return `<span>${esc(ui.label)}</span>`;
        }).join('')}
      </div>
      ${modules.map((moduleName) => `
        <div class="package-comparison-row">
          <strong>${esc(moduleName)}</strong>
          ${packages.map((pkg) => {
            const ui = getPackageUi(pkg);
            const included = ui.included.includes(moduleName);
            return `<span class="${included ? 'included' : 'excluded'}">${included ? 'Bao gồm' : 'Không bao gồm'}</span>`;
          }).join('')}
        </div>
      `).join('')}
    </section>
  `;
}

function renderPackageCard(pkg) {
  const ui = getPackageUi(pkg);

  return `
    <article class="catalog-package-card">
      ${ui.ribbon ? `<b class="popular-ribbon">${esc(ui.ribbon)}</b>` : ''}
      <button type="button" class="package-card-picker" data-action="open-package-edit" data-package="${esc(pkg.id)}" aria-label="Chỉnh sửa gói ${esc(ui.label)}"></button>
      <div class="package-card-head">
        <div>
          <span class="tier-badge">${esc(ui.badge)}</span>
          <h3>${esc(ui.label)}</h3>
        </div>
        <strong>${esc(ui.price)}<small>${esc(ui.unit)}</small></strong>
      </div>

      <p class="package-description">${esc(ui.summary)}</p>

      <dl class="package-limits">
        ${ui.limits.map(([label, value]) => `
          <div>
            <dt><i></i>${esc(label)}</dt>
            <dd>${esc(value)}</dd>
          </div>
        `).join('')}
      </dl>

      <div class="module-list">
        <span>Module bao gồm</span>
        <div>
          ${ui.included.map((item) => `<em>${esc(item)}</em>`).join('')}
          ${ui.disabled.map((item) => `<em class="disabled">${esc(item)}</em>`).join('')}
        </div>
      </div>
    </article>
  `;
}

function renderPackageEditModal(draft) {
  return `
    <div class="package-edit-backdrop" data-action="close-package-edit"></div>
    <aside class="package-edit-modal" role="dialog" aria-modal="true" aria-label="Chỉnh sửa gói dịch vụ">
      <header class="package-edit-head">
        <div>
          <h2>Chỉnh sửa gói dịch vụ</h2>
          <p>${esc(draft.id || '')}</p>
        </div>
        <button type="button" data-action="close-package-edit" aria-label="Đóng"></button>
      </header>
      <div class="package-edit-form">
        <label class="package-edit-field">
          <span>Tên gói</span>
          <input data-field="packageEditName" value="${esc(draft.name || '')}" />
        </label>
        <label class="package-edit-field">
          <span>Cấp / giới hạn</span>
          <input data-field="packageEditLevel" value="${esc(draft.level || '')}" />
        </label>
        <label class="package-edit-field">
          <span>Giá hàng tháng</span>
          <input data-field="packageEditPrice" type="number" min="0" step="1000" value="${esc(draft.price ?? 0)}" />
        </label>
        <label class="package-edit-field">
          <span>Thứ tự hiển thị</span>
          <input data-field="packageEditSortOrder" type="number" step="1" value="${esc(draft.sortOrder ?? 0)}" />
        </label>
        <label class="package-edit-field package-edit-wide">
          <span>Mô tả</span>
          <textarea data-field="packageEditDescription" rows="3">${esc(draft.description || '')}</textarea>
        </label>
        <label class="package-edit-field package-edit-wide">
          <span>Modules</span>
          <textarea data-field="packageEditModules" rows="6">${esc(draft.modulesText || '')}</textarea>
        </label>
      </div>
      <div class="package-edit-actions">
        <button type="button" class="tenant-create-secondary" data-action="close-package-edit">Hủy</button>
        <button type="button" class="tenant-create-primary" data-action="save-package-edit">Lưu thay đổi</button>
      </div>
    </aside>
  `;
}

function preferredPackages(packages) {
  const order = ['trial', 'plus', 'pro'];
  const selected = order.map((id) => packages.find((pkg) => pkg.id === id)).filter(Boolean);
  const extra = packages.filter((pkg) => !order.includes(pkg.id));
  return selected.length ? [...selected, ...extra] : packages;
}

function getPackageUi(pkg) {
  const preset = packageUi[pkg.id] || {};
  const fallback = toPackageUi(pkg);
  const modules = Array.isArray(pkg.modules) ? pkg.modules : [];
  return {
    ...fallback,
    ...preset,
    label: pkg.name || preset.label || fallback.label,
    badge: pkg.level || preset.badge || fallback.badge,
    price: money(pkg.price || 0),
    unit: ' VND/tháng',
    summary: pkg.description || preset.summary || fallback.summary,
    limits: [
      ['Cấp / giới hạn', pkg.level || preset.badge || fallback.badge],
      ...(preset.limits || []).slice(1),
    ],
    included: modules.length ? modules : (preset.included || fallback.included),
    disabled: preset.disabled || fallback.disabled,
  };
}

function toPackageUi(pkg) {
  return {
    label: String(pkg.name || pkg.id).toUpperCase(),
    badge: pkg.level || 'Gói',
    price: money(pkg.price || 0),
    unit: ' VND/tháng',
    summary: `Gói ${pkg.name || pkg.id}`,
    limits: [['Giới hạn cửa hàng', pkg.level || 'Được quản lý']],
    included: pkg.modules || [],
    disabled: [],
  };
}
