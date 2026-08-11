/**
 * Auth Controller - HTTP handlers: login, refresh, logout
 */

const authService = require('../services/auth.service');

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

function login(req, res) {
  const { username, password, deviceInfo: clientDeviceInfo, rememberMe } = req.body;
  const ip = getClientIP(req);

  const result = authService.login({
    username,
    password,
    clientDeviceInfo,
    rememberMe,
    ip,
    userAgentString: req.headers['user-agent'],
  });

  if (result.error) {
    const response = { error: result.error };
    if (result.retryAfter !== undefined) response.retryAfter = result.retryAfter;
    if (result.attemptsRemaining !== undefined) response.attemptsRemaining = result.attemptsRemaining;
    return res.status(result.status).json(response);
  }

  res.json(result.data);
}

function refresh(req, res) {
  const { refreshToken } = req.body;
  const result = authService.refresh(refreshToken);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
}

function logout(req, res) {
  const user = getUserFromHeaders(req);
  const { refreshToken } = req.body;
  const ip = getClientIP(req);
  const result = authService.logout(user.id, refreshToken, ip);
  res.json(result);
}

function logoutAll(req, res) {
  const user = getUserFromHeaders(req);
  const ip = getClientIP(req);
  const result = authService.logoutAll(user.id, ip);
  res.json(result);
}

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
};
