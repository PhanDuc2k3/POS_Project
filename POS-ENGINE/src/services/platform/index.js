/**
 * Platform Service
 * Port: 4006
 *
 * Handles:
 * - Tenant management
 * - Package catalog
 * - Subscription orders
 * - Account invites
 * - Permission matrix
 */

process.env.SERVICE_NAME = 'platform-service';
process.env.LOG_DIR = require('path').join(__dirname, '..', '..', '..', 'logs');

const express = require('express');
const path = require('path');
const config = require('../../shared/config');
const logger = require('../../shared/logger');
const { initDatabase, getDatabase } = require('./database');
const { gracefulShutdown } = require('../../shared/graceful-shutdown');
const routes = require('./routes');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(routes);

async function start() {
  await initDatabase();
  const server = app.listen(config.PLATFORM_SERVICE_PORT, () => {
    logger.info(`Platform Service started on port ${config.PLATFORM_SERVICE_PORT}`);
  });
  gracefulShutdown('Platform Service', server, {
    db: getDatabase(),
    dbPath: path.join(__dirname, '..', '..', '..', 'data', 'platform.db'),
  });
}

start().catch((err) => logger.error('Platform Service failed to start', { error: err.message }));
