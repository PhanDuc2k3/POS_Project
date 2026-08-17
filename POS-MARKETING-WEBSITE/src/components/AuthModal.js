export function renderAuthModal(state = {}) {
  if (!state.authModalOpen) return '';

  const mode = state.authMode === 'signup' ? 'signup' : 'signin';
  const isSignup = mode === 'signup';

  return `
    <div class="modal-backdrop" data-action="close-auth">
      <section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button class="modal-close" type="button" aria-label="Đóng" data-action="close-auth">×</button>
        <form class="auth-panel" data-form="${isSignup ? 'signup' : 'signin'}">
          <h2 id="auth-modal-title">${isSignup ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}</h2>
          <div class="social-auth">
            <button class="social-button google" type="button" data-action="demo-social">
              <span>G</span>
              ${isSignup ? 'Đăng ký google' : 'Đăng nhập google'}
            </button>
            <button class="social-button facebook" type="button" data-action="demo-social">
              <span>f</span>
              ${isSignup ? 'Đăng ký facebook' : 'Đăng nhập facebook'}
            </button>
          </div>
          <div class="auth-divider"><span>Hoặc tài khoản</span></div>
          ${isSignup ? `
            <input name="name" placeholder="Họ tên" autocomplete="name" required />
            <input name="email" type="email" placeholder="Email" autocomplete="email" required />
            <input name="password" type="password" placeholder="Mật khẩu" autocomplete="new-password" required />
          ` : `
            <input name="username" placeholder="Tài khoản" autocomplete="username" required />
            <input name="password" type="password" placeholder="Mật khẩu" autocomplete="current-password" required />
            <button class="forgot-link" type="button" data-action="demo-forgot">Quên mật khẩu ?</button>
          `}
          <button class="auth-submit" type="submit">${isSignup ? 'Đăng ký' : 'Đăng nhập'}</button>
          <p class="form-message" role="status"></p>
          <button class="auth-switch" type="button" data-action="switch-auth" data-auth-mode="${isSignup ? 'signin' : 'signup'}">
            ${isSignup ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ NGAY'}
          </button>
        </form>
      </section>
    </div>
  `;
}
