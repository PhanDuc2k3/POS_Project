/**
 * Profile Service - Business logic: profile update, avatar, security question
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../../../shared/config');
const userRepo = require('../repositories/user.repo');
const auditRepo = require('../repositories/audit.repo');

function getProfile(userId) {
  const user = userRepo.findFullById(userId);
  if (!user) return { error: 'User not found', status: 404 };

  return {
    data: {
      id: user.id, username: user.username, displayName: user.displayName, email: user.email,
      role: user.role, avatar: user.avatar, hasSecurityQuestion: !!user.securityQuestion,
      securityQuestion: user.securityQuestion, lastLogin: user.lastLogin, createdAt: user.createdAt,
    },
  };
}

function updateProfile(userId, { displayName, email }, ip) {
  userRepo.updateProfile(userId, { displayName, email });
  auditRepo.create(userId, 'PROFILE_UPDATED', null, ip);
  return { message: 'Cập nhật thành công' };
}

function setSecurityQuestion(userId, { question, answer, currentPassword }, ip) {
  if (!question || !answer || !currentPassword) {
    return { error: 'Vui lòng nhập đầy đủ thông tin', status: 400 };
  }

  const passwordHash = userRepo.getPasswordHash(userId);
  if (!passwordHash) return { error: 'User not found', status: 404 };

  if (!bcrypt.compareSync(currentPassword, passwordHash)) {
    return { error: 'Mật khẩu không đúng', status: 401 };
  }

  const answerHash = bcrypt.hashSync(answer.toLowerCase().trim(), config.BCRYPT_ROUNDS);
  userRepo.updateSecurityQuestion(userId, question, answerHash);
  auditRepo.create(userId, 'SECURITY_QUESTION_SET', null, ip);
  return { message: 'Đã cập nhật câu hỏi bảo mật' };
}

function uploadAvatar(userId, avatar, ip) {
  if (!avatar) return { error: 'No avatar data', status: 400 };

  const match = avatar.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return { error: 'Invalid image format. Use PNG, JPEG or WebP.', status: 400 };

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const data = Buffer.from(match[2], 'base64');

  if (data.length > config.AVATAR_MAX_SIZE) {
    return { error: 'Ảnh quá lớn. Tối đa 2MB.', status: 400 };
  }

  const filename = `user_${userId}_${Date.now()}.${ext}`;
  const avatarDir = path.join(__dirname, '..', '..', '..', '..', 'uploads', 'avatars');
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

  // Delete old avatar
  const oldAvatar = userRepo.getAvatar(userId);
  if (oldAvatar) {
    const oldFile = path.join(avatarDir, path.basename(oldAvatar));
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }

  fs.writeFileSync(path.join(avatarDir, filename), data);
  const avatarUrl = `/uploads/avatars/${filename}`;

  userRepo.updateAvatar(userId, avatarUrl);
  auditRepo.create(userId, 'AVATAR_UPDATED', null, ip);

  return { data: { avatar: avatarUrl, message: 'Cập nhật ảnh đại diện thành công' } };
}

function deleteAvatar(userId) {
  const oldAvatar = userRepo.getAvatar(userId);
  if (oldAvatar) {
    const avatarDir = path.join(__dirname, '..', '..', '..', '..', 'uploads', 'avatars');
    const oldFile = path.join(avatarDir, path.basename(oldAvatar));
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }
  userRepo.removeAvatar(userId);
  return { message: 'Đã xóa ảnh đại diện' };
}

module.exports = {
  getProfile,
  updateProfile,
  setSecurityQuestion,
  uploadAvatar,
  deleteAvatar,
};
