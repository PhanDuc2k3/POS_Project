/**
 * Receipt Controller - HTTP handlers for receipt config
 */

const receiptService = require('../services/receipt.service');

function getUserFromHeaders(req) {
  return {
    id: parseInt(req.headers['x-user-id']),
    role: req.headers['x-user-role'],
    username: req.headers['x-user-name'],
  };
}

function getReceiptConfig(req, res) {
  const user = getUserFromHeaders(req);
  const result = receiptService.getReceiptConfig(user.id);
  res.json(result.data);
}

function updateReceiptConfig(req, res) {
  const user = getUserFromHeaders(req);
  const { header, footer, showQR, showLogo, showTime, showTxnId, showStoreInfo, paperWidth, blocks, taxRate } = req.body;
  const result = receiptService.updateReceiptConfig(user.id, { header, footer, showQR, showLogo, showTime, showTxnId, showStoreInfo, paperWidth, blocks, taxRate });
  res.json(result);
}

module.exports = {
  getReceiptConfig,
  updateReceiptConfig,
};
