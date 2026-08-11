/**
 * Store Controller - HTTP handlers for store profile
 */

const storeService = require('../services/store.service');
const bankRepo = require('../repositories/bank.repo');
const receiptRepo = require('../repositories/receipt.repo');
const storeRepo = require('../repositories/store.repo');

function getUserFromHeaders(req) {
  return {
    id: parseInt(req.headers['x-user-id']),
    role: req.headers['x-user-role'],
    username: req.headers['x-user-name'],
  };
}

function getStore(req, res) {
  const user = getUserFromHeaders(req);
  const result = storeService.getStore(user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function updateStore(req, res) {
  const user = getUserFromHeaders(req);
  const result = storeService.updateStore(user.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function getPosConfig(req, res) {
  const user = getUserFromHeaders(req);
  const store = storeRepo.getOrCreate(user.id);

  const bank = bankRepo.findActiveByStoreId(store.id);
  const defaultBlocks = ['header','storeInfo','divider','orderInfo','divider','items','total','divider','footer'];
  const receipt = receiptRepo.findByStoreId(store.id) || {
    header: store.name, footer: 'Xin cảm ơn quý khách',
    showQR: true, showLogo: false, showTime: true, showTxnId: true, showStoreInfo: true, paperWidth: '58mm',
    blocks: defaultBlocks,
  };
  if (!receipt.blocks) receipt.blocks = defaultBlocks;

  res.json({ store, bank, receipt });
}

module.exports = {
  getStore,
  updateStore,
  getPosConfig,
};
