/**
 * Topping Repository - DB queries for topping_groups and toppings tables
 */

const { getDatabase, saveDatabase } = require('../database');

// ─── Topping Groups ──────────────────────────────────────────────────

function findGroupsByStoreId(storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, name, is_required, max_select, sort_order, created_at FROM topping_groups WHERE store_id = ? ORDER BY sort_order, id',
    [storeId]
  );
  if (!result.length) return [];

  return result[0].values.map(r => {
    const group = { id: r[0], name: r[1], isRequired: !!r[2], maxSelect: r[3], sortOrder: r[4], createdAt: r[5], toppings: [] };

    const toppings = db.exec(
      'SELECT id, name, price, is_available, sort_order FROM toppings WHERE group_id = ? ORDER BY sort_order, id',
      [group.id]
    );
    if (toppings.length) {
      group.toppings = toppings[0].values.map(t => ({
        id: t[0], name: t[1], price: t[2], isAvailable: !!t[3], sortOrder: t[4],
      }));
    }

    return group;
  });
}

function createGroup(storeId, { name, isRequired, maxSelect, sortOrder }) {
  const db = getDatabase();
  db.run(
    'INSERT INTO topping_groups (store_id, name, is_required, max_select, sort_order) VALUES (?, ?, ?, ?, ?)',
    [storeId, name, isRequired ? 1 : 0, maxSelect || 0, sortOrder || 0]
  );
  saveDatabase();
  const idResult = db.exec('SELECT last_insert_rowid()');
  return idResult[0].values[0][0];
}

function updateGroup(groupId, storeId, fields) {
  const db = getDatabase();
  const updates = [];
  const params = [];
  if (fields.name !== undefined) { updates.push('name = ?'); params.push(fields.name); }
  if (fields.isRequired !== undefined) { updates.push('is_required = ?'); params.push(fields.isRequired ? 1 : 0); }
  if (fields.maxSelect !== undefined) { updates.push('max_select = ?'); params.push(fields.maxSelect); }
  if (fields.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(fields.sortOrder); }
  if (!updates.length) return false;

  params.push(groupId, storeId);
  db.run(`UPDATE topping_groups SET ${updates.join(', ')} WHERE id = ? AND store_id = ?`, params);
  saveDatabase();
  return true;
}

function removeGroup(groupId, storeId) {
  const db = getDatabase();
  db.run('DELETE FROM toppings WHERE group_id = ? AND store_id = ?', [groupId, storeId]);
  db.run('DELETE FROM product_topping_groups WHERE group_id = ?', [groupId]);
  db.run('DELETE FROM topping_groups WHERE id = ? AND store_id = ?', [groupId, storeId]);
  saveDatabase();
}

// ─── Toppings ────────────────────────────────────────────────────────

function createTopping(storeId, { groupId, name, price }) {
  const db = getDatabase();
  db.run(
    'INSERT INTO toppings (group_id, store_id, name, price) VALUES (?, ?, ?, ?)',
    [groupId, storeId, name, price || 0]
  );
  saveDatabase();
  const idResult = db.exec('SELECT last_insert_rowid()');
  return idResult[0].values[0][0];
}

function updateTopping(toppingId, storeId, fields) {
  const db = getDatabase();
  const updates = [];
  const params = [];
  if (fields.name !== undefined) { updates.push('name = ?'); params.push(fields.name); }
  if (fields.price !== undefined) { updates.push('price = ?'); params.push(fields.price); }
  if (fields.isAvailable !== undefined) { updates.push('is_available = ?'); params.push(fields.isAvailable ? 1 : 0); }
  if (fields.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(fields.sortOrder); }
  if (!updates.length) return false;

  params.push(toppingId, storeId);
  db.run(`UPDATE toppings SET ${updates.join(', ')} WHERE id = ? AND store_id = ?`, params);
  saveDatabase();
  return true;
}

function removeTopping(toppingId, storeId) {
  const db = getDatabase();
  db.run('DELETE FROM toppings WHERE id = ? AND store_id = ?', [toppingId, storeId]);
  saveDatabase();
}

module.exports = {
  findGroupsByStoreId,
  createGroup,
  updateGroup,
  removeGroup,
  createTopping,
  updateTopping,
  removeTopping,
};
