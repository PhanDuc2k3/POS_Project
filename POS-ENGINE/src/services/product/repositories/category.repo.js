/**
 * Category Repository - DB queries for categories table
 */

const { getDatabase, saveDatabase } = require('../database');

function findAllByStoreId(storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, name, sort_order, is_active, created_at FROM categories WHERE store_id = ? ORDER BY sort_order, id',
    [storeId]
  );
  if (!result.length) return [];
  return result[0].values.map(r => ({ id: r[0], name: r[1], sortOrder: r[2], isActive: !!r[3], createdAt: r[4] }));
}

function findActiveByStoreId(storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, name, sort_order FROM categories WHERE store_id = ? AND is_active = 1 ORDER BY sort_order, id',
    [storeId]
  );
  if (!result.length) return [];
  return result[0].values.map(r => ({ id: r[0], name: r[1], sortOrder: r[2] }));
}

function create(storeId, name, sortOrder) {
  const db = getDatabase();
  db.run('INSERT INTO categories (store_id, name, sort_order) VALUES (?, ?, ?)', [storeId, name, sortOrder || 0]);
  saveDatabase();
  const idResult = db.exec('SELECT last_insert_rowid()');
  return idResult[0].values[0][0];
}

function update(categoryId, storeId, fields) {
  const db = getDatabase();
  const updates = [];
  const params = [];
  if (fields.name !== undefined) { updates.push('name = ?'); params.push(fields.name); }
  if (fields.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(fields.sortOrder); }
  if (fields.isActive !== undefined) { updates.push('is_active = ?'); params.push(fields.isActive ? 1 : 0); }
  if (!updates.length) return false;

  params.push(categoryId, storeId);
  db.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND store_id = ?`, params);
  saveDatabase();
  return true;
}

function remove(categoryId, storeId) {
  const db = getDatabase();
  db.run('UPDATE products SET category_id = NULL WHERE category_id = ? AND store_id = ?', [categoryId, storeId]);
  db.run('DELETE FROM categories WHERE id = ? AND store_id = ?', [categoryId, storeId]);
  saveDatabase();
}

module.exports = {
  findAllByStoreId,
  findActiveByStoreId,
  create,
  update,
  remove,
};
