/**
 * Product Service - Business logic for products
 */

const { publish } = require('../../../shared/event-bus');
const productRepo = require('../repositories/product.repo');

function getProducts(storeId, query) {
  const products = productRepo.findAllByStoreIdWithToppings(storeId, query);
  return { data: products };
}

function createProduct(storeId, { name, price, categoryId, image, description }) {
  if (!name) return { error: 'T\u00EAn s\u1EA3n ph\u1EA9m l\u00E0 b\u1EAFt bu\u1ED9c', status: 400 };
  if (price === undefined || price < 0) return { error: 'Gi\u00E1 kh\u00F4ng h\u1EE3p l\u1EC7', status: 400 };

  const id = productRepo.create(storeId, { name, price, categoryId, image, description });
  publish('product.created', { key: String(storeId), storeId, productId: id });

  return {
    data: {
      id, name, price, categoryId: categoryId || null, image: image || null,
      description: description || null, isAvailable: true, sortOrder: 0, toppingGroups: [],
    },
    status: 201,
  };
}

function updateProduct(storeId, productId, fields) {
  const { name, price, categoryId, image, description, isAvailable, sortOrder } = fields;

  const hasUpdates = name !== undefined || price !== undefined || categoryId !== undefined
    || image !== undefined || description !== undefined || isAvailable !== undefined || sortOrder !== undefined;
  if (!hasUpdates) return { error: 'Nothing to update', status: 400 };

  productRepo.update(productId, storeId, { name, price, categoryId, image, description, isAvailable, sortOrder });
  publish('product.updated', { key: String(storeId), storeId, productId });
  return { message: 'C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m th\u00E0nh c\u00F4ng' };
}

function deleteProduct(storeId, productId) {
  productRepo.remove(productId, storeId);
  return { message: '\u0110\u00E3 x\u00F3a s\u1EA3n ph\u1EA9m' };
}

function toggleProduct(storeId, productId) {
  const newState = productRepo.toggleAvailability(productId, storeId);
  if (newState === null) return { error: 'S\u1EA3n ph\u1EA9m kh\u00F4ng t\u1ED3n t\u1EA1i', status: 404 };

  publish('product.updated', { key: String(storeId), storeId, productId });
  return { data: { isAvailable: newState } };
}

function linkToppingGroup(storeId, productId, groupId) {
  const success = productRepo.linkToppingGroup(productId, groupId);
  if (!success) return { error: 'Topping group \u0111\u00E3 \u0111\u01B0\u1EE3c li\u00EAn k\u1EBFt', status: 400 };
  publish('product.updated', { key: String(storeId), storeId, productId });
  return { message: 'Li\u00EAn k\u1EBFt topping group th\u00E0nh c\u00F4ng' };
}

function unlinkToppingGroup(storeId, productId, groupId) {
  productRepo.unlinkToppingGroup(productId, groupId);
  publish('product.updated', { key: String(storeId), storeId, productId });
  return { message: '\u0110\u00E3 g\u1EE1 li\u00EAn k\u1EBFt topping group' };
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProduct,
  linkToppingGroup,
  unlinkToppingGroup,
};
