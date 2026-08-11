/**
 * Auth Service - Full Identity System
 * Port: 4001
 * 
 * Features:
 * - Login with rate limiting & account lockout
 * - Remember me (extended token life)
 * - Forgot password via security question
 * - Avatar upload
 * - Activity log (audit)
 * - Sessions management
 */

process.env.SERVICE_NAME = 'auth-service';
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

// Serve uploaded avatars
const AVATAR_PATH = path.join(__dirname, '..', '..', '..', 'uploads', 'avatars');
app.use('/uploads/avatars', express.static(AVATAR_PATH));

// Mount routes
app.use(routes);

// ─── Start ───────────────────────────────────────────────────────────

async function start() {
  await initDatabase();
  audit.init(getDatabase());
  await initEventBus('auth-service');
  const server = app.listen(config.AUTH_SERVICE_PORT, () => {
    logger.info(`Auth Service started on port ${config.AUTH_SERVICE_PORT}`);
  });
  gracefulShutdown('Auth Service', server, {
    db: getDatabase(),
    dbPath: path.join(__dirname, '..', '..', '..', 'data', 'auth.db'),
  });
}

start().catch((err) => logger.error('Auth Service failed to start', { error: err.message }));
