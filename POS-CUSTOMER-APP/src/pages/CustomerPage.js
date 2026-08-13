import { renderTopbar } from '../components/Topbar.js';
import { renderMenuSection } from '../components/MenuSection.js';
import { renderSessionSection } from '../components/SessionSection.js';

export function renderCustomerPage(state, helpers) {
  const categories = [{ id: 'all', name: 'All' }, ...state.menu.categories];
  return `
    <div class="app-shell">
      ${renderTopbar(state)}
      <div class="layout customer">
        ${renderMenuSection(state, helpers.products, categories)}
        ${renderSessionSection(state, helpers.activeSession)}
      </div>
    </div>
    ${state.toast ? `<div class="toast">${helpers.esc(state.toast)}</div>` : ''}
  `;
}
