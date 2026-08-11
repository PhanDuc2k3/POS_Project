/**
 * Template Service
 *
 * Loads a store's default template by type (receipt/kitchen) and renders it
 * with the provided payload using EJS syntax (control via `<% %>` / `<%= %>`).
 */

const ejs = require('ejs');
const templateRepo = require('../repositories/template.repo');
const { displayWidth } = require('./escpos.service');

/**
 * Format VND-style currency.
 */
function formatMoney(n) {
  const num = Number(n) || 0;
  const formatted = num.toLocaleString('vi-VN');
  return `${formatted} ₫`;
}

function buildHelpers() {
  return { formatMoney, displayWidth };
}

/**
 * Render a template (raw string) with payload + helpers.
 */
function renderContent(content, payload) {
  const data = { ...payload, ...buildHelpers() };
  return ejs.render(content, data, { async: false, filename: 'template.esj' });
}

/**
 * Load default template for a store+type, then render.
 */
function renderDefault({ storeId, type = 'receipt', payload }) {
  const tmpl = templateRepo.findDefaultByStoreId(storeId, type);
  if (!tmpl) throw new Error(`No template found for store=${storeId}, type=${type}`);
  const text = renderContent(tmpl.content, payload);
  return { text, template: tmpl };
}

/**
 * Render a specific template (custom content, e.g. preview / test print).
 */
function renderRaw({ content, payload }) {
  return renderContent(content, payload);
}

module.exports = {
  renderDefault,
  renderRaw,
  renderContent,
  formatMoney,
};
