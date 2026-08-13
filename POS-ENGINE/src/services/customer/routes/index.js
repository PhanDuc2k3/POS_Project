const { Router } = require('express');
const controller = require('../controllers/customer.controller');

const router = Router();

router.get('/customer/bootstrap', controller.getBootstrap);
router.get('/customer/menu', controller.getMenu);
router.get('/customer/dining-sessions', controller.getDiningSessions);
router.post('/customer/dining-sessions', controller.createDiningSession);
router.get('/customer/dining-sessions/:id', controller.getDiningSession);
router.post('/customer/dining-sessions/:id/orders', controller.createSessionOrder);
router.post('/customer/dining-sessions/:id/close', controller.closeDiningSession);

module.exports = router;
