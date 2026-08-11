/**
 * Printer Module - Main entry
 * Exports all printer functionality for use in Electron main process
 */

const { print, loadConfig, saveConfig, testConnection, listPrinters, isConnected, DEFAULT_CONFIG } = require('./printer');
const { formatReceipt } = require('./receipt-formatter');
const { ReceiptBuilder } = require('./escpos');

module.exports = {
  print,
  loadConfig,
  saveConfig,
  testConnection,
  listPrinters,
  isConnected,
  formatReceipt,
  ReceiptBuilder,
  DEFAULT_CONFIG,
};
