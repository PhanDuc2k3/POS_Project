import { esc } from '../utils/format.js';

export function renderLoginPage(state) {
  if (state.authMode === 'forgot') return renderForgotPassword(state);
  if (state.authMode === 'activate') return renderActivation(state);
  return `
    <div class="login-shell">
      <section class="login-card">
        <p class="eyebrow">Chủ nền tảng</p>
        <h1>POS Admin</h1>
        <p class="login-copy">Đăng nhập để quản lý tenant, gói dịch vụ, đơn hàng và phân quyền.</p>
        <label class="field">
          <span>Tên đăng nhập</span>
          <input data-field="username" value="${esc(state.username || '')}" autocomplete="username" />
        </label>
        <label class="field">
          <span>Mật khẩu</span>
          <input data-field="password" type="password" value="${esc(state.password || '')}" autocomplete="current-password" />
        </label>
        <label class="check-row">
          <input data-field="rememberMe" type="checkbox" ${state.rememberMe !== false ? 'checked' : ''} />
          <span>Duy trì đăng nhập</span>
        </label>
        <button class="btn login-btn" data-action="login">Đăng nhập</button>
        <div class="auth-switch-row">
          <button type="button" data-action="set-auth-mode" data-mode="forgot">Quên mật khẩu</button>
          <button type="button" data-action="set-auth-mode" data-mode="activate">Kích hoạt tài khoản</button>
        </div>
        <p class="muted login-hint">Tài khoản demo: <strong>platform / platform123</strong></p>
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
        <p class="eyebrow">Khôi phục tài khoản</p>
        <h1>Đặt lại mật khẩu</h1>
        <p class="login-copy">Trả lời câu hỏi bảo mật, sau đó đặt mật khẩu mới.</p>
        <label class="field">
          <span>Tên đăng nhập</span>
          <input data-field="resetUsername" value="${esc(draft.username || '')}" autocomplete="username" />
        </label>
        <button class="btn login-btn" data-action="forgot-question">Tải câu hỏi</button>
        ${draft.question ? `
          <label class="field">
            <span>Câu hỏi bảo mật</span>
            <input value="${esc(draft.question)}" readonly />
          </label>
          <label class="field">
            <span>Câu trả lời</span>
            <input data-field="resetAnswer" value="${esc(draft.answer || '')}" />
          </label>
          <button class="btn login-btn" data-action="forgot-verify">Xác minh câu trả lời</button>
        ` : ''}
        ${draft.resetToken ? `
          <label class="field">
            <span>Mật khẩu mới</span>
            <input data-field="resetNewPassword" type="password" value="${esc(draft.newPassword || '')}" autocomplete="new-password" />
          </label>
          <label class="field">
            <span>Xác nhận mật khẩu</span>
            <input data-field="resetConfirmPassword" type="password" value="${esc(draft.confirmPassword || '')}" autocomplete="new-password" />
          </label>
          <button class="btn login-btn" data-action="forgot-reset">Đặt lại mật khẩu</button>
        ` : ''}
        <div class="auth-switch-row">
          <button type="button" data-action="set-auth-mode" data-mode="login">Quay lại đăng nhập</button>
          <button type="button" data-action="set-auth-mode" data-mode="activate">Kích hoạt tài khoản</button>
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
        <p class="eyebrow">Kích hoạt tài khoản</p>
        <h1>Kích hoạt tài khoản</h1>
        <p class="login-copy">Dán mã kích hoạt trong thư mời và tạo mật khẩu.</p>
        <label class="field">
          <span>Mã kích hoạt</span>
          <input data-field="activationToken" value="${esc(draft.activationToken || '')}" />
        </label>
        <label class="field">
          <span>Mật khẩu mới</span>
          <input data-field="activationNewPassword" type="password" value="${esc(draft.newPassword || '')}" autocomplete="new-password" />
        </label>
        <label class="field">
          <span>Xác nhận mật khẩu</span>
          <input data-field="activationConfirmPassword" type="password" value="${esc(draft.confirmPassword || '')}" autocomplete="new-password" />
        </label>
        <button class="btn login-btn" data-action="activate-account">Kích hoạt tài khoản</button>
        <div class="auth-switch-row">
          <button type="button" data-action="set-auth-mode" data-mode="login">Quay lại đăng nhập</button>
          <button type="button" data-action="set-auth-mode" data-mode="forgot">Quên mật khẩu</button>
        </div>
        ${state.authMessage ? `<p class="login-success">${esc(state.authMessage)}</p>` : ''}
        ${state.error ? `<p class="login-error">${esc(state.error)}</p>` : ''}
      </section>
    </div>
  `;
}
