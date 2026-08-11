/**
 * Product Validators
 */

function validateCreateProduct(body) {
  const { name, price } = body;
  if (!name || !name.trim()) {
    return { valid: false, error: 'Tên sản phẩm là bắt buộc' };
  }
  if (price === undefined || price === null || price < 0) {
    return { valid: false, error: 'Giá không hợp lệ' };
  }
  return { valid: true };
}

function validateCreateCategory(body) {
  const { name } = body;
  if (!name || !name.trim()) {
    return { valid: false, error: 'Tên danh mục là bắt buộc' };
  }
  return { valid: true };
}

module.exports = { validateCreateProduct, validateCreateCategory };
