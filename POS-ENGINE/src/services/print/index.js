/**
 * Print Service
 * Port: 4005
 *
 * Features:
 * - ESC/POS receipt printing (thermal printer 58/80mm)
 * - USB transport (extensible to network later)
 * - Per-store templates (EJS-based)
 * - In-process print queue with retry/backoff
 * - Auto-print on order.completed event
 * - Manual print via API
 * - Test-print endpoint
 */

process.env.SERVICE_NAME = 'print-service';
process.env.LOG_DIR = require('path').join(__dirname, '..', '..', '..', 'logs');

const express = require('express');
const path = require('path');
const config = require('./config');
const logger = require('../../shared/logger');
const audit = require('../../shared/audit');
const { initEventBus } = require('../../shared/event-bus');
const { initDatabase, getDatabase } = require('./database');
const { gracefulShutdown } = require('../../shared/graceful-shutdown');
const { startWorker } = require('./jobs/worker');
const { initSubscriptions } = require('./events');

const routes = require('./routes');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use(routes);

async function start() {
  await initDatabase();
  audit.init(getDatabase());
  await initEventBus('print-service');

  // Start background worker (polls DB queue)
  startWorker();

  // Subscribe to domain events (order.completed, etc.)
  await initSubscriptions();

  const server = app.listen(config.PRINT_SERVICE_PORT, () => {
    logger.info(`Print Service started on port ${config.PRINT_SERVICE_PORT}`);
  });

  gracefulShutdown('Print Service', server, {
    db: getDatabase(),
    dbPath: path.join(__dirname, '..', '..', '..', 'data', config.PRINT_DB_FILENAME),
  });
}

start().catch((err) => logger.error('Print Service failed to start', { error: err.message }));
