/**
 * Password Service - Business logic: change password, forgot password flow
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../../../shared/config');
const { publish } = require('../../../shared/event-bus');
const userRepo = require('../repositories/user.repo');
const sessionRepo = require('../repositories/session.repo');
const passwordResetRepo = require('../repositories/password-reset.repo');
const auditRepo = require('../repositories/audit.repo');
const emailNotifications = require('./email-notification.service');

function changePassword(userId, { currentPassword, newPassword }, ip) {
  if (!currentPassword || !newPassword) {
    return { error: 'Vui lòng nhập đầy đủ thông tin', status: 400 };
  }
  if (newPassword.length < 6) {
    return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự', status: 400 };
  }

  const passwordHash = userRepo.getPasswordHash(userId);
  if (!passwordHash) return { error: 'User not found', status: 404 };

  if (!bcrypt.compareSync(currentPassword, passwordHash)) {
    auditRepo.create(userId, 'PASSWORD_CHANGE_FAILED', 'Wrong current password', ip);
    return { error: 'Mật khẩu hiện tại không đúng', status: 401 };
  }

  const newHash = bcrypt.hashSync(newPassword, config.BCRYPT_ROUNDS);
  userRepo.updatePassword(userId, newHash);
  sessionRepo.deleteAllByUserId(userId);
  auditRepo.create(userId, 'PASSWORD_CHANGED', null, ip);
  publish('user.passwordChanged', { key: String(userId), userId });
  return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
}

function getSecurityQuestion(username) {
  if (!username) {
    return { error: 'Vui lòng nhập tên đăng nhập', status: 400 };
  }

  const user = userRepo.findByUsernameForReset(username);
  if (!user || !user.securityQuestion) {
    return { error: 'Không tìm thấy tài khoản hoặc chưa thiết lập câu hỏi bảo mật', status: 404 };
  }

  return { data: { question: user.securityQuestion } };
}

function verifySecurityAnswer(username, answer, ip) {
  if (!username || !answer) {
    return { error: 'Vui lòng nhập đầy đủ thông tin', status: 400 };
  }

  const user = userRepo.findByUsernameForReset(username);
  if (!user) {
    return { error: 'Không tìm thấy tài khoản', status: 404 };
  }

  if (!user.securityAnswerHash || !bcrypt.compareSync(answer.toLowerCase().trim(), user.securityAnswerHash)) {
    auditRepo.create(user.id, 'RESET_VERIFY_FAILED', 'Wrong security answer', ip);
    return { error: 'Câu trả lời không đúng', status: 401 };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + config.RESET_TOKEN_EXPIRY_MS).toISOString();

  passwordResetRepo.create(user.id, resetHash, expiresAt);
  auditRepo.create(user.id, 'RESET_TOKEN_CREATED', null, ip);

  return { data: { resetToken, expiresIn: config.RESET_TOKEN_EXPIRY_MS / 60000 } };
}

function resetPassword(resetToken, newPassword, ip) {
  if (!resetToken || !newPassword) {
    return { error: 'Vui lòng nhập đầy đủ thông tin', status: 400 };
  }
  if (newPassword.length < 6) {
    return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự', status: 400 };
  }

  const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const reset = passwordResetRepo.findValidByTokenHash(resetHash);

  if (!reset) {
    return { error: 'Token không hợp lệ hoặc đã hết hạn', status: 401 };
  }

  const newHash = bcrypt.hashSync(newPassword, config.BCRYPT_ROUNDS);
  userRepo.updatePassword(reset.userId, newHash);
  passwordResetRepo.markUsed(reset.id);
  sessionRepo.deleteAllByUserId(reset.userId);
  auditRepo.create(reset.userId, 'PASSWORD_RESET', 'Via security question', ip);
  emailNotifications.notifyPasswordReset(userRepo.findById(reset.userId));

  return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
}

module.exports = {
  changePassword,
  getSecurityQuestion,
  verifySecurityAnswer,
  resetPassword,
};
