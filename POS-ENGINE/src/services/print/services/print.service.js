/**
 * Print Service - Orchestrator
 *
 * Handles the full pipeline:
 *   submit()  → render template → encode ESC/POS → enqueue to DB
 *              (returns immediately)
 *   execute() → worker picks up → emit to Device Agent via gateway WS
 *              → Device Agent prints → device:printResult callback
 *
 * Jobs are persisted to print_jobs table so they survive restarts.
 *
 * Print Modes:
 *   DEVICE_AGENT  → emit print:job via gateway WS → Electron Device Agent prints
 *   SERVICE_SIDE  → print directly from service (fallback when no device)
 */

const http = require('http');
const jobRepo = require('../repositories/print-job.repo');
const printerRepo = require('../repositories/printer.repo');
const templateService = require('./template.service');
const escposService = require('./escpos.service');
const printerService = require('./printer.service');
const config = require('../config');
const logger = require('../../../shared/logger');

const PRINT_MODE = process.env.PRINT_MODE || 'DEVICE_AGENT';
const GATEWAY_HOST = process.env.GATEWAY_HOST || 'localhost';
const GATEWAY_PORT = parseInt(process.env.GATEWAY_PORT) || 4000;

/**
 * Emit a print job to the gateway via HTTP POST.
 * Gateway will forward via WebSocket to the registered device.
 */
function emitPrintJobViaGateway(job, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jobId: job.id,
      storeId: job.storeId,
      type: job.type,
      payload,
    });

    const req = http.request(
      {
        hostname: GATEWAY_HOST,
        port: GATEWAY_PORT,
        path: '/internal/print-job',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'pos-internal-token',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            logger.info('Print job forwarded to gateway', { jobId: job.id, statusCode: res.statusCode });
            resolve({ delivered: true });
          } else {
            logger.warn('Print job gateway delivery failed', { jobId: job.id, statusCode: res.statusCode, body: data });
            resolve({ delivered: false, reason: `gateway returned ${res.statusCode}` });
          }
        });
      },
    );

    req.on('error', (e) => {
      logger.error('Print job gateway delivery error', { jobId: job.id, error: e.message });
      resolve({ delivered: false, reason: e.message });
    });

    req.write(body);
    req.end();
  });
}

/**
 * Submit a print job. Returns the job id (printing happens async).
 *
 * @param {object} opts
 * @param {number} opts.storeId
 * @param {string} opts.type          'receipt' (default)
 * @param {object} opts.payload       Template variables (order, store, etc.)
 * @param {number} [opts.printerId]   Override default printer
 * @param {number} [opts.templateId]  Override default template
 * @param {string} [opts.triggeredBy] 'event' | 'api' | 'system'
 * @param {number} [opts.userId]
 */
async function submit(opts) {
  const job = jobRepo.create({
    storeId: opts.storeId,
    type: opts.type || 'receipt',
    payload: opts.payload,
    printerId: opts.printerId || null,
    templateId: opts.templateId || null,
    triggeredBy: opts.triggeredBy || 'api',
    triggeredByUserId: opts.userId || null,
  });
  logger.info('Print job queued', { jobId: job.id, storeId: opts.storeId, type: job.type, mode: PRINT_MODE });
  return job;
}

/**
 * Execute a claimed job. Called by the worker.
 *
 * Strategy:
 *   1. If PRINT_MODE=DEVICE_AGENT → try emit to gateway WS → Device Agent
 *   2. If delivery fails or no device registered → fall back to service-side print
 */
async function execute(job) {
  const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;

  // Resolve printer
  let printer = job.printerId ? printerRepo.findById(job.printerId) : null;
  if (!printer) printer = printerRepo.findDefaultByStoreId(job.storeId);

  if (PRINT_MODE === 'DEVICE_AGENT') {
    // Try to deliver to device via gateway WS
    const result = await emitPrintJobViaGateway(job, payload);
    if (result.delivered) {
      logger.info('Print job dispatched to device agent', { jobId: job.id });
      return { pendingDeviceCallback: true };
    }
    logger.warn('Device agent delivery failed, falling back to service-side print', {
      jobId: job.id,
      reason: result.reason,
    });
    // Fall through to service-side print
  }

  // ─── Service-side print (fallback or direct mode) ───────────────────

  // Fallback: if no printer configured, create ephemeral mock
  if (!printer) {
    logger.warn('No printer configured for store, using mock printer', { storeId: job.storeId });
    printer = {
      id: 0,
      storeId: job.storeId,
      name: 'Auto-Mock',
      type: 'mock',
      paperWidth: 80,
      charset: 'ASCII',
    };
  }

  // Render template
  const { text } = templateService.renderDefault({
    storeId: job.storeId,
    type: job.type,
    payload,
  });

  // Encode ESC/POS
  const buffer = escposService.encode(text, {
    paperWidth: printer.paperWidth,
    charset: printer.charset,
  });

  // Send to printer
  await printerService.printRaw(printer, buffer);
  logger.info('Print job executed (service-side)', { jobId: job.id, printer: printer.name });
  return { completed: true };
}

module.exports = { submit, execute };
