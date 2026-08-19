/**
 * User Repository - Direct DB queries for users table
 */

const { getDatabase, saveDatabase } = require('../database');

function findByUsername(username) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, username, password_hash, display_name, email, role, is_active, avatar FROM users WHERE username = ?',
    [username]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0], username: row[1], passwordHash: row[2],
    displayName: row[3], email: row[4], role: row[5], isActive: row[6], avatar: row[7],
  };
}

function findByEmail(email) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, username, display_name, email, role, is_active, avatar, tenant_id, platform_account_id FROM users WHERE email = ?',
    [email]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    username: row[1],
    displayName: row[2],
    email: row[3],
    role: row[4],
    isActive: row[5],
    avatar: row[6],
    tenantId: row[7],
    platformAccountId: row[8],
  };
}

function findById(id) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, username, display_name, email, role, is_active, avatar FROM users WHERE id = ?',
    [id]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return { id: row[0], username: row[1], displayName: row[2], email: row[3], role: row[4], isActive: row[5], avatar: row[6] };
}

function findFullById(id) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, username, display_name, email, role, avatar, security_question, last_login, created_at FROM users WHERE id = ?',
    [id]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0], username: row[1], displayName: row[2], email: row[3],
    role: row[4], avatar: row[5], securityQuestion: row[6], lastLogin: row[7], createdAt: row[8],
  };
}

function getPasswordHash(userId) {
  const db = getDatabase();
  const result = db.exec('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!result.length || !result[0].values.length) return null;
  return result[0].values[0][0];
}

function updateLastLogin(userId) {
  const db = getDatabase();
  db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
  saveDatabase();
}

function updateProfile(userId, { displayName, email }) {
  const db = getDatabase();
  if (displayName) db.run('UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [displayName, userId]);
  if (email) db.run('UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [email, userId]);
  saveDatabase();
}

function updatePassword(userId, newHash) {
  const db = getDatabase();
  db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, userId]);
  saveDatabase();
}

function createPendingOwner({ username, displayName, email, role, tenantId, platformAccountId, activationTokenHash, activationExpiresAt }) {
  const db = getDatabase();
  db.run(
    `INSERT INTO users (
      username, password_hash, display_name, email, role, tenant_id, platform_account_id,
      activation_token_hash, activation_expires_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      username,
      activationTokenHash,
      displayName,
      email,
      role,
      tenantId,
      platformAccountId,
      activationTokenHash,
      activationExpiresAt,
    ]
  );
  saveDatabase();
  return findByEmail(email);
}

function findByActivationTokenHash(tokenHash) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, username, display_name, email, role, is_active, tenant_id, platform_account_id, activation_expires_at, activation_used_at
     FROM users
     WHERE activation_token_hash = ?`,
    [tokenHash]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    username: row[1],
    displayName: row[2],
    email: row[3],
    role: row[4],
    isActive: row[5],
    tenantId: row[6],
    platformAccountId: row[7],
    activationExpiresAt: row[8],
    activationUsedAt: row[9],
  };
}

function activateUser(userId, passwordHash) {
  const db = getDatabase();
  db.run(
    `UPDATE users
     SET password_hash = ?, is_active = 1, activation_used_at = CURRENT_TIMESTAMP, activation_token_hash = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [passwordHash, userId]
  );
  saveDatabase();
  return findById(userId);
}

function updateSecurityQuestion(userId, question, answerHash) {
  const db = getDatabase();
  db.run('UPDATE users SET security_question = ?, security_answer_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [question, answerHash, userId]);
  saveDatabase();
}

function findByUsernameForReset(username) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, security_question, security_answer_hash FROM users WHERE username = ? AND is_active = 1',
    [username]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return { id: row[0], securityQuestion: row[1], securityAnswerHash: row[2] };
}

function getAvatar(userId) {
  const db = getDatabase();
  const result = db.exec('SELECT avatar FROM users WHERE id = ?', [userId]);
  if (!result.length || !result[0].values.length) return null;
  return result[0].values[0][0];
}

function updateAvatar(userId, avatarUrl) {
  const db = getDatabase();
  db.run('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [avatarUrl, userId]);
  saveDatabase();
}

function removeAvatar(userId) {
  const db = getDatabase();
  db.run('UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
  saveDatabase();
}

module.exports = {
  findByUsername,
  findByEmail,
  findById,
  findFullById,
  getPasswordHash,
  updateLastLogin,
  updateProfile,
  updatePassword,
  createPendingOwner,
  findByActivationTokenHash,
  activateUser,
  updateSecurityQuestion,
  findByUsernameForReset,
  getAvatar,
  updateAvatar,
  removeAvatar,
};
