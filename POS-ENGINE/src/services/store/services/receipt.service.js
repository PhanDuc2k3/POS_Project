/**
 * Receipt Service - Business logic for receipt config
 */

const { publish } = require('../../../shared/event-bus');
const storeRepo = require('../repositories/store.repo');
const receiptRepo = require('../repositories/receipt.repo');

const DEFAULT_BLOCKS = ['header','storeInfo','divider','orderInfo','divider','items','total','qr','footer'];

function getReceiptConfig(userId) {
  const store = storeRepo.getOrCreate(userId);
  const config = receiptRepo.findByStoreId(store.id);

  if (!config) {
    return {
      data: {
        header: store.name, footer: 'Xin cảm ơn quý khách',
        showQR: true, showLogo: false, showTime: true, showTxnId: true, showStoreInfo: true, paperWidth: '58mm',
        blocks: DEFAULT_BLOCKS,
      },
    };
  }

  return { data: config };
}

function updateReceiptConfig(userId, fields) {
  const store = storeRepo.getOrCreate(userId);
  receiptRepo.upsert(store.id, fields);
  publish('store.receiptUpdated', { key: String(store.id), storeId: store.id, ...fields });
  return { message: 'Cập nhật mẫu hóa đơn thành công' };
}

module.exports = {
  getReceiptConfig,
  updateReceiptConfig,
};
