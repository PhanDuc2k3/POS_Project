/**
 * Menu Service - Aggregate menu data for POS
 */

const categoryRepo = require('../repositories/category.repo');
const productRepo = require('../repositories/product.repo');

function getFullMenu(storeId) {
  const categories = categoryRepo.findActiveByStoreId(storeId);
  const products = productRepo.findAvailableByStoreId(storeId);

  return { data: { categories, products } };
}

module.exports = {
  getFullMenu,
};
