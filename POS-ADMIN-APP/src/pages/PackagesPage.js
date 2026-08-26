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

const fallbackTenants = [
  { id: 'demo-plus', name: 'Công ty bán lẻ Global', packageTier: 'plus', operatingMode: 'simple' },
  { id: 'demo-pro', name: 'Cafe Metro', packageTier: 'pro', operatingMode: 'restaurant' },
];

export function renderPackagesPage(state, helpers) {
  const tenants = state.tenants?.length ? state.tenants : fallbackTenants;
  const tenant = helpers.selectedTenant() || tenants[0];
  const displayPackages = preferredPackages(state.packages?.length ? state.packages : packageCatalog);
  const selectedPackageIdRaw = state.packageDraft || tenant?.packageTier || 'plus';
  const selectedPackageId = displayPackages.some((pkg) => pkg.id === selectedPackageIdRaw)
    ? selectedPackageIdRaw
    : displayPackages[0]?.id || selectedPackageIdRaw;
  const selectedPackage = findPackage(selectedPackageId);
  const monthly = selectedPackage?.id === 'pro' ? '$499.00' : selectedPackage?.id === 'trial' ? '$0.00' : '$199.00';

  return `
    <section class="packages-page">
      <header class="packages-heading">
        <h1>Gói dịch vụ</h1>
        <p>Quản lý các hạng dịch vụ và gán gói cho tenant.</p>
      </header>

      <div class="packages-layout">
        <section class="package-catalog-area">
          <div class="package-section-title">
            <i class="section-icon catalog"></i>
            <h2>Danh mục gói nội bộ</h2>
          </div>

          <div class="package-catalog-grid">
            ${displayPackages.map((pkg) => renderPackageCard(pkg, selectedPackageId)).join('')}
          </div>

          <button type="button" class="comparison-toggle" data-action="toggle-package-comparison">
            <span>${state.showPackageComparison ? 'Ẩn bảng so sánh module chi tiết' : 'Xem bảng so sánh module chi tiết'}</span>
            <i></i>
          </button>

          ${state.showPackageComparison ? renderPackageComparison(displayPackages) : ''}
        </section>

        <aside class="assign-package-panel">
          <div class="assign-title">
            <i class="section-icon assign"></i>
            <h2>Gán gói</h2>
          </div>

          <label class="assign-field">
            <span>Chọn tenant</span>
            <select data-field="selectedTenantId">
              <option value="">Tìm hoặc chọn tenant...</option>
              ${tenants.map((item) => `
                <option value="${esc(item.id)}" ${String(tenant?.id) === String(item.id) ? 'selected' : ''}>${esc(item.name)}</option>
              `).join('')}
            </select>
          </label>

          <div class="assign-field">
            <span>Gói mục tiêu</span>
            <div class="target-package-stack">
              ${displayPackages.map((pkg) => renderPackageOption(pkg, selectedPackageId)).join('')}
            </div>
          </div>

          <div class="assign-field compact">
            <span>Ghi đè / Tiện ích thêm</span>
            <label class="check-line">
              <input type="checkbox" data-field="packageBetaAnalytics" ${state.packageOverrides?.betaAnalytics ? 'checked' : ''} />
              <span>Bao gồm quyền truy cập Beta Analytics</span>
            </label>
            <label class="check-line">
              <input type="checkbox" data-field="packageWaiveSetupFee" ${state.packageOverrides?.waiveSetupFee !== false ? 'checked' : ''} />
              <span>Miễn phí thiết lập ban đầu</span>
            </label>
          </div>

          <div class="package-override-summary">
            <span>Tóm tắt ghi đè</span>
            <strong>${esc(overrideSummary(state.packageOverrides))}</strong>
          </div>
          ${state.packageMessage ? `<p class="package-apply-message">${esc(state.packageMessage)}</p>` : ''}

          <div class="mrr-row">
            <span>Phí định kỳ hàng tháng mới</span>
            <strong>${esc(monthly)}</strong>
          </div>

          <button type="button" class="apply-package-btn" data-action="apply-package" data-package="${esc(selectedPackageId)}">
            <span></span>
            Áp dụng gói
          </button>
        </aside>
      </div>
    </section>
  `;
}

function renderPackageComparison(packages) {
  const modules = [...new Set(packages.flatMap((pkg) => {
    const ui = packageUi[pkg.id] || toPackageUi(pkg);
    return [...ui.included, ...ui.disabled];
  }))];

  return `
    <section class="package-comparison-card" style="--package-count: ${esc(packages.length)}">
      <div class="package-comparison-head">
        <span>Module</span>
        ${packages.map((pkg) => {
          const ui = packageUi[pkg.id] || toPackageUi(pkg);
          return `<span>${esc(ui.label)}</span>`;
        }).join('')}
      </div>
      ${modules.map((moduleName) => `
        <div class="package-comparison-row">
          <strong>${esc(moduleName)}</strong>
          ${packages.map((pkg) => {
            const ui = packageUi[pkg.id] || toPackageUi(pkg);
            const included = ui.included.includes(moduleName);
            return `<span class="${included ? 'included' : 'excluded'}">${included ? 'Bao gồm' : 'Không bao gồm'}</span>`;
          }).join('')}
        </div>
      `).join('')}
    </section>
  `;
}

function renderPackageCard(pkg, selectedPackageId) {
  const ui = packageUi[pkg.id] || toPackageUi(pkg);
  const active = selectedPackageId === pkg.id;

  return `
    <article class="catalog-package-card ${active ? 'active' : ''}">
      ${ui.ribbon ? `<b class="popular-ribbon">${esc(ui.ribbon)}</b>` : ''}
      <button type="button" class="package-card-picker" data-action="select-package" data-package="${esc(pkg.id)}" aria-label="Chọn gói ${esc(ui.label)}"></button>
      <div class="package-card-head">
        <div>
          <span class="tier-badge">${esc(ui.badge)}</span>
          <h3>${esc(ui.label)}</h3>
        </div>
        <strong>${esc(ui.price)}<small>${esc(ui.unit)}</small></strong>
      </div>

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

function renderPackageOption(pkg, selectedPackageId) {
  const ui = packageUi[pkg.id] || toPackageUi(pkg);
  const active = selectedPackageId === pkg.id;

  return `
    <label class="target-package-option ${active ? 'active' : ''}">
      <input type="radio" name="packageDraft" data-field="packageDraft" value="${esc(pkg.id)}" ${active ? 'checked' : ''} />
      <span>
        <strong>Gói ${esc(ui.label)}</strong>
        <small>${esc(ui.summary)}</small>
      </span>
      ${pkg.id === 'pro' ? '<b>NÂNG CẤP</b>' : ''}
    </label>
  `;
}

function preferredPackages(packages) {
  const order = ['trial', 'plus', 'pro'];
  const selected = order.map((id) => packages.find((pkg) => pkg.id === id)).filter(Boolean);
  const extra = packages.filter((pkg) => !order.includes(pkg.id));
  return selected.length ? [...selected, ...extra] : packages;
}

function overrideSummary(overrides = {}) {
  const items = [];
  if (overrides.betaAnalytics) items.push('Beta Analytics');
  if (overrides.waiveSetupFee !== false) items.push('Miễn phí thiết lập');
  return items.length ? items.join(' + ') : 'Chưa chọn ghi đè';
}

function findPackage(id) {
  return packageCatalog.find((pkg) => pkg.id === id) || packageCatalog[0];
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
