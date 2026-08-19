/**
 * Store Repository - DB queries for stores table
 */

const { getDatabase, saveDatabase } = require('../database');

function findByOwnerId(ownerId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, owner_id, name, phone, address, logo, package_tier, operating_mode, created_at, updated_at, tenant_id, platform_store_id, max_store FROM stores WHERE owner_id = ?',
    [ownerId]
  );
  if (!result.length || !result[0].values.length) return null;
  const r = result[0].values[0];
  return {
    id: r[0],
    ownerId: r[1],
    name: r[2],
    phone: r[3],
    address: r[4],
    logo: r[5],
    packageTier: r[6] || 'starter',
    operatingMode: r[7] || 'simple',
    createdAt: r[8],
    updatedAt: r[9],
    tenantId: r[10],
    platformStoreId: r[11],
    maxStore: r[12] || 1,
  };
}

function create(ownerId, name) {
  const db = getDatabase();
  const storeName = name || 'C\u1EEDa h\u00E0ng c\u1EE7a t\u00F4i';
  db.run(
    'INSERT INTO stores (owner_id, name, package_tier, operating_mode) VALUES (?, ?, ?, ?)',
    [ownerId, storeName, 'starter', 'simple']
  );
  saveDatabase();
}

function createProvisioned({ ownerId, tenantId, platformStoreId, name, packageTier, operatingMode, maxStore }) {
  const db = getDatabase();
  db.run(
    `INSERT INTO stores (owner_id, tenant_id, platform_store_id, name, package_tier, operating_mode, max_store)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ownerId, tenantId, platformStoreId, name, packageTier, operatingMode, maxStore]
  );
  saveDatabase();
  return findByOwnerId(ownerId);
}

function findByPlatformStoreId(platformStoreId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT owner_id FROM stores WHERE platform_store_id = ?',
    [platformStoreId]
  );
  if (!result.length || !result[0].values.length) return null;
  return findByOwnerId(result[0].values[0][0]);
}

function update(storeId, fields) {
  const db = getDatabase();
  const updates = [];
  const params = [];
  if (fields.name !== undefined) {
    updates.push('name = ?');
    params.push(fields.name);
  }
  if (fields.phone !== undefined) {
    updates.push('phone = ?');
    params.push(fields.phone);
  }
  if (fields.address !== undefined) {
    updates.push('address = ?');
    params.push(fields.address);
  }
  if (fields.logo !== undefined) {
    updates.push('logo = ?');
    params.push(fields.logo);
  }
  if (fields.packageTier !== undefined) {
    updates.push('package_tier = ?');
    params.push(fields.packageTier);
  }
  if (fields.operatingMode !== undefined) {
    updates.push('operating_mode = ?');
    params.push(fields.operatingMode);
  }
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
  findByPlatformStoreId,
  create,
  createProvisioned,
  update,
  getOrCreate,
};
