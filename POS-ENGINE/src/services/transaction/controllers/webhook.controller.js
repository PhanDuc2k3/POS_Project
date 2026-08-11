/**
 * Payment webhook HTTP handlers.
 */

const sepayWebhookService = require('../services/sepay-webhook.service');

function handleSePayWebhook(req, res) {
  const result = sepayWebhookService.handleWebhook(req.body, req.headers);
  if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
  return res.json(result.data || { success: true });
}

module.exports = { handleSePayWebhook };
