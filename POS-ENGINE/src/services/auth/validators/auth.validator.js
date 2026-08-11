/**
 * Auth Validators - Input validation for auth endpoints
 */

function validateLogin(body) {
  const { username, password } = body;
  if (!username || !password) {
    return { valid: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu' };
  }
  return { valid: true };
}

function validateChangePassword(body) {
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return { valid: false, error: 'Vui lòng nhập đầy đủ thông tin' };
  }
  if (newPassword.length < 6) {
    return { valid: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }
  return { valid: true };
}

function validateSecurityQuestion(body) {
  const { question, answer, currentPassword } = body;
  if (!question || !answer || !currentPassword) {
    return { valid: false, error: 'Vui lòng nhập đầy đủ thông tin' };
  }
  return { valid: true };
}

function validateForgotPasswordReset(body) {
  const { resetToken, newPassword } = body;
  if (!resetToken || !newPassword) {
    return { valid: false, error: 'Vui lòng nhập đầy đủ thông tin' };
  }
  if (newPassword.length < 6) {
    return { valid: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }
  return { valid: true };
}

function validateAvatar(body) {
  const { avatar } = body;
  if (!avatar) {
    return { valid: false, error: 'No avatar data' };
  }
  const match = avatar.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) {
    return { valid: false, error: 'Invalid image format. Use PNG, JPEG or WebP.' };
  }
  return { valid: true, ext: match[1] === 'jpeg' ? 'jpg' : match[1], data: match[2] };
}

module.exports = {
  validateLogin,
  validateChangePassword,
  validateSecurityQuestion,
  validateForgotPasswordReset,
  validateAvatar,
};
