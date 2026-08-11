/**
 * Request helpers - Extract common data from HTTP requests
 * Shared across all controllers in this service.
 */

/**
 * Get real client IP from proxy headers
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.ip
    || req.connection?.remoteAddress
    || 'unknown';
}

/**
 * Get authenticated user context (injected by gateway)
 */
function getUserFromHeaders(req) {
  return {
    id: parseInt(req.headers['x-user-id']),
    role: req.headers['x-user-role'],
    username: req.headers['x-user-name'],
  };
}

module.exports = { getClientIP, getUserFromHeaders };
