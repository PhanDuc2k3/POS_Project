const { Router } = require('express');
const controller = require('../controllers/kitchen.controller');

const router = Router();

router.get('/kitchen/bootstrap', controller.getBootstrap);
router.get('/kitchen/sessions', controller.getSessions);
router.get('/kitchen/sessions/:id', controller.getSession);

module.exports = router;
