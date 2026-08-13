/**
 * Customer Service
 * Port: 4007
 *
 * Customer app backend facade:
 * - Menu bootstrap
 * - Dining sessions
 * - Session orders
 */

process.env.SERVICE_NAME = 'customer-service';
process.env.LOG_DIR = require('path').join(__dirname, '..', '..', '..', 'logs');

const express = require('express');
const path = require('path');
const config = require('../../shared/config');
const logger = require('../../shared/logger');
const { gracefulShutdown } = require('../../shared/graceful-shutdown');
const routes = require('./routes');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(routes);

async function start() {
  const server = app.listen(config.CUSTOMER_SERVICE_PORT, () => {
    logger.info(`Customer Service started on port ${config.CUSTOMER_SERVICE_PORT}`);
  });
  gracefulShutdown('Customer Service', server, {
    dbPath: path.join(__dirname, '..', '..', '..', 'data', 'customer.db'),
  });
}

start().catch((err) => logger.error('Customer Service failed to start', { error: err.message }));
