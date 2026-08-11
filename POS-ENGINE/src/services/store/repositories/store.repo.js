/**
 * Store Repository - DB queries for stores table
 */

const { getDatabase, saveDatabase } = require('../database');

function findByOwnerId(ownerId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, owner_id, name, phone, address, logo, created_at, updated_at FROM stores WHERE owner_id = ?',
    [ownerId]
  );
  if (!result.length || !result[0].values.length) return null;
  const r = result[0].values[0];
  return { id: r[0], ownerId: r[1], name: r[2], phone: r[3], address: r[4], logo: r[5], createdAt: r[6], updatedAt: r[7] };
}

function create(ownerId, name) {
  const db = getDatabase();
  const storeName = name || 'C\u1EEDa h\u00E0ng c\u1EE7a t\u00F4i'; // Cửa hàng của tôi
  db.run('INSERT INTO stores (owner_id, name) VALUES (?, ?)', [ownerId, storeName]);
  saveDatabase();
}

function update(storeId, fields) {
  const db = getDatabase();
  const updates = [];
  const params = [];
  if (fields.name !== undefined) { updates.push('name = ?'); params.push(fields.name); }
  if (fields.phone !== undefined) { updates.push('phone = ?'); params.push(fields.phone); }
  if (fields.address !== undefined) { updates.push('address = ?'); params.push(fields.address); }
  if (fields.logo !== undefined) { updates.push('logo = ?'); params.push(fields.logo); }
  if (!updates.length) return false;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(storeId);
  db.run(`UPDATE stores SET ${updates.join(', ')} WHERE id = ?`, params);
  saveDatabase();
  return true;
}

function getOrCreate(userId) {
  let store = findByOwnerId(userId);
  if (store) return store;
  create(userId);
  return findByOwnerId(userId);
}

module.exports = {
  findByOwnerId,
  create,
  update,
  getOrCreate,
};
