const { getDatabase } = require('../database');

const rowToTemplate = (row) => ({
  id: row[0],
  storeId: row[1],
  type: row[2],
  name: row[3],
  content: row[4],
  paperWidth: row[5],
  isDefault: row[6],
  createdAt: row[7],
  updatedAt: row[8],
});

function findDefaultByStoreId(storeId, type = 'receipt') {
  const db = getDatabase();
  // Try store-specific first, fallback to global (store_id=0)
  let res = db.exec(
    `SELECT * FROM print_templates WHERE store_id = ? AND type = ? AND is_default = 1 LIMIT 1`,
    [storeId, type],
  );
  if (!res.length || !res[0].values.length) {
    res = db.exec(
      `SELECT * FROM print_templates WHERE store_id = 0 AND type = ? AND is_default = 1 LIMIT 1`,
      [type],
    );
  }
  if (!res.length || !res[0].values.length) return null;
  return rowToTemplate(res[0].values[0]);
}

function findByStoreId(storeId) {
  const db = getDatabase();
  const res = db.exec(
    `SELECT * FROM print_templates WHERE store_id = ? ORDER BY is_default DESC, id ASC`,
    [storeId],
  );
  if (!res.length) return [];
  return res[0].values.map(rowToTemplate);
}

function findById(id) {
  const db = getDatabase();
  const res = db.exec(`SELECT * FROM print_templates WHERE id = ?`, [id]);
  if (!res.length || !res[0].values.length) return null;
  return rowToTemplate(res[0].values[0]);
}

function upsert({ storeId, type, name, content, paperWidth, isDefault }) {
  const db = getDatabase();
  if (isDefault) {
    // Reset other defaults in same store+type
    db.run(
      `UPDATE print_templates SET is_default = 0 WHERE store_id = ? AND type = ?`,
      [storeId, type],
    );
  }
  db.run(
    `INSERT INTO print_templates (store_id, type, name, content, paper_width, is_default)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [storeId, type || 'receipt', name, content, paperWidth ?? 80, isDefault ? 1 : 0],
  );
  const res = db.exec(`SELECT last_insert_rowid() as id`);
  return findById(res[0].values[0][0]);
}

function update(id, { name, content, paperWidth, isDefault }) {
  const db = getDatabase();
  const existing = findById(id);
  if (!existing) return null;
  if (isDefault) {
    db.run(
      `UPDATE print_templates SET is_default = 0 WHERE store_id = ? AND type = ? AND id != ?`,
      [existing.storeId, existing.type, id],
    );
  }
  db.run(
    `UPDATE print_templates
       SET name = COALESCE(?, name),
           content = COALESCE(?, content),
           paper_width = COALESCE(?, paper_width),
           is_default = COALESCE(?, is_default),
           updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name ?? null, content ?? null, paperWidth ?? null,
     isDefault === undefined ? null : (isDefault ? 1 : 0), id],
  );
  return findById(id);
}

function remove(id) {
  const db = getDatabase();
  db.run(`DELETE FROM print_templates WHERE id = ?`, [id]);
}

module.exports = {
  findDefaultByStoreId,
  findByStoreId,
  findById,
  upsert,
  update,
  remove,
};
