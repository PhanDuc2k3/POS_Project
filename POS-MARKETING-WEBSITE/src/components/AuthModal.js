import { renderIcon } from '../shared/icons.js';

export function renderAuthModal(state = {}) {
  if (!state.authModalOpen) return '';

  const mode = state.authMode === 'signup' ? 'signup' : 'signin';
  const isSignup = mode === 'signup';

  return `
    <div class="modal-backdrop">
      <section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button class="modal-close" type="button" aria-label="Dong" data-action="close-auth">${renderIcon('x')}</button>
        <form class="auth-panel" data-form="${isSignup ? 'signup' : 'signin'}">
          <h2 id="auth-modal-title">${isSignup ? 'DANG KY' : 'DANG NHAP'}</h2>
          <div class="auth-divider"><span>Tai khoan marketing</span></div>
          ${isSignup ? `
            <input name="name" placeholder="Ho ten" autocomplete="name" required />
            <input name="email" type="email" placeholder="Email" autocomplete="email" required />
            <input name="password" type="password" placeholder="Mat khau" autocomplete="new-password" minlength="6" required />
            <input name="confirmPassword" type="password" placeholder="Nhap lai mat khau" autocomplete="new-password" minlength="6" required />
          ` : `
            <input name="email" type="email" placeholder="Email" autocomplete="email" required />
            <input name="password" type="password" placeholder="Mat khau" autocomplete="current-password" required />
          `}
          <button class="auth-submit" type="submit">${isSignup ? 'Dang ky' : 'Dang nhap'}</button>
          <p class="form-message" role="status"></p>
          <button class="auth-switch" type="button" data-action="switch-auth" data-auth-mode="${isSignup ? 'signin' : 'signup'}">
            ${isSignup ? 'Da co tai khoan? Dang nhap' : 'Chua co tai khoan? Dang ky'}
          </button>
        </form>
      </section>
    </div>
  `;
}
