/**
 * Receipt Repository - DB queries for receipt_configs table
 */

const { getDatabase, saveDatabase } = require('../database');

const DEFAULT_BLOCKS = ['header','storeInfo','divider','orderInfo','divider','items','total','qr','footer'];

function findByStoreId(storeId) {
  const db = getDatabase();
  const result = db.exec(
    'SELECT id, header, footer, show_qr, show_logo, show_time, show_txn_id, show_store_info, paper_width, blocks, tax_rate FROM receipt_configs WHERE store_id = ?',
    [storeId]
  );
  if (!result.length || !result[0].values.length) return null;
  const r = result[0].values[0];
  let blocks = DEFAULT_BLOCKS;
  // blocks might be undefined for old records (column didn't exist)
  if (r[9] !== undefined && r[9] !== null) {
    try { blocks = JSON.parse(r[9]); } catch { blocks = DEFAULT_BLOCKS; }
  }
  return {
    id: r[0], header: r[1], footer: r[2], showQR: !!r[3], showLogo: !!r[4],
    showTime: !!r[5], showTxnId: !!r[6], showStoreInfo: !!r[7], paperWidth: r[8], blocks,
    taxRate: r[10] === undefined || r[10] === null ? 8 : Number(r[10]),
  };
}

function upsert(storeId, { header, footer, showQR, showLogo, showTime, showTxnId, showStoreInfo, paperWidth, blocks, taxRate }) {
  const db = getDatabase();
  const blocksJson = JSON.stringify(blocks && blocks.length ? blocks : DEFAULT_BLOCKS);
  const parsedTaxRate = Number(taxRate);
  const normalizedTaxRate = Number.isFinite(parsedTaxRate)
    ? Math.min(100, Math.max(0, parsedTaxRate))
    : 8;
  const existing = db.exec('SELECT id FROM receipt_configs WHERE store_id = ?', [storeId]);
  if (existing.length && existing[0].values.length) {
    db.run(
      `UPDATE receipt_configs SET header=?, footer=?, show_qr=?, show_logo=?, show_time=?, show_txn_id=?, show_store_info=?, paper_width=?, blocks=?, tax_rate=?, updated_at=CURRENT_TIMESTAMP WHERE store_id=?`,
      [header, footer, showQR?1:0, showLogo?1:0, showTime?1:0, showTxnId?1:0, showStoreInfo?1:0, paperWidth||'58mm', blocksJson, normalizedTaxRate, storeId]
    );
  } else {
    db.run(
      `INSERT INTO receipt_configs (store_id, header, footer, show_qr, show_logo, show_time, show_txn_id, show_store_info, paper_width, blocks, tax_rate) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [storeId, header, footer, showQR?1:0, showLogo?1:0, showTime?1:0, showTxnId?1:0, showStoreInfo?1:0, paperWidth||'58mm', blocksJson, normalizedTaxRate]
    );
  }
  saveDatabase();
}

module.exports = {
  findByStoreId,
  upsert,
};
