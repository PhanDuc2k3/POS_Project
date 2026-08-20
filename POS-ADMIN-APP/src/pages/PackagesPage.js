import { esc, money } from '../utils/format.js';
import { packageCatalog } from '../data/platform.js';

const packageUi = {
  plus: {
    label: 'PLUS',
    badge: 'Base Tier',
    price: '$199',
    unit: '/mo',
    summary: 'Downgrade warning: Will limit to 3 stores.',
    limits: [
      ['Store Limit', 'Up to 3'],
      ['Registers/Store', '5'],
    ],
    included: ['Core POS', 'Basic Reporting', 'Admin Portal'],
    disabled: ['Kitchen Display', 'Custom App'],
  },
  pro: {
    label: 'PRO',
    badge: 'Premium Tier',
    price: '$499',
    unit: '/mo',
    ribbon: 'Most Popular',
    summary: 'Includes all modules and unlimited stores.',
    limits: [
      ['Store Limit', 'Unlimited'],
      ['Registers/Store', 'Unlimited'],
    ],
    included: ['Core POS', 'Adv. Reporting', 'Admin Portal', 'Kitchen Display', 'Custom App'],
    disabled: [],
  },
  trial: {
    label: 'TRIAL',
    badge: 'Starter',
    price: '$0',
    unit: '/mo',
    summary: 'Trial access for onboarding and demos.',
    limits: [
      ['Store Limit', '1'],
      ['Registers/Store', '2'],
    ],
    included: ['Core POS', 'Demo Menu', 'Sales Report'],
    disabled: ['Kitchen Display', 'Custom App'],
  },
};

const fallbackTenants = [
  { id: 'demo-plus', name: 'Global Retail Inc.', packageTier: 'plus', operatingMode: 'simple' },
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
        <h1>Packages</h1>
        <p>Manage service tiers and assign plans to tenants.</p>
      </header>

      <div class="packages-layout">
        <section class="package-catalog-area">
          <div class="package-section-title">
            <i class="section-icon catalog"></i>
            <h2>Internal Package Catalog</h2>
          </div>

          <div class="package-catalog-grid">
            ${displayPackages.map((pkg) => renderPackageCard(pkg, selectedPackageId)).join('')}
          </div>

          <button type="button" class="comparison-toggle" data-action="toggle-package-comparison">
            <span>${state.showPackageComparison ? 'Hide Detailed Module Comparison matrix' : 'View Detailed Module Comparison matrix'}</span>
            <i></i>
          </button>

          ${state.showPackageComparison ? renderPackageComparison(displayPackages) : ''}
        </section>

        <aside class="assign-package-panel">
          <div class="assign-title">
            <i class="section-icon assign"></i>
            <h2>Assign Package</h2>
          </div>

          <label class="assign-field">
            <span>Select Tenant</span>
            <select data-field="selectedTenantId">
              <option value="">Search or select tenant...</option>
              ${tenants.map((item) => `
                <option value="${esc(item.id)}" ${String(tenant?.id) === String(item.id) ? 'selected' : ''}>${esc(item.name)}</option>
              `).join('')}
            </select>
          </label>

          <div class="assign-field">
            <span>Target Package</span>
            <div class="target-package-stack">
              ${displayPackages.map((pkg) => renderPackageOption(pkg, selectedPackageId)).join('')}
            </div>
          </div>

          <div class="assign-field compact">
            <span>Overrides / Add-ons</span>
            <label class="check-line">
              <input type="checkbox" data-field="packageBetaAnalytics" ${state.packageOverrides?.betaAnalytics ? 'checked' : ''} />
              <span>Include Beta Analytics Access</span>
            </label>
            <label class="check-line">
              <input type="checkbox" data-field="packageWaiveSetupFee" ${state.packageOverrides?.waiveSetupFee !== false ? 'checked' : ''} />
              <span>Waive initial setup fee</span>
            </label>
          </div>

          <div class="package-override-summary">
            <span>Override Summary</span>
            <strong>${esc(overrideSummary(state.packageOverrides))}</strong>
          </div>
          ${state.packageMessage ? `<p class="package-apply-message">${esc(state.packageMessage)}</p>` : ''}

          <div class="mrr-row">
            <span>New Monthly Recurrence</span>
            <strong>${esc(monthly)}</strong>
          </div>

          <button type="button" class="apply-package-btn" data-action="apply-package" data-package="${esc(selectedPackageId)}">
            <span></span>
            Apply Package
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
            return `<span class="${included ? 'included' : 'excluded'}">${included ? 'Included' : 'Not included'}</span>`;
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
      <button type="button" class="package-card-picker" data-action="select-package" data-package="${esc(pkg.id)}" aria-label="Select ${esc(ui.label)} package"></button>
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
        <span>Included Modules</span>
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
        <strong>${esc(ui.label)} Tier</strong>
        <small>${esc(ui.summary)}</small>
      </span>
      ${pkg.id === 'pro' ? '<b>UPGRADE</b>' : ''}
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
  if (overrides.waiveSetupFee !== false) items.push('Setup fee waived');
  return items.length ? items.join(' + ') : 'No overrides selected';
}

function findPackage(id) {
  return packageCatalog.find((pkg) => pkg.id === id) || packageCatalog[0];
}

function toPackageUi(pkg) {
  return {
    label: String(pkg.name || pkg.id).toUpperCase(),
    badge: pkg.level || 'Tier',
    price: money(pkg.price || 0),
    unit: ' VND/mo',
    summary: `${pkg.name || pkg.id} package`,
    limits: [['Store Limit', pkg.level || 'Managed']],
    included: pkg.modules || [],
    disabled: [],
  };
}
