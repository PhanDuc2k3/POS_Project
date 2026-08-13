import { esc } from '../shared/format.js';

export function renderTopbar(state) {
  return `
    <div class="topbar">
      <div class="brand">
        <strong>Customer Order App</strong>
        <span>Store ${esc(state.storeId)} - restaurant mode</span>
      </div>
    </div>
  `;
}
