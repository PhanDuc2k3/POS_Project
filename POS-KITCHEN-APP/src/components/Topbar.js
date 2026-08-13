import { esc } from '../shared/format.js';

export function renderTopbar(state) {
  return `
    <div class="topbar">
      <div class="brand">
        <strong>Kitchen App</strong>
        <span>Store ${esc(state.storeId)} - restaurant mode</span>
      </div>
      <label class="field store-field">
        <span>Store ID</span>
        <input data-field="storeId" value="${esc(state.storeId)}" />
      </label>
    </div>
  `;
}
