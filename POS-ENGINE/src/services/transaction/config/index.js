const sharedConfig = require('../../../shared/config');

module.exports = {
  ...sharedConfig,
  SERVICE_NAME: 'transaction-service',
  LOG_PREFIX: '[Transaction]',
};
