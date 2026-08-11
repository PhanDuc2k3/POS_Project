/**
 * Store Service
 * Port: 4002
 * 
 * Modules:
 * - Store profile (name, phone, address, logo)
 * - Bank config (payment info for QR)
 * - Receipt config (bill template)
 * - Categories (product groups)
 * - Products (menu items)
 */

process.env.SERVICE_NAME = 'store-service';
process.env.LOG_DIR = require('path').join(__dirname, '..', '..', '..', 'logs');

const express = require('express');
const path = require('path');
const config = require('../../shared/config');
const logger = require('../../shared/logger');
const { initEventBus, subscribe } = require('../../shared/event-bus');
const audit = require('../../shared/audit');
const { initDatabase, getDatabase } = require('./database');
const { gracefulShutdown } = require('../../shared/graceful-shutdown');
const storeRepo = require('./repositories/store.repo');
const routes = require('./routes');

const app = express();
app.use(express.json({ limit: '5mb' }));

// Mount routes
app.use(routes);

// ─── Event Subscribers ───────────────────────────────────────────────

async function setupSubscribers() {
  await subscribe('user.loggedIn', 'store-service', async (event) => {
    logger.info('User logged in, ensuring store exists', { userId: event.userId, username: event.username });
    storeRepo.getOrCreate(event.userId);
  });
}

// ─── Start ───────────────────────────────────────────────────────────

async function start() {
  await initDatabase();
  audit.init(getDatabase());
  await initEventBus('store-service');
  await setupSubscribers();
  const server = app.listen(config.STORE_SERVICE_PORT, () => {
    logger.info(`Store Service started on port ${config.STORE_SERVICE_PORT}`);
  });
  gracefulShutdown('Store Service', server, {
    db: getDatabase(),
    dbPath: path.join(__dirname, '..', '..', '..', 'data', 'store.db'),
  });
}

start().catch((err) => logger.error('Store Service failed to start', { error: err.message }));
