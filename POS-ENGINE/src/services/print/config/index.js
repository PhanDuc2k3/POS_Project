/**
 * Print Service - Configuration
 */

const sharedConfig = require('../../../shared/config');

module.exports = {
  ...sharedConfig,

  SERVICE_NAME: 'print-service',
  LOG_PREFIX: '[Print]',

  // Database
  PRINT_DB_FILENAME: 'print.db',
  PRINT_DB_DIR: '../../../data',

  // Queue
  QUEUE_POLL_INTERVAL_MS: 1000,
  QUEUE_BACKOFF_BASE_MS: 5000,
  QUEUE_BACKOFF_MAX_MS: 60000,
  QUEUE_MAX_ATTEMPTS: 3,

  // Default paper width for new templates
  DEFAULT_PAPER_WIDTH: 80,

  // Auto-print
  AUTO_PRINT_ON_ORDER_COMPLETED: true,
};
