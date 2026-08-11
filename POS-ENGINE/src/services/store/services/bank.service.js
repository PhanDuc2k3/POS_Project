/**
 * Bank Service - Business logic for bank config
 */

const { publish } = require('../../../shared/event-bus');
const storeRepo = require('../repositories/store.repo');
const bankRepo = require('../repositories/bank.repo');

function getBankConfig(userId) {
  const store = storeRepo.getOrCreate(userId);
  const config = bankRepo.findByStoreId(store.id);
  return { data: config };
}

function updateBankConfig(userId, { bankName, bankBin, accountName, accountNumber, qrProvider }) {
  const store = storeRepo.getOrCreate(userId);
  bankRepo.upsert(store.id, { bankName, bankBin, accountName, accountNumber, qrProvider });
  publish('store.bankUpdated', { key: String(store.id), storeId: store.id });
  return { message: 'Cập nhật cấu hình ngân hàng thành công' };
}

module.exports = {
  getBankConfig,
  updateBankConfig,
};
