const config = require('../../../shared/config');
const activationService = require('../services/activation.service');

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.ip
    || req.connection?.remoteAddress
    || 'unknown';
}

function requireInternal(req, res) {
  if (req.headers['x-internal-token'] !== config.INTERNAL_SERVICE_TOKEN) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

function provisionOwner(req, res) {
  if (!requireInternal(req, res)) return;
  const result = activationService.provisionOwner(req.body);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  return res.status(201).json(result.data);
}

function activate(req, res) {
  const result = activationService.activate(req.body?.activationToken, req.body?.newPassword, getClientIP(req));
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  return res.json(result.data);
}

module.exports = {
  provisionOwner,
  activate,
};
