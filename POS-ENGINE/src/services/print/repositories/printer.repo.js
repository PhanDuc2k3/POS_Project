const { getDatabase } = require('../database');

const rowToPrinter = (row) => ({
  id: row[0],
  storeId: row[1],
  name: row[2],
  type: row[3],
  interfacePath: row[4],
  vendorId: row[5],
  productId: row[6],
  paperWidth: row[7],
  charset: row[8],
  isDefault: row[9],
  isActive: row[10],
  createdAt: row[11],
  updatedAt: row[12],
});

function findByStoreId(storeId) {
  const db = getDatabase();
  const res = db.exec(
    `SELECT * FROM printers WHERE store_id = ? ORDER BY is_default DESC, id ASC`,
    [storeId],
  );
  if (!res.length) return [];
  return res[0].values.map(rowToPrinter);
}

function findById(id) {
  const db = getDatabase();
  const res = db.exec(`SELECT * FROM printers WHERE id = ?`, [id]);
  if (!res.length || !res[0].values.length) return null;
  return rowToPrinter(res[0].values[0]);
}

function findDefaultByStoreId(storeId) {
  const db = getDatabase();
  const res = db.exec(
    `SELECT * FROM printers WHERE store_id = ? AND is_default = 1 AND is_active = 1 LIMIT 1`,
    [storeId],
  );
  if (!res.length || !res[0].values.length) {
    // fallback to first active printer
    const fallback = db.exec(
      `SELECT * FROM printers WHERE store_id = ? AND is_active = 1 LIMIT 1`,
      [storeId],
    );
    if (!fallback.length || !fallback[0].values.length) return null;
    return rowToPrinter(fallback[0].values[0]);
  }
  return rowToPrinter(res[0].values[0]);
}

function create({ storeId, name, type, interfacePath, vendorId, productId, paperWidth, charset, isDefault }) {
  const db = getDatabase();
  if (isDefault) {
    db.run(`UPDATE printers SET is_default = 0 WHERE store_id = ?`, [storeId]);
  }
  db.run(
    `INSERT INTO printers
       (store_id, name, type, interface_path, vendor_id, product_id, paper_width, charset, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [storeId, name, type || 'usb', interfacePath ?? null, vendorId ?? null, productId ?? null,
     paperWidth ?? 80, charset || 'ASCII', isDefault ? 1 : 0],
  );
  const res = db.exec(`SELECT last_insert_rowid() as id`);
  return findById(res[0].values[0][0]);
}

function update(id, patch) {
  const db = getDatabase();
  const existing = findById(id);
  if (!existing) return null;
  if (patch.isDefault) {
    db.run(`UPDATE printers SET is_default = 0 WHERE store_id = ?`, [existing.storeId]);
  }
  db.run(
    `UPDATE printers
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           interface_path = COALESCE(?, interface_path),
           vendor_id = COALESCE(?, vendor_id),
           product_id = COALESCE(?, product_id),
           paper_width = COALESCE(?, paper_width),
           charset = COALESCE(?, charset),
           is_default = COALESCE(?, is_default),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      patch.name ?? null, patch.type ?? null, patch.interfacePath ?? null, patch.vendorId ?? null,
      patch.productId ?? null, patch.paperWidth ?? null, patch.charset ?? null,
      patch.isDefault === undefined ? null : (patch.isDefault ? 1 : 0),
      patch.isActive === undefined ? null : (patch.isActive ? 1 : 0),
      id,
    ],
  );
  return findById(id);
}

function remove(id) {
  const db = getDatabase();
  db.run(`DELETE FROM printers WHERE id = ?`, [id]);
}

module.exports = {
  findByStoreId,
  findById,
  findDefaultByStoreId,
  create,
  update,
  remove,
};
