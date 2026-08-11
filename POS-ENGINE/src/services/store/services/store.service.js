/**
 * Store Service - Business logic for store profile
 */

const { publish } = require('../../../shared/event-bus');
const storeRepo = require('../repositories/store.repo');

function getStore(userId) {
  if (!userId) return { error: 'User context required', status: 401 };
  return { data: storeRepo.getOrCreate(userId) };
}

function updateStore(userId, fields) {
  if (!userId) return { error: 'User context required', status: 401 };

  const { name, phone, address, logo } = fields;
  const store = storeRepo.getOrCreate(userId);

  const hasUpdates = name !== undefined || phone !== undefined || address !== undefined || logo !== undefined;
  if (!hasUpdates) return { error: 'Không có thông tin nào để cập nhật', status: 400 };

  storeRepo.update(store.id, { name, phone, address, logo });

  const updated = storeRepo.getOrCreate(userId);
  publish('store.updated', { key: String(store.id), storeId: store.id, data: updated });
  return { data: { message: 'Cập nhật cửa hàng thành công', store: updated } };
}

module.exports = {
  getStore,
  updateStore,
};
