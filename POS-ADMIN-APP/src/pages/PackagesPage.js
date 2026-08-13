import { esc, money } from '../utils/format.js';
import { packageCatalog } from '../data/platform.js';

export function renderPackagesPage(state, helpers) {
  const tenant = helpers.selectedTenant();
  return `
    <div class="two-column">
      <section class="panel">
        <div class="panel-head">
          <h2>Package catalog</h2>
        </div>
        <div class="package-grid">
          ${packageCatalog.map((pkg) => `
            <article class="package-card ${tenant.packageTier === pkg.id ? 'active' : ''}">
              <div class="package-title">
                <strong>${esc(pkg.name)}</strong>
                <span>${esc(pkg.level)}</span>
              </div>
              <p>${money(pkg.price)} VND / month</p>
              <ul>${pkg.modules.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Assign package</h2>
          <span class="muted">${esc(tenant.name)}</span>
        </div>
        <div class="panel-body">
          <label class="field">
            <span>Package tier</span>
            <select data-field="packageDraft">
              ${packageCatalog.map((pkg) => `<option value="${pkg.id}" ${state.packageDraft === pkg.id ? 'selected' : ''}>${esc(pkg.name)}</option>`).join('')}
            </select>
          </label>
          <label class="field">
            <span>Operating mode</span>
            <select data-field="modeDraft">
              <option value="simple" ${state.modeDraft === 'simple' ? 'selected' : ''}>simple</option>
              <option value="restaurant" ${state.modeDraft === 'restaurant' ? 'selected' : ''}>restaurant</option>
            </select>
          </label>
          <div class="action-bar">
            <button class="btn" data-action="apply-package">Apply to tenant</button>
            <button class="btn soft" data-action="create-order">Create order</button>
          </div>
        </div>
      </section>
    </div>
  `;
}
