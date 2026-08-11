/**
 * POS Engine - Service Orchestrator
 */

process.env.SERVICE_NAME = 'pos-engine';
process.env.LOG_DIR = require('path').join(__dirname, '..', 'logs');
const logger = require('./shared/logger');

logger.info('╔══════════════════════════════════════════════╗');
logger.info('║         POS Engine - Microservices           ║');
logger.info('╠══════════════════════════════════════════════╣');
logger.info('║  Gateway             → :4000                ║');
logger.info('║  Auth Service        → :4001                ║');
logger.info('║  Store Service       → :4002                ║');
logger.info('║  Transaction Service → :4003                ║');
logger.info('║  Product Service     → :4004                ║');
logger.info('║  Print Service       → :4005                ║');
logger.info('╚══════════════════════════════════════════════╝');

async function startAll() {
  require('./services/auth/index');
  require('./services/store/index');
  require('./services/transaction/index');
  require('./services/product/index');
  require('./services/print/index');

  setTimeout(() => {
    require('./gateway/index');
  }, 500);
}

startAll();
