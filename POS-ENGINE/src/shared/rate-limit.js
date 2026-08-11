/**
 * Rate Limit Middleware (in-memory, per process)
 *
 * 2 tiers:
 *  - generalLimiter: mọi request qua gateway (300 req / 1 min / IP)
 *  - strictLimiter: cho login, forgot-password (10 req / 15 min / IP+endpoint)
 *
 * Lưu ý: in-memory nên nếu chạy multi-instance cần chuyển Redis.
 * Với single-process POS hiện tại thì đủ dùng.
 */

const config = require('./config');

// ─── In-memory store ─────────────────────────────────────────────────

const buckets = new Map();

function getKey(scope, identifier) {
  return `${scope}:${identifier}`;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.ip
    || req.connection?.remoteAddress
    || 'unknown';
}

function checkAndIncrement(scope, identifier, windowMs, maxRequests) {
  const now = Date.now();
  const key = getKey(scope, identifier);

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { windowStart: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count++;

  const remaining = Math.max(0, maxRequests - bucket.count);
  const resetIn = Math.ceil((bucket.windowStart + windowMs - now) / 1000);

  return {
    allowed: bucket.count <= maxRequests,
    count: bucket.count,
    limit: maxRequests,
    remaining,
    resetIn,
  };
}

// Cleanup mỗi 5 phút (tránh memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > 30 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

// ─── Middleware factories ─────────────────────────────────────────────

/**
 * Rate-limit tổng cho gateway.
 * Default: 300 requests / 1 minute / IP.
 */
function generalLimiter(req, res, next) {
  const ip = getClientIP(req);
  const windowMs = 60 * 1000;
  const max = parseInt(process.env.GATEWAY_RPM) || 300;

  const result = checkAndIncrement('general', ip, windowMs, max);

  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetIn);

  if (!result.allowed) {
    res.setHeader('Retry-After', result.resetIn);
    return res.status(429).json({
      error: 'Quá nhiều request. Vui lòng thử lại sau.',
      retryAfter: result.resetIn,
    });
  }
  next();
}

/**
 * Rate-limit nghiêm ngặt cho login / forgot-password.
 * Default: 10 attempts / 15 minutes / IP + endpoint.
 */
function strictLimiter(endpointName, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = getClientIP(req);
    const result = checkAndIncrement(`strict:${endpointName}`, ip, windowMs, maxAttempts);

    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.resetIn);
      return res.status(429).json({
        error: `Quá nhiều lần thử ${endpointName}. Vui lòng đợi ${Math.ceil(result.resetIn / 60)} phút.`,
        retryAfter: result.resetIn,
      });
    }
    next();
  };
}

// Backwards-compat export cho config nếu cần
module.exports = { generalLimiter, strictLimiter, getClientIP, _check: checkAndIncrement };