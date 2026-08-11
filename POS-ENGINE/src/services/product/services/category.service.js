/**
 * Category Service - Business logic for categories
 */

const { publish } = require('../../../shared/event-bus');
const categoryRepo = require('../repositories/category.repo');

function getCategories(storeId) {
  return { data: categoryRepo.findAllByStoreId(storeId) };
}

function createCategory(storeId, { name, sortOrder }) {
  if (!name) return { error: 'T\u00EAn danh m\u1EE5c l\u00E0 b\u1EAFt bu\u1ED9c', status: 400 };

  const id = categoryRepo.create(storeId, name, sortOrder);
  publish('product.categoryCreated', { key: String(storeId), storeId, categoryId: id });
  return { data: { id, name, sortOrder: sortOrder || 0, isActive: true }, status: 201 };
}

function updateCategory(storeId, categoryId, fields) {
  const { name, sortOrder, isActive } = fields;
  const hasUpdates = name !== undefined || sortOrder !== undefined || isActive !== undefined;
  if (!hasUpdates) return { error: 'Nothing to update', status: 400 };

  categoryRepo.update(categoryId, storeId, { name, sortOrder, isActive });
  return { message: 'C\u1EADp nh\u1EADt danh m\u1EE5c th\u00E0nh c\u00F4ng' };
}

function deleteCategory(storeId, categoryId) {
  categoryRepo.remove(categoryId, storeId);
  return { message: '\u0110\u00E3 x\u00F3a danh m\u1EE5c' };
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
