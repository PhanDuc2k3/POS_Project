/**
 * Store Service - Business logic for store profile
 */

const { publish } = require('../../../shared/event-bus');
const storeRepo = require('../repositories/store.repo');

function getStore(userId) {
  if (!userId) return { error: 'User context required', status: 401 };
  return { data: storeRepo.getOrCreate(userId) };
}

function updateStore(userId, fields) {
  if (!userId) return { error: 'User context required', status: 401 };

  const { name, phone, address, logo, packageTier, operatingMode } = fields;
  const store = storeRepo.getOrCreate(userId);
  const normalizedPackageTier = normalizePackageTier(packageTier);
  const normalizedOperatingMode = normalizeOperatingMode(operatingMode);

  if (packageTier !== undefined && normalizedPackageTier === undefined) {
    return { error: 'Invalid package tier', status: 400 };
  }
  if (operatingMode !== undefined && normalizedOperatingMode === undefined) {
    return { error: 'Invalid operating mode', status: 400 };
  }

  const hasUpdates =
    name !== undefined ||
    phone !== undefined ||
    address !== undefined ||
    logo !== undefined ||
    packageTier !== undefined ||
    operatingMode !== undefined;
  if (!hasUpdates) return { error: 'KhÃ´ng cÃ³ thÃ´ng tin nÃ o Ä‘á»ƒ cáº­p nháº­t', status: 400 };

  storeRepo.update(store.id, {
    name,
    phone,
    address,
    logo,
    packageTier: normalizedPackageTier,
    operatingMode: normalizedOperatingMode,
  });

  const updated = storeRepo.getOrCreate(userId);
  publish('store.updated', { key: String(store.id), storeId: store.id, data: updated });
  return { data: { message: 'Cáº­p nháº­t cá»­a hÃ ng thÃ nh cÃ´ng', store: updated } };
}

function normalizePackageTier(value) {
  const allowed = new Set(['starter', 'pro', 'restaurant', 'chain']);
  return allowed.has(value) ? value : undefined;
}

function normalizeOperatingMode(value) {
  const allowed = new Set(['simple', 'restaurant']);
  return allowed.has(value) ? value : undefined;
}

module.exports = {
  getStore,
  updateStore,
};
