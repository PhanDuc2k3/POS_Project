import { esc } from '../utils/format.js';
import { permissionCatalog, roleLabels } from '../data/platform.js';

export function renderPermissionsPage(state) {
  const role = state.permissionRole;
  const enabled = new Set(state.permissions[role] || []);
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Role permission matrix</h2>
        <label class="field role-picker">
          <span>Role</span>
          <select data-field="permissionRole">
            ${Object.keys(roleLabels).map((item) => `<option value="${item}" ${role === item ? 'selected' : ''}>${esc(roleLabels[item])}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="permission-grid">
        ${permissionCatalog.map((permission) => `
          <label class="permission-cell ${enabled.has(permission.id) ? 'enabled' : ''}">
            <input type="checkbox" data-action="toggle-permission" data-permission="${esc(permission.id)}" ${enabled.has(permission.id) ? 'checked' : ''} />
            <span>${esc(permission.label)}</span>
            <small>${esc(permission.id)}</small>
          </label>
        `).join('')}
      </div>
    </section>
  `;
}
