/**
 * Product Repository - DB queries for products table
 */

const { getDatabase, saveDatabase } = require('../database');

function findAllByStoreId(storeId, { categoryId, available } = {}) {
  const db = getDatabase();
  let sql = `SELECT p.id, p.category_id, c.name as category_name, p.name, p.price, p.image, p.description, p.is_available, p.sort_order, p.created_at
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.store_id = ?`;
  const params = [storeId];

  if (categoryId) { sql += ' AND p.category_id = ?'; params.push(categoryId); }
  if (available === '1') { sql += ' AND p.is_available = 1'; }
  sql += ' ORDER BY COALESCE(c.sort_order, 9999), p.sort_order, p.id';

  const result = db.exec(sql, params);
  if (!result.length) return [];

  return result[0].values.map(r => ({
    id: r[0], categoryId: r[1], categoryName: r[2], name: r[3], price: r[4],
    image: r[5], description: r[6], isAvailable: !!r[7], sortOrder: r[8], createdAt: r[9],
  }));
}

function findAllByStoreIdWithToppings(storeId, { categoryId, available } = {}) {
  const db = getDatabase();
  const products = findAllByStoreId(storeId, { categoryId, available });

  // Fetch topping groups for each product
  for (const product of products) {
    product.toppingGroups = getProductToppingGroups(product.id);
  }

  return products;
}

function findAvailableByStoreId(storeId) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT p.id, p.category_id, p.name, p.price, p.image, p.description
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.store_id = ? AND p.is_available = 1
     ORDER BY COALESCE(c.sort_order, 9999), p.sort_order, p.id`,
    [storeId]
  );
  if (!result.length) return [];
  const products = result[0].values.map(r => ({
    id: r[0], categoryId: r[1], name: r[2], price: r[3], image: r[4], description: r[5],
  }));

  // Attach topping groups
  for (const product of products) {
    product.toppingGroups = getProductToppingGroups(product.id);
  }

  return products;
}

function getProductToppingGroups(productId) {
  const db = getDatabase();
  const groupResult = db.exec(
    `SELECT tg.id, tg.name, tg.is_required, tg.max_select, tg.sort_order
     FROM topping_groups tg
     INNER JOIN product_topping_groups ptg ON ptg.group_id = tg.id
     WHERE ptg.product_id = ?
     ORDER BY tg.sort_order, tg.id`,
    [productId]
  );

  if (!groupResult.length) return [];

  return groupResult[0].values.map(g => {
    const group = { id: g[0], name: g[1], isRequired: !!g[2], maxSelect: g[3], sortOrder: g[4], toppings: [] };

    const toppingResult = db.exec(
      'SELECT id, name, price, is_available, sort_order FROM toppings WHERE group_id = ? AND is_available = 1 ORDER BY sort_order, id',
      [group.id]
    );
    if (toppingResult.length) {
      group.toppings = toppingResult[0].values.map(t => ({
        id: t[0], name: t[1], price: t[2], isAvailable: !!t[3], sortOrder: t[4],
      }));
    }

    return group;
  });
}

function create(storeId, { name, price, categoryId, image, description }) {
  const db = getDatabase();
  db.run(
    'INSERT INTO products (store_id, category_id, name, price, image, description) VALUES (?, ?, ?, ?, ?, ?)',
    [storeId, categoryId || null, name, price, image || null, description || null]
  );
  saveDatabase();
  const idResult = db.exec('SELECT last_insert_rowid()');
  return idResult[0].values[0][0];
}

function update(productId, storeId, fields) {
  const db = getDatabase();
  const updates = [];
  const params = [];
  if (fields.name !== undefined) { updates.push('name = ?'); params.push(fields.name); }
  if (fields.price !== undefined) { updates.push('price = ?'); params.push(fields.price); }
  if (fields.categoryId !== undefined) { updates.push('category_id = ?'); params.push(fields.categoryId || null); }
  if (fields.image !== undefined) { updates.push('image = ?'); params.push(fields.image || null); }
  if (fields.description !== undefined) { updates.push('description = ?'); params.push(fields.description || null); }
  if (fields.isAvailable !== undefined) { updates.push('is_available = ?'); params.push(fields.isAvailable ? 1 : 0); }
  if (fields.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(fields.sortOrder); }
  if (!updates.length) return false;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(productId, storeId);
  db.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ? AND store_id = ?`, params);
  saveDatabase();
  return true;
}

function remove(productId, storeId) {
  const db = getDatabase();
  db.run('DELETE FROM product_topping_groups WHERE product_id = ?', [productId]);
  db.run('DELETE FROM products WHERE id = ? AND store_id = ?', [productId, storeId]);
  saveDatabase();
}

function toggleAvailability(productId, storeId) {
  const db = getDatabase();
  const result = db.exec('SELECT is_available FROM products WHERE id = ? AND store_id = ?', [productId, storeId]);
  if (!result.length || !result[0].values.length) return null;

  const current = result[0].values[0][0];
  db.run('UPDATE products SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?',
    [current ? 0 : 1, productId, storeId]);
  saveDatabase();
  return !current;
}

function linkToppingGroup(productId, groupId) {
  const db = getDatabase();
  try {
    db.run('INSERT INTO product_topping_groups (product_id, group_id) VALUES (?, ?)', [productId, groupId]);
    saveDatabase();
    return true;
  } catch (e) {
    return false; // Already linked
  }
}

function unlinkToppingGroup(productId, groupId) {
  const db = getDatabase();
  db.run('DELETE FROM product_topping_groups WHERE product_id = ? AND group_id = ?', [productId, groupId]);
  saveDatabase();
}

module.exports = {
  findAllByStoreId,
  findAllByStoreIdWithToppings,
  findAvailableByStoreId,
  getProductToppingGroups,
  create,
  update,
  remove,
  toggleAvailability,
  linkToppingGroup,
  unlinkToppingGroup,
};
