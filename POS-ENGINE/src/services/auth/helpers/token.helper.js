/**
 * Token helpers - JWT generation utilities
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../../shared/config');

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user, rememberMe = false) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    config.JWT_REFRESH_SECRET,
    { expiresIn: rememberMe ? config.REMEMBER_ME_EXPIRY : config.REFRESH_TOKEN_EXPIRY }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}

module.exports = { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken };
