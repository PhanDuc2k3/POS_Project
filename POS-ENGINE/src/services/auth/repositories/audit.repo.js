/**
 * Audit Repository - Direct DB queries for audit_log table
 */

const { getDatabase, saveDatabase } = require('../database');

function create(userId, action, details, ip) {
  const db = getDatabase();
  db.run('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [userId, action, details || null, ip || null]);
  saveDatabase();
}

function findByUserId(userId, limit, offset) {
  const db = getDatabase();

  const countResult = db.exec('SELECT COUNT(*) FROM audit_log WHERE user_id = ?', [userId]);
  const total = countResult[0]?.values[0]?.[0] || 0;

  const result = db.exec(
    `SELECT id, action, details, ip_address, created_at 
     FROM audit_log WHERE user_id = ? 
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  if (!result.length) return { items: [], total };

  const items = result[0].values.map((row) => ({
    id: row[0], action: row[1], details: row[2], ipAddress: row[3], createdAt: row[4],
  }));

  return { items, total };
}

module.exports = {
  create,
  findByUserId,
};
