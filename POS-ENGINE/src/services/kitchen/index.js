/**
 * Kitchen Service
 * Port: 4008
 *
 * Kitchen app backend facade:
 * - Open dining sessions
 * - Session details with orders
 * - Session close command
 */

process.env.SERVICE_NAME = 'kitchen-service';
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
  const server = app.listen(config.KITCHEN_SERVICE_PORT, () => {
    logger.info(`Kitchen Service started on port ${config.KITCHEN_SERVICE_PORT}`);
  });
  gracefulShutdown('Kitchen Service', server, {
    dbPath: path.join(__dirname, '..', '..', '..', 'data', 'kitchen.db'),
  });
}

start().catch((err) => logger.error('Kitchen Service failed to start', { error: err.message }));
