/**
 * Session Controller - HTTP handlers: sessions list, revoke, activity log
 */

const sessionRepo = require('../repositories/session.repo');
const auditRepo = require('../repositories/audit.repo');

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

function getSessions(req, res) {
  const user = getUserFromHeaders(req);
  const currentIP = getClientIP(req);
  const { clientType } = req.query;
  const sessions = sessionRepo.findAllByUserId(user.id, { clientType });

  const result = sessions.map((s) => ({
    ...s,
    isCurrent: !clientType && s.ipAddress === currentIP,
  }));

  res.json(result);
}

function revokeSession(req, res) {
  const user = getUserFromHeaders(req);
  const ip = getClientIP(req);
  sessionRepo.deleteById(req.params.id, user.id);
  auditRepo.create(user.id, 'SESSION_REVOKED', `Session ${req.params.id}`, ip);
  res.json({ message: 'Đã hủy phiên đăng nhập' });
}

function getActivity(req, res) {
  const user = getUserFromHeaders(req);
  const { page = 1, limit = 30 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { items, total } = auditRepo.findByUserId(user.id, parseInt(limit), offset);

  res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
}

module.exports = {
  getSessions,
  revokeSession,
  getActivity,
};
