import { renderTopbar } from '../components/Topbar.js';
import { renderSessionList } from '../components/SessionList.js';
import { renderSessionDetail } from '../components/SessionDetail.js';
import { esc } from '../shared/format.js';

export function renderKitchenPage(state, session) {
  return `
    <div class="app-shell">
      ${renderTopbar(state)}
      <div class="layout kitchen">
        ${renderSessionList(state)}
        ${renderSessionDetail(session)}
      </div>
    </div>
    ${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ''}
  `;
}
