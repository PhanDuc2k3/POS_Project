/**
 * Product Service - Event definitions
 * 
 * Published topics:
 *   - product.created        → when a new product is added
 *   - product.updated        → when a product is modified or toggled
 *   - product.categoryCreated → when a new category is created
 *   - product.toppingUpdated  → when topping groups/toppings change
 */

module.exports = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  CATEGORY_CREATED: 'product.categoryCreated',
  TOPPING_UPDATED: 'product.toppingUpdated',
};
