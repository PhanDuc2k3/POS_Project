/**
 * Password Controller - HTTP handlers: change-password, forgot-password flow
 */

const passwordService = require('../services/password.service');

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

function changePassword(req, res) {
  const user = getUserFromHeaders(req);
  const { currentPassword, newPassword } = req.body;
  const ip = getClientIP(req);

  const result = passwordService.changePassword(user.id, { currentPassword, newPassword }, ip);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result);
}

function getSecurityQuestion(req, res) {
  const { username } = req.body;
  const result = passwordService.getSecurityQuestion(username);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
}

function verifySecurityAnswer(req, res) {
  const { username, answer } = req.body;
  const ip = getClientIP(req);
  const result = passwordService.verifySecurityAnswer(username, answer, ip);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
}

function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;
  const ip = getClientIP(req);
  const result = passwordService.resetPassword(resetToken, newPassword, ip);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result);
}

module.exports = {
  changePassword,
  getSecurityQuestion,
  verifySecurityAnswer,
  resetPassword,
};
