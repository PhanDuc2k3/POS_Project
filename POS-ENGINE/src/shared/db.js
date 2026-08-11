/**
 * Shared Database Helper for sql.js
 *
 * Features:
 *  - Dirty tracking: mark db dirty khi có thay đổi
 *  - Auto-save timer: tự động flush xuống disk mỗi AUTO_SAVE_INTERVAL_MS
 *  - Graceful flush: saveDatabase() không bao giờ throw nếu lỗi (chỉ log)
 *  - Singleton: chia sẻ giữa các services trong cùng process
 *
 * Mỗi service gọi `markDirty()` sau mỗi db.run() thay đổi dữ liệu.
 * Auto-save sẽ tự động gọi saveDatabase() nếu dirty.
 *
 * Để dùng:
 *   const { getDb, markDirty, flushDatabase, startAutoSave, stopAutoSave } = require('../../shared/db');
 *   await initDb();
 *   db.run('INSERT ...');
 *   markDirty();
 */

const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const AUTO_SAVE_INTERVAL_MS = parseInt(process.env.DB_AUTO_SAVE_MS) || 30000;
const BACKUP_BEFORE_SAVE = process.env.DB_BACKUP !== 'false'; // mặc định bật backup

let dirty = false;
let autoSaveTimer = null;
let saving = false;

/**
 * Mark database as dirty. Sẽ được auto-save trong interval tiếp theo.
 */
function markDirty() {
  dirty = true;
}

/**
 * Lưu database xuống disk (atomic write + backup).
 * Trả về true nếu save thành công, false nếu có lỗi (không throw).
 */
function flushDatabase(db, dbPath) {
  if (!db) return false;
  if (saving) return false; // Tránh save chồng
  saving = true;

  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Backup file cũ trước khi ghi đè (atomic-ish)
    if (BACKUP_BEFORE_SAVE && fs.existsSync(dbPath)) {
      const backupPath = dbPath + '.bak';
      try {
        fs.copyFileSync(dbPath, backupPath);
      } catch (e) {
        // Backup fail không chặn save chính
        logger.warn('DB backup failed', { error: e.message });
      }
    }

    // Ghi file tạm trước, rename để tránh corrupt giữa chừng
    const tmpPath = dbPath + '.tmp';
    fs.writeFileSync(tmpPath, Buffer.from(db.export()));
    fs.renameSync(tmpPath, dbPath);

    dirty = false;
    return true;
  } catch (err) {
    logger.error('DB save failed', { error: err.message });
    return false;
  } finally {
    saving = false;
  }
}

/**
 * Khởi động auto-save timer. Gọi 1 lần sau khi db đã init.
 */
function startAutoSave(db, dbPath) {
  if (autoSaveTimer) return; // Đã chạy rồi

  autoSaveTimer = setInterval(() => {
    if (!dirty) return;
    const ok = flushDatabase(db, dbPath);
    if (ok) {
      logger.debug('DB auto-saved', { sizeKb: (fs.statSync(dbPath).size / 1024).toFixed(1) });
    }
  }, AUTO_SAVE_INTERVAL_MS);

  // Đảm bảo timer không block shutdown
  if (autoSaveTimer.unref) autoSaveTimer.unref();

  logger.debug('DB auto-save enabled', { intervalMs: AUTO_SAVE_INTERVAL_MS });
}

/**
 * Dừng auto-save timer (gọi khi shutdown).
 */
function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

/**
 * Force save ngay lập tức (dùng trước khi shutdown).
 */
function flushNow(db, dbPath) {
  return flushDatabase(db, dbPath);
}

module.exports = {
  markDirty,
  flushDatabase,
  flushNow,
  startAutoSave,
  stopAutoSave,
  AUTO_SAVE_INTERVAL_MS,
};