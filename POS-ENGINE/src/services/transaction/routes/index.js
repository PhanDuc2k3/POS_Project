/**
 * Transaction Routes
 */

const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const dashboardController = require('../controllers/dashboard.controller');
const webhookController = require('../controllers/webhook.controller');

const router = Router();

// ─── Orders (Giao dịch) ─────────────────────────────────────────────
router.get('/txn/orders', orderController.getOrders);
router.post('/txn/orders', orderController.createOrder);
router.get('/txn/orders/:id', orderController.getOrder);
router.get('/txn/orders/recent/list', orderController.getRecentOrders);
router.post('/txn/orders/:id/cancel', orderController.cancelOrder);
router.post('/txn/orders/:id/mark-paid', orderController.markOrderPaid);
router.post('/txn/orders/:id/refund', orderController.refundOrder);

router.post('/txn/payment-webhooks/sepay', webhookController.handleSePayWebhook);

// ─── Dashboard ───────────────────────────────────────────────────────
router.get('/txn/dashboard/stats', dashboardController.getStats);
router.get('/txn/dashboard/hourly', dashboardController.getHourlyChart);
router.get('/txn/dashboard/revenue', dashboardController.getRevenueReport);
router.get('/txn/dashboard/top-products', dashboardController.getTopProducts);
router.get('/txn/dashboard/payments', dashboardController.getPaymentBreakdown);

module.exports = router;
