/**
 * Print Service Routes (mounted at /print/*)
 *
 * Service mount point: app.use(routes) → all paths here are top-level (no /print prefix).
 * Gateway rewrites /api/print/* → /<this route>, e.g. /api/print/printers → /printers here.
 */

const { Router } = require('express');
const { validate } = require('../middlewares');
const {
  validatePrinterCreate,
  validateTemplateUpsert,
  validatePrint,
  validatePreview,
} = require('../validators');

const printerController = require('../controllers/printer.controller');
const templateController = require('../controllers/template.controller');
const jobController = require('../controllers/print-job.controller');

const router = Router();

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'print' }));

// ─── Printers ──────────────────────────────────────────────────────────
router.get('/printers', printerController.list);
router.post('/printers', validate(validatePrinterCreate), printerController.create);
router.put('/printers/:id', printerController.update);
router.delete('/printers/:id', printerController.remove);
router.post('/printers/:id/test', printerController.testPrint);

// ─── Templates ─────────────────────────────────────────────────────────
router.get('/templates', templateController.list);
router.get('/templates/default', templateController.getDefault);
router.post('/templates', validate(validateTemplateUpsert), templateController.upsert);
router.put('/templates/:id', templateController.update);
router.delete('/templates/:id', templateController.remove);
router.post('/templates/preview', validate(validatePreview), templateController.preview);

// ─── Print Jobs ────────────────────────────────────────────────────────
router.get('/jobs', jobController.list);
router.get('/jobs/:id', jobController.getById);
router.post('/jobs', validate(validatePrint), jobController.submit);
router.post('/jobs/:id/retry', jobController.retry);
router.post('/jobs/:id/cancel', jobController.cancel);
// Device Agent callback: device reports print result via WS → gateway → this endpoint
router.post('/jobs/:id/result', jobController.reportResult);

module.exports = router;
