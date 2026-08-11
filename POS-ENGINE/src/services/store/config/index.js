/**
 * Store Service Config
 */

const sharedConfig = require('../../../shared/config');

module.exports = {
  ...sharedConfig,

  SERVICE_NAME: 'store-service',
  LOG_PREFIX: '[Store]',

  // Default receipt settings
  DEFAULT_RECEIPT: {
    footer: 'Xin cảm ơn quý khách',
    showQR: true,
    showLogo: false,
    showTime: true,
    showTxnId: true,
    showStoreInfo: true,
    paperWidth: '58mm',
  },

  // QR providers
  QR_PROVIDERS: ['VietQR', 'VNPay', 'MoMo'],
};
