const { Router } = require('express');
const controller = require('../controllers/platform.controller');

const router = Router();

router.get('/platform/bootstrap', controller.getBootstrap);
router.get('/platform/summary', controller.getSummary);
router.get('/platform/tenants', controller.getTenants);
router.get('/platform/trial-requests', controller.getTrialRequests);
router.get('/platform/trial-requests/me', controller.getMyTrialRequest);
router.post('/platform/trial-requests', controller.submitTrialRequest);
router.post('/platform/trial-requests/:id/approve', controller.approveTrialRequest);
router.post('/platform/trial-requests/:id/reject', controller.rejectTrialRequest);
router.put('/platform/tenants/:id/package', controller.updateTenantPackage);
router.post('/platform/tenants/:id/toggle-status', controller.toggleTenantStatus);
router.get('/platform/packages', controller.getPackages);
router.get('/platform/accounts', controller.getAccounts);
router.post('/platform/accounts/invite', controller.inviteAccount);
router.post('/public/orders', controller.createPublicOrder);
router.get('/platform/orders', controller.getOrders);
router.get('/platform/orders/:id', controller.getOrder);
router.post('/platform/orders', controller.createOrder);
router.post('/platform/orders/:id/contact', controller.markOrderContacted);
router.post('/platform/orders/:id/quote', controller.quoteOrder);
router.post('/platform/orders/:id/wait-payment', controller.waitOrderPayment);
router.post('/platform/orders/:id/confirm-payment', controller.confirmOrderPayment);
router.post('/platform/orders/:id/approve', controller.approveOrder);
router.post('/platform/orders/:id/reject', controller.rejectOrder);
router.post('/platform/orders/:id/cancel', controller.cancelOrder);
router.post('/platform/orders/:id/provision', controller.provisionOrder);
router.get('/platform/permissions/:role', controller.getPermission);
router.patch('/platform/permissions/:role', controller.togglePermission);

module.exports = router;
