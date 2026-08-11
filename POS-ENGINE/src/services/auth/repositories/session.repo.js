/**
 * Session Repository - Direct DB queries for refresh_tokens table
 */

const { getDatabase, saveDatabase } = require('../database');

function findByTokenHash(tokenHash) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, user_id, is_trusted FROM refresh_tokens WHERE token_hash = ? AND expires_at > datetime("now")',
    [tokenHash]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return { id: row[0], userId: row[1], isTrusted: row[2] };
}

function upsert(userId, tokenHash, ip, deviceInfo, expiresAt, isTrusted = false, jti = null) {
  const db = getDatabase();
  const { browser, os, deviceType, deviceName, deviceId, screenResolution, clientType = 'portal' } = deviceInfo;

  let existing;
  if (deviceId) {
    existing = db.exec(
      `SELECT id FROM refresh_tokens WHERE user_id = ? AND device_id = ? AND expires_at > datetime("now")`,
      [userId, deviceId]
    );
  } else {
    existing = db.exec(
      `SELECT id FROM refresh_tokens WHERE user_id = ? AND ip_address = ? AND device_type = ? AND expires_at > datetime("now")`,
      [userId, ip, deviceType]
    );
  }

  if (existing.length && existing[0].values.length) {
    const existingId = existing[0].values[0][0];
    db.run(
      `UPDATE refresh_tokens
       SET token_hash = ?, expires_at = ?, last_used = CURRENT_TIMESTAMP,
           ip_address = ?, device_name = ?, browser = ?, os = ?, screen_resolution = ?, client_type = ?, is_trusted = ?, jti = ?
       WHERE id = ?`,
      [tokenHash, expiresAt, ip, deviceName, browser, os, screenResolution || null, clientType, isTrusted ? 1 : 0, jti, existingId]
    );
  } else {
    db.run(
      `INSERT INTO refresh_tokens (user_id, token_hash, ip_address, device_id, device_name, device_type, client_type, browser, os, screen_resolution, is_trusted, expires_at, jti)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, tokenHash, ip, deviceId || null, deviceName, deviceType, clientType, browser, os, screenResolution || null, isTrusted ? 1 : 0, expiresAt, jti]
    );
  }
  saveDatabase();
}

function updateToken(sessionId, newHash, expiresAt, newJti = null) {
  const db = getDatabase();
  db.run(
    'UPDATE refresh_tokens SET token_hash = ?, expires_at = ?, last_used = CURRENT_TIMESTAMP, jti = ? WHERE id = ?',
    [newHash, expiresAt, newJti, sessionId]
  );
  saveDatabase();
}

function deleteByTokenHash(tokenHash) {
  const db = getDatabase();
  db.run('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
  saveDatabase();
}

function deleteAllByUserId(userId) {
  const db = getDatabase();
  db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  saveDatabase();
}

function deleteById(sessionId, userId) {
  const db = getDatabase();
  db.run('DELETE FROM refresh_tokens WHERE id = ? AND user_id = ?', [sessionId, userId]);
  saveDatabase();
}

function findAllByUserId(userId, filters = {}) {
  const db = getDatabase();
  const params = [userId];
  let where = 'WHERE user_id = ? AND expires_at > datetime("now")';

  if (filters.clientType) {
    where += ' AND client_type = ?';
    params.push(filters.clientType);
  }

  const result = db.exec(
    `SELECT id, ip_address, device_id, device_name, device_type, browser, os, screen_resolution, is_trusted, last_used, created_at, expires_at, client_type
     FROM refresh_tokens ${where} ORDER BY last_used DESC`,
    params
  );
  if (!result.length) return [];
  return result[0].values.map((row) => ({
    id: row[0], ipAddress: row[1], deviceId: row[2], deviceName: row[3],
    deviceType: row[4], browser: row[5], os: row[6], screenResolution: row[7],
    isTrusted: !!row[8], lastUsed: row[9], createdAt: row[10], expiresAt: row[11],
    clientType: row[12] || 'portal',
  }));
}

module.exports = {
  findByTokenHash,
  upsert,
  updateToken,
  deleteByTokenHash,
  deleteAllByUserId,
  deleteById,
  findAllByUserId,
};
