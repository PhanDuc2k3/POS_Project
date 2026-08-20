import { esc } from '../utils/format.js';

export function renderLoginPage(state) {
  if (state.authMode === 'forgot') return renderForgotPassword(state);
  if (state.authMode === 'activate') return renderActivation(state);
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
        <div class="auth-switch-row">
          <button type="button" data-action="set-auth-mode" data-mode="forgot">Forgot password</button>
          <button type="button" data-action="set-auth-mode" data-mode="activate">Activate account</button>
        </div>
        <p class="muted login-hint">Demo account: <strong>platform / platform123</strong></p>
        ${state.authMessage ? `<p class="login-success">${esc(state.authMessage)}</p>` : ''}
        ${state.error ? `<p class="login-error">${esc(state.error)}</p>` : ''}
      </section>
    </div>
  `;
}

function renderForgotPassword(state) {
  const draft = state.resetDraft || {};
  return `
    <div class="login-shell">
      <section class="login-card">
        <p class="eyebrow">Account recovery</p>
        <h1>Reset Password</h1>
        <p class="login-copy">Answer your security question, then set a new password.</p>
        <label class="field">
          <span>Username</span>
          <input data-field="resetUsername" value="${esc(draft.username || '')}" autocomplete="username" />
        </label>
        <button class="btn login-btn" data-action="forgot-question">Load Question</button>
        ${draft.question ? `
          <label class="field">
            <span>Security Question</span>
            <input value="${esc(draft.question)}" readonly />
          </label>
          <label class="field">
            <span>Answer</span>
            <input data-field="resetAnswer" value="${esc(draft.answer || '')}" />
          </label>
          <button class="btn login-btn" data-action="forgot-verify">Verify Answer</button>
        ` : ''}
        ${draft.resetToken ? `
          <label class="field">
            <span>New Password</span>
            <input data-field="resetNewPassword" type="password" value="${esc(draft.newPassword || '')}" autocomplete="new-password" />
          </label>
          <label class="field">
            <span>Confirm Password</span>
            <input data-field="resetConfirmPassword" type="password" value="${esc(draft.confirmPassword || '')}" autocomplete="new-password" />
          </label>
          <button class="btn login-btn" data-action="forgot-reset">Reset Password</button>
        ` : ''}
        <div class="auth-switch-row">
          <button type="button" data-action="set-auth-mode" data-mode="login">Back to sign in</button>
          <button type="button" data-action="set-auth-mode" data-mode="activate">Activate account</button>
        </div>
        ${state.authMessage ? `<p class="login-success">${esc(state.authMessage)}</p>` : ''}
        ${state.error ? `<p class="login-error">${esc(state.error)}</p>` : ''}
      </section>
    </div>
  `;
}

function renderActivation(state) {
  const draft = state.activationDraft || {};
  return `
    <div class="login-shell">
      <section class="login-card">
        <p class="eyebrow">Account activation</p>
        <h1>Activate Account</h1>
        <p class="login-copy">Paste the activation token from your invitation and create a password.</p>
        <label class="field">
          <span>Activation Token</span>
          <input data-field="activationToken" value="${esc(draft.activationToken || '')}" />
        </label>
        <label class="field">
          <span>New Password</span>
          <input data-field="activationNewPassword" type="password" value="${esc(draft.newPassword || '')}" autocomplete="new-password" />
        </label>
        <label class="field">
          <span>Confirm Password</span>
          <input data-field="activationConfirmPassword" type="password" value="${esc(draft.confirmPassword || '')}" autocomplete="new-password" />
        </label>
        <button class="btn login-btn" data-action="activate-account">Activate Account</button>
        <div class="auth-switch-row">
          <button type="button" data-action="set-auth-mode" data-mode="login">Back to sign in</button>
          <button type="button" data-action="set-auth-mode" data-mode="forgot">Forgot password</button>
        </div>
        ${state.authMessage ? `<p class="login-success">${esc(state.authMessage)}</p>` : ''}
        ${state.error ? `<p class="login-error">${esc(state.error)}</p>` : ''}
      </section>
    </div>
  `;
}
