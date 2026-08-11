/**
 * Helpers for extracting data from gateway-forwarded request headers.
 */

function getUserFromHeaders(req) {
  return {
    id: parseInt(req.headers['x-user-id'], 10) || null,
    username: req.headers['x-user-name'] || null,
    role: req.headers['x-user-role'] || null,
  };
}

function getStoreIdFromHeaders(req) {
  // Gateway doesn't forward a specific store header from JWT payload by default.
  // For this service, storeId is sent either via query (?storeId=X) or body.
  // We prefer explicit body/query, else fall back to header supplied by gateway.
  const fromHeader = parseInt(req.headers['x-store-id'], 10);
  return Number.isFinite(fromHeader) ? fromHeader : null;
}

module.exports = { getUserFromHeaders, getStoreIdFromHeaders };
