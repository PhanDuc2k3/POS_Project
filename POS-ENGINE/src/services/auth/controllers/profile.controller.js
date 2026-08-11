/**
 * Profile Controller - HTTP handlers: me, profile update, avatar, security question
 */

const profileService = require('../services/profile.service');

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.ip
    || req.connection?.remoteAddress
    || 'unknown';
}

function getUserFromHeaders(req) {
  return {
    id: parseInt(req.headers['x-user-id']),
    role: req.headers['x-user-role'],
    username: req.headers['x-user-name'],
  };
}

function getMe(req, res) {
  const user = getUserFromHeaders(req);
  const result = profileService.getProfile(user.id);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
}

function updateProfile(req, res) {
  const user = getUserFromHeaders(req);
  const { displayName, email } = req.body;
  const ip = getClientIP(req);
  const result = profileService.updateProfile(user.id, { displayName, email }, ip);
  res.json(result);
}

function setSecurityQuestion(req, res) {
  const user = getUserFromHeaders(req);
  const { question, answer, currentPassword } = req.body;
  const ip = getClientIP(req);

  const result = profileService.setSecurityQuestion(user.id, { question, answer, currentPassword }, ip);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result);
}

function uploadAvatar(req, res) {
  const user = getUserFromHeaders(req);
  const { avatar } = req.body;
  const ip = getClientIP(req);

  const result = profileService.uploadAvatar(user.id, avatar, ip);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
}

function deleteAvatar(req, res) {
  const user = getUserFromHeaders(req);
  const result = profileService.deleteAvatar(user.id);
  res.json(result);
}

module.exports = {
  getMe,
  updateProfile,
  setSecurityQuestion,
  uploadAvatar,
  deleteAvatar,
};
