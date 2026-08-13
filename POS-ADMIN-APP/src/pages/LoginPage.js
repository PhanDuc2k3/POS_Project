import { esc } from '../utils/format.js';

export function renderLoginPage(state) {
  return `
    <div class="login-shell">
      <section class="login-card">
        <p class="eyebrow">Platform owner</p>
        <h1>POS Admin</h1>
        <p class="login-copy">Sign in to manage tenants, packages, orders, and permissions.</p>
        <label class="field">
          <span>Username</span>
          <input data-field="username" value="${esc(state.username || '')}" autocomplete="username" />
        </label>
        <label class="field">
          <span>Password</span>
          <input data-field="password" type="password" value="${esc(state.password || '')}" autocomplete="current-password" />
        </label>
        <label class="check-row">
          <input data-field="rememberMe" type="checkbox" ${state.rememberMe !== false ? 'checked' : ''} />
          <span>Keep me signed in</span>
        </label>
        <button class="btn login-btn" data-action="login">Sign in</button>
        <p class="muted login-hint">Demo account: <strong>platform / platform123</strong></p>
        ${state.error ? `<p class="login-error">${state.error}</p>` : ''}
      </section>
    </div>
  `;
}
