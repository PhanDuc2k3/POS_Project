/**
 * Dining Session Repository - DB queries for restaurant sessions
 */

const { getDatabase, saveDatabase } = require('../database');
const { nowVietnamSql, todayVietnamCompact } = require('../../../shared/time');

function create(storeId, { tableCode, guestCount = 1, note, openedById, openedByName }) {
  const db = getDatabase();
  const sessionCode = generateSessionCode(storeId);
  db.run(
    `INSERT INTO dining_sessions (
       store_id, session_code, table_code, guest_count, status, note,
       opened_by_id, opened_by_name, opened_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?)`,
    [
      storeId,
      sessionCode,
      tableCode || null,
      guestCount || 1,
      note || null,
      openedById || null,
      openedByName || null,
      nowVietnamSql(),
      nowVietnamSql(),
      nowVietnamSql(),
    ]
  );
  saveDatabase();

  const result = db.exec(
    'SELECT id, store_id, session_code, table_code, guest_count, status, note, opened_by_id, opened_by_name, opened_at, closed_at, created_at, updated_at FROM dining_sessions WHERE store_id = ? AND session_code = ?',
    [storeId, sessionCode]
  );
  return result.length && result[0].values.length ? mapRow(result[0].values[0]) : null;
}

function findById(id, storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, store_id, session_code, table_code, guest_count, status, note, opened_by_id, opened_by_name, opened_at, closed_at, created_at, updated_at FROM dining_sessions WHERE id = ? AND store_id = ?',
    [id, storeId]
  );
  if (!result.length || !result[0].values.length) return null;
  return mapRow(result[0].values[0]);
}

function findByCode(sessionCode, storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, store_id, session_code, table_code, guest_count, status, note, opened_by_id, opened_by_name, opened_at, closed_at, created_at, updated_at FROM dining_sessions WHERE session_code = ? AND store_id = ?',
    [sessionCode, storeId]
  );
  if (!result.length || !result[0].values.length) return null;
  return mapRow(result[0].values[0]);
}

function findAll(storeId, { status, page = 1, limit = 20 } = {}) {
  const db = getDatabase();
  let sql = 'SELECT id, store_id, session_code, table_code, guest_count, status, note, opened_by_id, opened_by_name, opened_at, closed_at, created_at, updated_at FROM dining_sessions WHERE store_id = ?';
  const params = [storeId];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const result = db.exec(sql, params);
  const items = result.length ? result[0].values.map(mapRow) : [];
  const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) FROM').replace(/ ORDER BY .+$/, '');
  const totalResult = db.exec(countSql, params.slice(0, params.length - 2));
  const total = totalResult[0]?.values[0]?.[0] || 0;

  return { items, total, page: parseInt(page), limit: parseInt(limit) };
}

function findOpen(storeId, limit = 20) {
  return findAll(storeId, { status: 'open', page: 1, limit }).items;
}

function updateStatus(id, storeId, status) {
  const db = getDatabase();
  db.run(
    "UPDATE dining_sessions SET status = ?, closed_at = CASE WHEN ? = 'closed' THEN ? ELSE closed_at END, updated_at = ? WHERE id = ? AND store_id = ?",
    [status, status, nowVietnamSql(), nowVietnamSql(), id, storeId]
  );
  saveDatabase();
}

function addOrderLink(sessionId, storeId, orderId, tableCode) {
  const db = getDatabase();
  db.run(
    'UPDATE orders SET dining_session_id = ?, table_code = COALESCE(?, table_code), service_mode = \'restaurant\' WHERE id = ? AND store_id = ?',
    [String(sessionId), tableCode || null, orderId, storeId]
  );
  saveDatabase();
}

function countToday(storeId) {
  const db = getDatabase();
  const today = todayVietnamCompact();
  const result = db.exec(
    "SELECT COUNT(*) FROM dining_sessions WHERE store_id = ? AND substr(created_at, 1, 10) = ?",
    [storeId, `${today.slice(0, 4)}-${today.slice(4, 6)}-${today.slice(6, 8)}`]
  );
  return result[0]?.values[0]?.[0] || 0;
}

function mapRow(r) {
  return {
    id: r[0],
    storeId: r[1],
    sessionCode: r[2],
    tableCode: r[3],
    guestCount: r[4],
    status: r[5],
    note: r[6],
    openedById: r[7],
    openedByName: r[8],
    openedAt: r[9],
    closedAt: r[10],
    createdAt: r[11],
    updatedAt: r[12],
  };
}

function generateSessionCode(storeId) {
  const db = getDatabase();
  const today = todayVietnamCompact();
  const result = db.exec(
    "SELECT COUNT(*) FROM dining_sessions WHERE store_id = ? AND substr(created_at, 1, 8) = ?",
    [storeId, today]
  );
  const seq = (result[0]?.values[0]?.[0] || 0) + 1;
  return `DS-${today}-${String(seq).padStart(3, '0')}`;
}

module.exports = {
  create,
  findById,
  findByCode,
  findAll,
  findOpen,
  updateStatus,
  addOrderLink,
  countToday,
};
