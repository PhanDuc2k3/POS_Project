const { getDatabase } = require('../database');

const rowToJob = (row) => ({
  id: row[0],
  storeId: row[1],
  printerId: row[2],
  templateId: row[3],
  type: row[4],
  payload: row[5],
  status: row[6],
  attempts: row[7],
  maxAttempts: row[8],
  nextRetryAt: row[9],
  errorMessage: row[10],
  triggeredBy: row[11],
  triggeredByUserId: row[12],
  createdAt: row[13],
  startedAt: row[14],
  completedAt: row[15],
});

function create({ storeId, printerId, templateId, type, payload, triggeredBy, triggeredByUserId, maxAttempts }) {
  const db = getDatabase();
  const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);
  db.run(
    `INSERT INTO print_jobs
       (store_id, printer_id, template_id, type, payload, status, max_attempts, triggered_by, triggered_by_user_id)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [storeId, printerId ?? null, templateId ?? null, type, payloadJson,
     maxAttempts || 3, triggeredBy || 'api', triggeredByUserId ?? null],
  );
  const res = db.exec(`SELECT last_insert_rowid() as id`);
  return findById(res[0].values[0][0]);
}

function findById(id) {
  const db = getDatabase();
  const res = db.exec(`SELECT * FROM print_jobs WHERE id = ?`, [id]);
  if (!res.length || !res[0].values.length) return null;
  return rowToJob(res[0].values[0]);
}

function findByStoreId(storeId, limit = 100) {
  const db = getDatabase();
  const res = db.exec(
    `SELECT * FROM print_jobs WHERE store_id = ? ORDER BY id DESC LIMIT ?`,
    [storeId, limit],
  );
  if (!res.length) return [];
  return res[0].values.map(rowToJob);
}

/**
 * Claim next pending job that's due to run.
 * Atomic-ish update; uses status guard to avoid double-claim by two pollers.
 */
function claimNext() {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Find candidate
  const res = db.exec(
    `SELECT id FROM print_jobs
     WHERE status = 'pending'
       AND (next_retry_at IS NULL OR next_retry_at <= ?)
     ORDER BY id ASC LIMIT 1`,
    [now],
  );
  if (!res.length || !res[0].values.length) return null;

  const id = res[0].values[0][0];

  // Atomic claim
  const upd = db.exec(
    `UPDATE print_jobs
       SET status = 'printing', started_at = ?, attempts = attempts + 1
     WHERE id = ? AND status = 'pending'
     RETURNING *`,
    [now, id],
  );

  if (!upd.length || !upd[0].values.length) return null;
  return rowToJob(upd[0].values[0]);
}

function markDone(id) {
  const db = getDatabase();
  db.run(
    `UPDATE print_jobs
       SET status = 'done', completed_at = CURRENT_TIMESTAMP, error_message = NULL
     WHERE id = ?`,
    [id],
  );
}

function markFailed(id, errorMessage, retryAt) {
  const db = getDatabase();
  db.run(
    `UPDATE print_jobs
       SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
           error_message = ?,
           next_retry_at = ?
     WHERE id = ?`,
    [errorMessage, retryAt || null, id],
  );
}

function cancel(id) {
  const db = getDatabase();
  db.run(
    `UPDATE print_jobs SET status = 'cancelled' WHERE id = ? AND status IN ('pending', 'printing')`,
    [id],
  );
}

function retry(id) {
  const db = getDatabase();
  const job = findById(id);
  if (!job) return null;
  if (!['failed', 'cancelled'].includes(job.status)) return null;
  db.run(
    `UPDATE print_jobs
       SET status = 'pending', attempts = 0, next_retry_at = NULL, error_message = NULL,
           completed_at = NULL
     WHERE id = ?`,
    [id],
  );
  return findById(id);
}

module.exports = {
  create,
  findById,
  findByStoreId,
  claimNext,
  markDone,
  markFailed,
  cancel,
  retry,
};
