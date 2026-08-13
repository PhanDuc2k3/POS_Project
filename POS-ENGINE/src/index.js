/**
 * POS Engine - Service Orchestrator
 */

process.env.SERVICE_NAME = 'pos-engine';
process.env.LOG_DIR = require('path').join(__dirname, '..', 'logs');

const logger = require('./shared/logger');

logger.info('POS Engine - Microservices');
logger.info('Gateway             -> :4000');
logger.info('Auth Service        -> :4001');
logger.info('Store Service       -> :4002');
logger.info('Transaction Service -> :4003');
logger.info('Product Service     -> :4004');
logger.info('Print Service       -> :4005');
logger.info('Platform Service    -> :4006');
logger.info('Customer Service    -> :4007');
logger.info('Kitchen Service     -> :4008');

async function startAll() {
  require('./services/auth/index');
  require('./services/store/index');
  require('./services/transaction/index');
  require('./services/product/index');
  require('./services/print/index');
  require('./services/platform/index');
  require('./services/customer/index');
  require('./services/kitchen/index');

  setTimeout(() => {
    require('./gateway/index');
  }, 500);
}

startAll();
