const crypto = require('crypto');

const DEV_SEED = 'pos-dev-2024';
function devSecret(name) {
  return crypto.createHash('sha256').update(`${DEV_SEED}-${name}`).digest('hex');
}

module.exports = {
  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || devSecret('access'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || devSecret('refresh'),
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,

  // Remember me - extended token life
  REMEMBER_ME_EXPIRY: '30d',
  REMEMBER_ME_EXPIRY_MS: 30 * 24 * 60 * 60 * 1000,

  // Security
  BCRYPT_ROUNDS: 10,

  // Rate limiting
  LOGIN_MAX_ATTEMPTS: 5,          // Max failed attempts before lockout
  LOGIN_LOCKOUT_MS: 15 * 60 * 1000,  // 15 minutes lockout
  LOGIN_WINDOW_MS: 5 * 60 * 1000,    // Count attempts within 5 minutes

  // Password reset
  RESET_TOKEN_EXPIRY_MS: 30 * 60 * 1000,  // 30 minutes
  SECURITY_QUESTION_REQUIRED: true,

  // Avatar
  AVATAR_MAX_SIZE: 2 * 1024 * 1024,  // 2MB
  AVATAR_DIR: 'uploads/avatars',

  // Service ports
  GATEWAY_PORT: parseInt(process.env.GATEWAY_PORT) || 4000,
  AUTH_SERVICE_PORT: parseInt(process.env.AUTH_SERVICE_PORT) || 4001,
  STORE_SERVICE_PORT: parseInt(process.env.STORE_SERVICE_PORT) || 4002,
  TRANSACTION_SERVICE_PORT: parseInt(process.env.TRANSACTION_SERVICE_PORT) || 4003,
  PRODUCT_SERVICE_PORT: parseInt(process.env.PRODUCT_SERVICE_PORT) || 4004,
  PRINT_SERVICE_PORT: parseInt(process.env.PRINT_SERVICE_PORT) || 4005,

  // Service URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  STORE_SERVICE_URL: process.env.STORE_SERVICE_URL || 'http://localhost:4002',
  TRANSACTION_SERVICE_URL: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:4003',
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:4004',
  PRINT_SERVICE_URL: process.env.PRINT_SERVICE_URL || 'http://localhost:4005',

  // CORS
  PORTAL_ORIGIN: process.env.PORTAL_ORIGIN || 'http://localhost:3000',

  // Kafka
  KAFKA_BROKER: process.env.KAFKA_BROKER || null,
};
