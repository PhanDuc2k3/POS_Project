/**
 * Print Job Controller
 *
 * List, retry, cancel print jobs. Manual print goes through print.service.submit.
 */

const jobRepo = require('../repositories/print-job.repo');
const printService = require('../services/print.service');
const logger = require('../../../shared/logger');
const { getUserFromHeaders } = require('../helpers/request.helper');

function list(req, res) {
  const storeId = parseInt(req.query.storeId, 10);
  if (!Number.isInteger(storeId)) {
    return res.status(400).json({ error: 'storeId query param required' });
  }
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  return res.json({ data: jobRepo.findByStoreId(storeId, limit) });
}

function getById(req, res) {
  const id = parseInt(req.params.id, 10);
  const job = jobRepo.findById(id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json({ data: job });
}

async function submit(req, res) {
  const user = getUserFromHeaders(req);
  try {
    const job = await printService.submit({
      storeId: req.body.storeId,
      type: req.body.type,
      payload: req.body.payload,
      printerId: req.body.printerId,
      templateId: req.body.templateId,
      triggeredBy: 'api',
      userId: user.id,
    });
    return res.status(201).json({ data: job });
  } catch (err) {
    return res.status(500).json({ error: 'Submit failed', details: err.message });
  }
}

async function retry(req, res) {
  const id = parseInt(req.params.id, 10);
  const job = jobRepo.retry(id);
  if (!job) {
    return res.status(409).json({ error: 'Job cannot be retried (must be failed/cancelled)' });
  }
  return res.json({ data: job });
}

function cancel(req, res) {
  const id = parseInt(req.params.id, 10);
  const existing = jobRepo.findById(id);
  if (!existing) return res.status(404).json({ error: 'Job not found' });
  jobRepo.cancel(id);
  return res.json({ data: { message: 'Cancelled' } });
}

/**
 * Report print result from Device Agent.
 * Called via POST /jobs/:id/result (forwarded by Gateway from WS device:printResult)
 * Only processes callback if called from Gateway (X-Gateway-Callback header).
 */
function reportResult(req, res) {
  const isGatewayCallback = req.headers['x-gateway-callback'] === 'true';
  if (!isGatewayCallback) {
    // Require JWT for manual calls
    const { getUserFromHeaders } = require('../helpers/request.helper');
    const user = getUserFromHeaders(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = parseInt(req.params.id, 10);
  const { status, error, serial, completedAt } = req.body || {};

  const job = jobRepo.findById(id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (status === 'SUCCESS') {
    jobRepo.markDone(id);
    logger.info('Print job completed (device callback)', { jobId: id, deviceSerial: serial });
  } else if (status === 'FAILED') {
    const nextRetryAt = new Date(Date.now() + 5000).toISOString();
    jobRepo.markFailed(id, error || 'Device reported failure', nextRetryAt);
    logger.warn('Print job failed (device callback)', { jobId: id, deviceSerial: serial, error });
  } else {
    return res.status(400).json({ error: 'Unknown status', accepted: ['SUCCESS', 'FAILED'] });
  }

  return res.json({ data: { jobId: id, status, completedAt } });
}

module.exports = { list, getById, submit, retry, cancel, reportResult };
