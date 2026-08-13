/**
 * Transaction Routes
 */

const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const diningSessionController = require('../controllers/dining-session.controller');
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

router.get('/txn/dining-sessions', diningSessionController.getDiningSessions);
router.post('/txn/dining-sessions', diningSessionController.createDiningSession);
router.get('/txn/dining-sessions/:id', diningSessionController.getDiningSession);
router.post('/txn/dining-sessions/:id/orders', diningSessionController.createSessionOrder);
router.post('/txn/dining-sessions/:id/close', diningSessionController.closeDiningSession);

router.get('/txn/public/dining-sessions', diningSessionController.getPublicDiningSessions);
router.post('/txn/public/dining-sessions', diningSessionController.createPublicDiningSession);
router.get('/txn/public/dining-sessions/:id', diningSessionController.getPublicDiningSession);
router.post('/txn/public/dining-sessions/:id/orders', diningSessionController.createPublicSessionOrder);
router.post('/txn/public/dining-sessions/:id/close', diningSessionController.closePublicDiningSession);

router.post('/txn/payment-webhooks/sepay', webhookController.handleSePayWebhook);

// ─── Dashboard ───────────────────────────────────────────────────────
router.get('/txn/dashboard/stats', dashboardController.getStats);
router.get('/txn/dashboard/hourly', dashboardController.getHourlyChart);
router.get('/txn/dashboard/revenue', dashboardController.getRevenueReport);
router.get('/txn/dashboard/top-products', dashboardController.getTopProducts);
router.get('/txn/dashboard/payments', dashboardController.getPaymentBreakdown);

module.exports = router;
