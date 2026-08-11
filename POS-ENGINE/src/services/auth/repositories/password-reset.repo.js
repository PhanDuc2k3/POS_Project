/**
 * Password Reset Repository - Direct DB queries for password_resets table
 */

const { getDatabase, saveDatabase } = require('../database');

function create(userId, tokenHash, expiresAt) {
  const db = getDatabase();
  db.run('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]);
  saveDatabase();
}

function findValidByTokenHash(tokenHash) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > datetime("now")',
    [tokenHash]
  );
  if (!result.length || !result[0].values.length) return null;
  return { id: result[0].values[0][0], userId: result[0].values[0][1] };
}

function markUsed(resetId) {
  const db = getDatabase();
  db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [resetId]);
  saveDatabase();
}

module.exports = {
  create,
  findValidByTokenHash,
  markUsed,
};
