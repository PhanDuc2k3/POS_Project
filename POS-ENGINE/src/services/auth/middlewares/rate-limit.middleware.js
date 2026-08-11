/**
 * Rate Limit Middleware
 * Checks login attempts before processing request.
 * Used on the login route only.
 */

const config = require('../../../shared/config');
const loginAttemptRepo = require('../repositories/login-attempt.repo');
const { getClientIP } = require('../helpers/request.helper');

function rateLimitLogin(req, res, next) {
  const ip = getClientIP(req);
  const windowStart = new Date(Date.now() - config.LOGIN_WINDOW_MS).toISOString();
  const attempts = loginAttemptRepo.countFailedAttempts(ip, windowStart);

  if (attempts >= config.LOGIN_MAX_ATTEMPTS) {
    const lastTime = loginAttemptRepo.getLastFailedAttemptTime(ip);
    if (lastTime) {
      const lockoutEnd = new Date(lastTime).getTime() + config.LOGIN_LOCKOUT_MS;
      if (Date.now() < lockoutEnd) {
        const remainingMin = Math.ceil((lockoutEnd - Date.now()) / 60000);
        return res.status(429).json({
          error: `Quá nhiều lần thử. Vui lòng đợi ${remainingMin} phút.`,
          retryAfter: remainingMin,
        });
      }
    }
  }

  // Attach rate info to request for controller use
  req.rateInfo = { attempts };
  next();
}

module.exports = { rateLimitLogin };
