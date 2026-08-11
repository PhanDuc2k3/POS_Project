/**
 * Shared JWT helpers with rotation + reuse detection + blacklist
 *
 * - generateAccessToken / generateRefreshToken: same shape as before
 * - revokeAccessToken: thêm jti vào blacklist (in-memory, có thể upgrade Redis)
 * - isAccessTokenRevoked: kiểm tra token đã bị thu hồi chưa
 * - generateRefreshTokenWithJti: thêm jti để detect reuse
 * - markRefreshTokenUsed: lưu lại jti đã dùng → nếu thấy jti cũ bị dùng lại = token bị đánh cắp → revoke toàn bộ session
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./config');

// ─── In-memory stores (single-process) ───────────────────────────────

const accessTokenBlacklist = new Set(); // jti revoked cho đến khi hết hạn

// Refresh token đã dùng: jti → timestamp lần cuối dùng
// (để detect reuse = token bị đánh cắp)
const usedRefreshTokens = new Map();

// Cleanup mỗi 1 giờ
setInterval(() => {
  const now = Date.now();
  // Blacklist access: xóa những token đã hết hạn (ước lượng 1 ngày)
  for (const jti of accessTokenBlacklist) {
    if (!jti.startsWith(`${Math.floor(now / 86400000)}:`)) {
      // best-effort cleanup; jti có dạng `<random>` - không có timestamp nên giữ lại
    }
  }
  // Used refresh: xóa sau 30 ngày
  for (const [jti, ts] of usedRefreshTokens.entries()) {
    if (now - ts > 30 * 24 * 60 * 60 * 1000) usedRefreshTokens.delete(jti);
  }
}, 60 * 60 * 1000).unref?.();

// ─── Access tokens ───────────────────────────────────────────────────

function generateAccessToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, jti },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXPIRY }
  );
  return { token, jti };
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET);
    if (payload.jti && accessTokenBlacklist.has(payload.jti)) {
      return { revoked: true };
    }
    return { valid: true, payload };
  } catch (err) {
    if (err.name === 'TokenExpiredError') return { expired: true };
    return { invalid: true, error: err };
  }
}

function revokeAccessToken(jti) {
  if (jti) accessTokenBlacklist.add(jti);
}

function isAccessTokenRevoked(jti) {
  return jti ? accessTokenBlacklist.has(jti) : false;
}

// ─── Refresh tokens (với jti + reuse detection) ──────────────────────

function generateRefreshToken(user, rememberMe = false) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { id: user.id, type: 'refresh', jti },
    config.JWT_REFRESH_SECRET,
    { expiresIn: rememberMe ? config.REMEMBER_ME_EXPIRY : config.REFRESH_TOKEN_EXPIRY }
  );
  return { token, jti };
}

function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh') return { invalid: true };
    return { valid: true, payload };
  } catch (err) {
    if (err.name === 'TokenExpiredError') return { expired: true };
    return { invalid: true };
  }
}

/**
 * Đánh dấu refresh token đã được sử dụng.
 * Nếu jti đã có trong usedRefreshTokens → reuse detected.
 */
function markRefreshTokenUsed(jti) {
  if (!jti) return { firstUse: true };
  if (usedRefreshTokens.has(jti)) {
    return { firstUse: false, reused: true, lastUsed: usedRefreshTokens.get(jti) };
  }
  usedRefreshTokens.set(jti, Date.now());
  return { firstUse: true };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  revokeAccessToken,
  isAccessTokenRevoked,
  generateRefreshToken,
  verifyRefreshToken,
  markRefreshTokenUsed,
  hashToken,
  // Internal cho test/debug
  _blacklistSize: () => accessTokenBlacklist.size,
  _usedRefreshCount: () => usedRefreshTokens.size,
};