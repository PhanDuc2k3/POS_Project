/**
 * Store Routes - Map HTTP methods + paths to controller functions
 */

const { Router } = require('express');
const storeController = require('../controllers/store.controller');
const bankController = require('../controllers/bank.controller');
const receiptController = require('../controllers/receipt.controller');

const router = Router();

// ─── Store Profile ───────────────────────────────────────────────────
router.get('/store/me', storeController.getStore);
router.put('/store/me', storeController.updateStore);

// ─── Bank Config ─────────────────────────────────────────────────────
router.get('/store/bank', bankController.getBankConfig);
router.put('/store/bank', bankController.updateBankConfig);

// ─── Receipt Config ──────────────────────────────────────────────────
router.get('/store/receipt', receiptController.getReceiptConfig);
router.put('/store/receipt', receiptController.updateReceiptConfig);

// ─── POS Config (aggregate endpoint) ────────────────────────────────
router.get('/store/pos-config', storeController.getPosConfig);
router.post('/internal/stores/provision', storeController.provisionStore);

module.exports = router;
