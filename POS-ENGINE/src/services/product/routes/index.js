/**
 * Product Routes - Map HTTP methods + paths to controller functions
 */

const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const productController = require('../controllers/product.controller');
const toppingController = require('../controllers/topping.controller');
const menuController = require('../controllers/menu.controller');

const router = Router();

// ─── Categories ──────────────────────────────────────────────────────
router.get('/product/categories', categoryController.getCategories);
router.post('/product/categories', categoryController.createCategory);
router.put('/product/categories/:id', categoryController.updateCategory);
router.delete('/product/categories/:id', categoryController.deleteCategory);

// ─── Products ────────────────────────────────────────────────────────
router.get('/product/products', productController.getProducts);
router.post('/product/products', productController.createProduct);
router.put('/product/products/:id', productController.updateProduct);
router.delete('/product/products/:id', productController.deleteProduct);
router.patch('/product/products/:id/toggle', productController.toggleProduct);

// ─── Product ↔ Topping Group Links ──────────────────────────────────
router.post('/product/products/:id/topping-groups', productController.linkToppingGroup);
router.delete('/product/products/:id/topping-groups/:groupId', productController.unlinkToppingGroup);

// ─── Topping Groups ─────────────────────────────────────────────────
router.get('/product/topping-groups', toppingController.getToppingGroups);
router.post('/product/topping-groups', toppingController.createToppingGroup);
router.put('/product/topping-groups/:id', toppingController.updateToppingGroup);
router.delete('/product/topping-groups/:id', toppingController.deleteToppingGroup);

// ─── Toppings ────────────────────────────────────────────────────────
router.post('/product/toppings', toppingController.createTopping);
router.put('/product/toppings/:id', toppingController.updateTopping);
router.delete('/product/toppings/:id', toppingController.deleteTopping);

// ─── POS Menu (aggregate) ───────────────────────────────────────────
router.get('/product/menu', menuController.getMenu);

module.exports = router;
