/**
 * Login Attempt Repository - Direct DB queries for login_attempts table
 */

const { getDatabase, saveDatabase } = require('../database');

function countFailedAttempts(ip, windowStart) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT COUNT(*) FROM login_attempts 
     WHERE ip_address = ? AND success = 0 AND created_at > ?`,
    [ip, windowStart]
  );
  return result[0]?.values[0]?.[0] || 0;
}

function getLastFailedAttemptTime(ip) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT created_at FROM login_attempts 
     WHERE ip_address = ? AND success = 0 
     ORDER BY created_at DESC LIMIT 1`,
    [ip]
  );
  if (!result.length || !result[0].values.length) return null;
  return result[0].values[0][0];
}

function record(ip, username, success) {
  const db = getDatabase();
  db.run(
    'INSERT INTO login_attempts (ip_address, username, success) VALUES (?, ?, ?)',
    [ip, username, success ? 1 : 0]
  );
  // Clean old attempts (older than 24h)
  db.run(`DELETE FROM login_attempts WHERE created_at < datetime('now', '-1 day')`);
  saveDatabase();
}

module.exports = {
  countFailedAttempts,
  getLastFailedAttemptTime,
  record,
};
