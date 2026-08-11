/**
 * Topping Service - Business logic for topping groups and toppings
 */

const { publish } = require('../../../shared/event-bus');
const toppingRepo = require('../repositories/topping.repo');

function getToppingGroups(storeId) {
  return { data: toppingRepo.findGroupsByStoreId(storeId) };
}

function createToppingGroup(storeId, { name, isRequired, maxSelect, sortOrder }) {
  if (!name) return { error: 'T\u00EAn nh\u00F3m topping l\u00E0 b\u1EAFt bu\u1ED9c', status: 400 };

  const id = toppingRepo.createGroup(storeId, { name, isRequired, maxSelect, sortOrder });
  publish('product.toppingUpdated', { key: String(storeId), storeId, groupId: id });
  return { data: { id, name, isRequired: !!isRequired, maxSelect: maxSelect || 0, sortOrder: sortOrder || 0, toppings: [] }, status: 201 };
}

function updateToppingGroup(storeId, groupId, fields) {
  const { name, isRequired, maxSelect, sortOrder } = fields;
  const hasUpdates = name !== undefined || isRequired !== undefined || maxSelect !== undefined || sortOrder !== undefined;
  if (!hasUpdates) return { error: 'Nothing to update', status: 400 };

  toppingRepo.updateGroup(groupId, storeId, { name, isRequired, maxSelect, sortOrder });
  publish('product.toppingUpdated', { key: String(storeId), storeId, groupId });
  return { message: 'C\u1EADp nh\u1EADt nh\u00F3m topping th\u00E0nh c\u00F4ng' };
}

function deleteToppingGroup(storeId, groupId) {
  toppingRepo.removeGroup(groupId, storeId);
  publish('product.toppingUpdated', { key: String(storeId), storeId, groupId });
  return { message: '\u0110\u00E3 x\u00F3a nh\u00F3m topping' };
}

function createTopping(storeId, { groupId, name, price }) {
  if (!groupId) return { error: 'groupId l\u00E0 b\u1EAFt bu\u1ED9c', status: 400 };
  if (!name) return { error: 'T\u00EAn topping l\u00E0 b\u1EAFt bu\u1ED9c', status: 400 };

  const id = toppingRepo.createTopping(storeId, { groupId, name, price });
  publish('product.toppingUpdated', { key: String(storeId), storeId, groupId, toppingId: id });
  return { data: { id, groupId, name, price: price || 0, isAvailable: true, sortOrder: 0 }, status: 201 };
}

function updateTopping(storeId, toppingId, fields) {
  const { name, price, isAvailable, sortOrder } = fields;
  const hasUpdates = name !== undefined || price !== undefined || isAvailable !== undefined || sortOrder !== undefined;
  if (!hasUpdates) return { error: 'Nothing to update', status: 400 };

  toppingRepo.updateTopping(toppingId, storeId, { name, price, isAvailable, sortOrder });
  publish('product.toppingUpdated', { key: String(storeId), storeId, toppingId });
  return { message: 'C\u1EADp nh\u1EADt topping th\u00E0nh c\u00F4ng' };
}

function deleteTopping(storeId, toppingId) {
  toppingRepo.removeTopping(toppingId, storeId);
  publish('product.toppingUpdated', { key: String(storeId), storeId, toppingId });
  return { message: '\u0110\u00E3 x\u00F3a topping' };
}

module.exports = {
  getToppingGroups,
  createToppingGroup,
  updateToppingGroup,
  deleteToppingGroup,
  createTopping,
  updateTopping,
  deleteTopping,
};
