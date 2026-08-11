/**
 * Device Registry
 *
 * In-memory store of registered POS devices.
 * Key: deviceSerial (BIOS serial)
 * Value: { socketId, lastSeen, storeId, status, info }
 *
 * Used by:
 *   - websocket.js  (device:register, device:heartbeat → update registry)
 *   - gateway/index.js (emit print jobs, admin endpoints)
 *   - print.service.js (via gateway internal endpoint → WS → device)
 */

/** @type {Map<string, object>} */
const registry = new Map();

/**
 * Register a device or update existing entry.
 */
function register(serial, data) {
  registry.set(serial, {
    socketId: data.socketId || null,
    lastSeen: data.lastSeen || new Date().toISOString(),
    storeId: data.storeId || null,
    status: data.status || 'ONLINE',
    info: data.info || null,
    printerConnected: data.printerConnected || false,
  });
}

/**
 * Update device fields (e.g. on heartbeat).
 */
function update(serial, patch) {
  const existing = registry.get(serial);
  if (!existing) return;
  registry.set(serial, { ...existing, ...patch, lastSeen: new Date().toISOString() });
}

/**
 * Mark device offline by socketId (called on disconnect).
 */
function markOffline(socketId) {
  for (const [serial, entry] of registry.entries()) {
    if (entry.socketId === socketId) {
      registry.set(serial, { ...entry, status: 'OFFLINE', lastSeen: new Date().toISOString() });
      return serial;
    }
  }
  return null;
}

/**
 * Find serial by socketId.
 */
function findBySocketId(socketId) {
  for (const [serial, entry] of registry.entries()) {
    if (entry.socketId === socketId) return serial;
  }
  return null;
}

/**
 * Get device by serial.
 */
function get(serial) {
  return registry.get(serial) || null;
}

/**
 * Get all registered devices.
 */
function getAll() {
  return Array.from(registry.entries()).map(([serial, data]) => ({ serial, ...data }));
}

/**
 * Get devices filtered by storeId.
 */
function getByStoreId(storeId) {
  return getAll().filter((d) => d.storeId === storeId);
}

/**
 * Get device statistics.
 */
function getStats() {
  const stats = { online: 0, offline: 0, printing: 0, error: 0, total: registry.size };
  for (const d of registry.values()) {
    stats[d.status] = (stats[d.status] || 0) + 1;
  }
  return stats;
}

module.exports = { register, update, markOffline, findBySocketId, get, getAll, getByStoreId, getStats };
