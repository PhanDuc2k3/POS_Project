/**
 * Bank Controller - HTTP handlers for bank config
 */

const bankService = require('../services/bank.service');

function getUserFromHeaders(req) {
  return {
    id: parseInt(req.headers['x-user-id']),
    role: req.headers['x-user-role'],
    username: req.headers['x-user-name'],
  };
}

function getBankConfig(req, res) {
  const user = getUserFromHeaders(req);
  const result = bankService.getBankConfig(user.id);
  res.json(result.data);
}

function updateBankConfig(req, res) {
  const user = getUserFromHeaders(req);
  const { bankName, bankBin, accountName, accountNumber, qrProvider } = req.body;
  const result = bankService.updateBankConfig(user.id, { bankName, bankBin, accountName, accountNumber, qrProvider });
  res.json(result);
}

module.exports = {
  getBankConfig,
  updateBankConfig,
};
