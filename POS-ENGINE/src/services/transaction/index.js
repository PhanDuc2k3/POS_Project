/**
 * Transaction Service
 * Port: 4003
 *
 * Handles: orders, dashboard stats, revenue reports
 */

process.env.SERVICE_NAME = 'transaction-service';
process.env.LOG_DIR = require('path').join(__dirname, '..', '..', '..', 'logs');

const express = require('express');
const path = require('path');
const config = require('../../shared/config');
const logger = require('../../shared/logger');
const { initEventBus } = require('../../shared/event-bus');
const audit = require('../../shared/audit');
const { initDatabase, getDatabase } = require('./database');
const { gracefulShutdown } = require('../../shared/graceful-shutdown');
const routes = require('./routes');

const app = express();
app.use(express.json());

// Mount routes
app.use(routes);

// ─── Start ───────────────────────────────────────────────────────────

async function start() {
  await initDatabase();
  audit.init(getDatabase());
  await initEventBus('transaction-service');
  const server = app.listen(config.TRANSACTION_SERVICE_PORT, () => {
    logger.info(`Transaction Service started on port ${config.TRANSACTION_SERVICE_PORT}`);
  });
  gracefulShutdown('Transaction Service', server, {
    db: getDatabase(),
    dbPath: path.join(__dirname, '..', '..', '..', 'data', 'transaction.db'),
  });
}

start().catch((err) => logger.error('Transaction Service failed to start', { error: err.message }));