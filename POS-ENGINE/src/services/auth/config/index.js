/**
 * Auth Service Config
 * Service-specific config that extends shared config.
 * Keeps service-level constants centralized.
 */

const sharedConfig = require('../../../shared/config');
const path = require('path');

module.exports = {
  ...sharedConfig,

  // Paths
  AVATAR_DIR: path.join(__dirname, '..', '..', '..', '..', 'uploads', 'avatars'),

  // Service-specific
  SERVICE_NAME: 'auth-service',
  LOG_PREFIX: '[Auth]',

  // Security question options
  SECURITY_QUESTIONS: [
    'Món ăn yêu thích của bạn là gì?',
    'Tên trường tiểu học của bạn?',
    'Tên thú cưng đầu tiên?',
    'Thành phố bạn sinh ra?',
    'Biệt danh hồi nhỏ của bạn?',
  ],
};
