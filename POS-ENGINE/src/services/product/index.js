/**
 * Product Service
 * Port: 4004
 *
 * Modules:
 * - Categories (product groups)
 * - Products (menu items with topping support)
 * - Topping groups & toppings
 * - POS menu (aggregate endpoint)
 */

process.env.SERVICE_NAME = 'product-service';
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
app.use(express.json({ limit: '5mb' }));

// Mount routes
app.use(routes);

// ─── Start ───────────────────────────────────────────────────────────

async function start() {
  await initDatabase();
  audit.init(getDatabase());
  await initEventBus('product-service');
  const server = app.listen(config.PRODUCT_SERVICE_PORT, () => {
    logger.info(`Product Service started on port ${config.PRODUCT_SERVICE_PORT}`);
  });
  gracefulShutdown('Product Service', server, {
    db: getDatabase(),
    dbPath: path.join(__dirname, '..', '..', '..', 'data', 'product.db'),
  });
}

start().catch((err) => logger.error('Product Service failed to start', { error: err.message }));