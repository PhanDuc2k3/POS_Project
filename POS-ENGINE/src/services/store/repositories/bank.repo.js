/**
 * Bank Repository - DB queries for bank_configs table
 */

const { getDatabase, saveDatabase } = require('../database');

function findByStoreId(storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, bank_name, bank_bin, account_name, account_number, qr_provider, is_active FROM bank_configs WHERE store_id = ?',
    [storeId]
  );
  if (!result.length || !result[0].values.length) return null;
  const r = result[0].values[0];
  return { id: r[0], bankName: r[1], bankBin: r[2] || inferBankBin(r[1]), accountName: r[3], accountNumber: r[4], qrProvider: r[5], isActive: !!r[6] };
}

function findActiveByStoreId(storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT bank_name, bank_bin, account_name, account_number, qr_provider FROM bank_configs WHERE store_id = ? AND is_active = 1',
    [storeId]
  );
  if (!result.length || !result[0].values.length) return null;
  const r = result[0].values[0];
  return { bankName: r[0], bankBin: r[1] || inferBankBin(r[0]), accountName: r[2], accountNumber: r[3], qrProvider: r[4] };
}

function upsert(storeId, { bankName, bankBin, accountName, accountNumber, qrProvider }) {
  const db = getDatabase();
  const existing = db.exec('SELECT id FROM bank_configs WHERE store_id = ?', [storeId]);
  if (existing.length && existing[0].values.length) {
    db.run(
      `UPDATE bank_configs SET bank_name=?, bank_bin=?, account_name=?, account_number=?, qr_provider=?, updated_at=CURRENT_TIMESTAMP WHERE store_id=?`,
      [bankName, bankBin, accountName, accountNumber, qrProvider || 'VietQR', storeId]
    );
  } else {
    db.run(
      `INSERT INTO bank_configs (store_id, bank_name, bank_bin, account_name, account_number, qr_provider) VALUES (?,?,?,?,?,?)`,
      [storeId, bankName, bankBin, accountName, accountNumber, qrProvider || 'VietQR']
    );
  }
  saveDatabase();
}

function inferBankBin(bankName) {
  const key = String(bankName || '').toLowerCase().replace(/\s+/g, '');
  const bins = {
    mb: '970422',
    mbbank: '970422',
    vietcombank: '970436',
    vcb: '970436',
    techcombank: '970407',
    tcb: '970407',
    bidv: '970418',
    vietinbank: '970415',
    acb: '970416',
    tpbank: '970423',
    vpbank: '970432',
    sacombank: '970403',
    vib: '970441',
    ocb: '970448',
    msb: '970426',
    shb: '970443',
    hdbank: '970437',
    agribank: '970405',
  };
  return bins[key] || null;
}

module.exports = {
  findByStoreId,
  findActiveByStoreId,
  upsert,
};
