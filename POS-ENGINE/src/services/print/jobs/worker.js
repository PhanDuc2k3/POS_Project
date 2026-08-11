/**
 * Print Worker
 *
 * Polls the print_jobs table every QUEUE_POLL_INTERVAL_MS.
 * Picks up pending jobs (that are due), executes them, and updates status.
 *
 * Recovery: jobs survive service restart because state is in DB.
 * If job is "printing" when worker starts up → reset to pending (no zombie lock).
 */

process.env.SERVICE_NAME = 'print-service-worker';
const path = require('path');
const logger = require(path.join(__dirname, '..', '..', '..', 'shared', 'logger'));
const config = require('../config');
const jobRepo = require('../repositories/print-job.repo');
const printService = require('../services/print.service');

let timer = null;
let running = false;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function backoffMs(attempts) {
  // 5s, 10s, 20s, 40s, capped at 60s
  const delay = Math.min(
    config.QUEUE_BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1),
    config.QUEUE_BACKOFF_MAX_MS,
  );
  return delay;
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const job = jobRepo.claimNext();
    if (!job) return;

    try {
      const result = await printService.execute(job);
      if (result?.pendingDeviceCallback) {
        logger.info('Print job waiting for device callback', { jobId: job.id, attempts: job.attempts });
        return;
      }
      jobRepo.markDone(job.id);
      logger.info('Print job completed', { jobId: job.id, attempts: job.attempts });
    } catch (err) {
      logger.error('Print job failed', { jobId: job.id, attempt: job.attempts, maxAttempts: job.maxAttempts, error: err.message });
      if (job.attempts >= job.maxAttempts) {
        jobRepo.markFailed(job.id, err.message, null);
        logger.error('Print job exhausted all retries', { jobId: job.id, status: 'failed' });
      } else {
        const nextDelay = backoffMs(job.attempts);
        const nextRetryAt = new Date(Date.now() + nextDelay).toISOString();
        jobRepo.markFailed(job.id, err.message, nextRetryAt);
        logger.info('Print job scheduled for retry', { jobId: job.id, nextRetryAt, delayMs: nextDelay });
      }
    }
  } catch (err) {
    logger.error('Print worker tick error', { error: err.message });
  } finally {
    running = false;
  }
}

async function recoverZombies() {
  const db = require('../database').getDatabase();
  const res = db.exec(
    `UPDATE print_jobs
       SET status = 'pending', next_retry_at = CURRENT_TIMESTAMP
     WHERE status = 'printing'`,
  );
  return res;
}

function startWorker() {
  recoverZombies().catch((e) =>
    logger.error('Zombie recovery failed', { error: e.message }),
  );

  logger.info('Print worker started', {
    pollIntervalMs: config.QUEUE_POLL_INTERVAL_MS,
    maxRetries: config.QUEUE_MAX_ATTEMPTS,
  });

  const loop = async () => {
    await tick();
    timer = setTimeout(loop, config.QUEUE_POLL_INTERVAL_MS);
  };
  loop();
}

function stopWorker() {
  if (timer) clearTimeout(timer);
  timer = null;
}

module.exports = { startWorker, stopWorker, tick };
