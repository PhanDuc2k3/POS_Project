/**
 * Auth Service - Business logic: login, refresh, logout
 *
 * Refresh token rotation:
 *  - Mỗi lần refresh → cấp refresh token MỚI, mark token CŨ là đã dùng
 *  - Nếu token cũ bị dùng LẦN NỮA → reuse detected → thu hồi toàn bộ session của user đó
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../../../shared/config');
const sharedJwt = require('../../../shared/jwt');
const { publish } = require('../../../shared/event-bus');
const { parseUserAgent } = require('../user-agent-parser');
const userRepo = require('../repositories/user.repo');
const sessionRepo = require('../repositories/session.repo');
const loginAttemptRepo = require('../repositories/login-attempt.repo');
const auditRepo = require('../repositories/audit.repo');

function generateAccessToken(user) {
  return sharedJwt.generateAccessToken(user).token;
}

function generateRefreshToken(user, rememberMe = false) {
  return sharedJwt.generateRefreshToken(user, rememberMe);
}

function checkRateLimit(ip) {
  const windowStart = new Date(Date.now() - config.LOGIN_WINDOW_MS).toISOString();
  const attempts = loginAttemptRepo.countFailedAttempts(ip, windowStart);

  if (attempts >= config.LOGIN_MAX_ATTEMPTS) {
    const lastTime = loginAttemptRepo.getLastFailedAttemptTime(ip);
    if (lastTime) {
      const lockoutEnd = new Date(lastTime).getTime() + config.LOGIN_LOCKOUT_MS;
      if (Date.now() < lockoutEnd) {
        const remainingMin = Math.ceil((lockoutEnd - Date.now()) / 60000);
        return { blocked: true, remainingMin, attempts };
      }
    }
  }

  return { blocked: false, attempts };
}

function login({ username, password, clientDeviceInfo, rememberMe, ip, userAgentString }) {
  if (!username || !password) {
    return { error: 'Vui lòng nhập tên đăng nhập và mật khẩu', status: 400 };
  }

  // Rate limit check
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    return {
      error: `Quá nhiều lần thử. Vui lòng đợi ${rateCheck.remainingMin} phút.`,
      retryAfter: rateCheck.remainingMin,
      status: 429,
    };
  }

  const user = userRepo.findByUsername(username);
  if (!user) {
    loginAttemptRepo.record(ip, username, false);
    return { error: 'Tên đăng nhập hoặc mật khẩu không đúng', status: 401 };
  }

  if (!user.isActive) {
    return { error: 'Tài khoản đã bị khóa', status: 403 };
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    loginAttemptRepo.record(ip, username, false);
    auditRepo.create(user.id, 'LOGIN_FAILED', 'Wrong password', ip);
    const remaining = config.LOGIN_MAX_ATTEMPTS - rateCheck.attempts - 1;
    return {
      error: 'Tên đăng nhập hoặc mật khẩu không đúng',
      attemptsRemaining: remaining > 0 ? remaining : 0,
      status: 401,
    };
  }

  // Success
  loginAttemptRepo.record(ip, username, true);

  const accessToken = generateAccessToken(user);
  const useRememberMe = !!rememberMe;
  const refreshTokenData = generateRefreshToken(user, useRememberMe);
  const refreshToken = refreshTokenData.token;
  const refreshJti = refreshTokenData.jti;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiryMs = useRememberMe ? config.REMEMBER_ME_EXPIRY_MS : config.REFRESH_TOKEN_EXPIRY_MS;
  const expiresAt = new Date(Date.now() + expiryMs).toISOString();

  const uaParsed = parseUserAgent(userAgentString);
  const clientType = clientDeviceInfo?.clientType === 'pos_app' ? 'pos_app' : 'portal';
  const deviceInfo = {
    ...uaParsed,
    clientType,
    deviceId: clientDeviceInfo?.deviceId || null,
    deviceName: clientDeviceInfo?.deviceName || uaParsed.deviceName,
    deviceType: clientType === 'pos_app' ? 'pos' : uaParsed.deviceType,
    browser: clientType === 'pos_app' ? 'POS App' : uaParsed.browser,
    screenResolution: clientDeviceInfo?.screenResolution || null,
  };

  sessionRepo.upsert(user.id, tokenHash, ip, deviceInfo, expiresAt, useRememberMe, refreshJti);
  userRepo.updateLastLogin(user.id);

  auditRepo.create(user.id, 'LOGIN_SUCCESS', `${deviceInfo.deviceName} [${deviceInfo.deviceId || 'no-id'}] (${ip})`, ip);
  publish('user.loggedIn', { key: String(user.id), userId: user.id, username: user.username });

  return {
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id, username: user.username, displayName: user.displayName,
        email: user.email, role: user.role, avatar: user.avatar,
      },
    },
  };
}

function refresh(refreshTokenStr) {
  if (!refreshTokenStr) {
    return { error: 'Refresh token required', status: 400 };
  }

  const verification = sharedJwt.verifyRefreshToken(refreshTokenStr);
  if (!verification.valid) {
    return { error: verification.expired ? 'Refresh token expired' : 'Invalid refresh token', status: 401 };
  }
  const payload = verification.payload;
  const newJti = payload.jti;

  // Detect reuse: nếu jti này đã được sử dụng trước đó → token bị đánh cắp
  const usage = sharedJwt.markRefreshTokenUsed(newJti);
  if (usage.reused) {
    console.warn(`[Auth] SECURITY: Refresh token reuse detected for user ${payload.id}. Revoking all sessions.`);
    auditRepo.create(payload.id, 'REFRESH_REUSE_DETECTED', 'Possible token theft - all sessions revoked', null);
    sessionRepo.deleteAllByUserId(payload.id);
    return { error: 'Refresh token reuse detected. Please login again.', status: 401, code: 'REFRESH_REUSE' };
  }

  const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
  const session = sessionRepo.findByTokenHash(tokenHash);

  if (!session) {
    return { error: 'Refresh token revoked or expired', status: 401 };
  }

  const user = userRepo.findById(payload.id);
  if (!user) {
    return { error: 'User not found', status: 401 };
  }

  if (!user.isActive) {
    return { error: 'Tài khoản đã bị khóa', status: 403 };
  }

  const isTrusted = session.isTrusted;
  const newAccessToken = generateAccessToken(user);
  const newRefreshData = sharedJwt.generateRefreshToken(user, !!isTrusted);
  const newRefreshToken = newRefreshData.token;
  const newRefreshJti = newRefreshData.jti;
  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const expiryMs = isTrusted ? config.REMEMBER_ME_EXPIRY_MS : config.REFRESH_TOKEN_EXPIRY_MS;
  const expiresAt = new Date(Date.now() + expiryMs).toISOString();

  // Đánh dấu jti mới đã dùng (chính là lúc này) để reuse detection hoạt động
  // (không cần - mark ở đầu hàm đã đủ cho next refresh)

  sessionRepo.updateToken(session.id, newHash, expiresAt, newRefreshJti);

  return {
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email, role: user.role, avatar: user.avatar },
    },
  };
}

function logout(userId, refreshTokenStr, ip) {
  if (refreshTokenStr) {
    const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    sessionRepo.deleteByTokenHash(tokenHash);
  }
  auditRepo.create(userId, 'LOGOUT', null, ip);
  return { message: 'Đăng xuất thành công' };
}

function logoutAll(userId, ip) {
  sessionRepo.deleteAllByUserId(userId);
  auditRepo.create(userId, 'LOGOUT_ALL', 'All sessions revoked', ip);
  return { message: 'Đã đăng xuất tất cả thiết bị' };
}

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
};
