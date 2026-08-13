const { Router } = require('express');
const controller = require('../controllers/platform.controller');

const router = Router();

router.get('/platform/bootstrap', controller.getBootstrap);
router.get('/platform/summary', controller.getSummary);
router.get('/platform/tenants', controller.getTenants);
router.put('/platform/tenants/:id/package', controller.updateTenantPackage);
router.post('/platform/tenants/:id/toggle-status', controller.toggleTenantStatus);
router.get('/platform/packages', controller.getPackages);
router.get('/platform/accounts', controller.getAccounts);
router.post('/platform/accounts/invite', controller.inviteAccount);
router.get('/platform/orders', controller.getOrders);
router.post('/platform/orders', controller.createOrder);
router.get('/platform/permissions/:role', controller.getPermission);
router.patch('/platform/permissions/:role', controller.togglePermission);

module.exports = router;
