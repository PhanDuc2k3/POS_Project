/**
 * Template Controller
 *
 * CRUD for receipt templates + render preview.
 */

const templateRepo = require('../repositories/template.repo');
const templateService = require('../services/template.service');
const escposService = require('../services/escpos.service');

function list(req, res) {
  const storeId = parseInt(req.query.storeId, 10);
  if (!Number.isInteger(storeId)) {
    return res.status(400).json({ error: 'storeId query param required' });
  }
  return res.json({ data: templateRepo.findByStoreId(storeId) });
}

function getDefault(req, res) {
  const storeId = parseInt(req.query.storeId, 10);
  const type = req.query.type || 'receipt';
  if (!Number.isInteger(storeId)) {
    return res.status(400).json({ error: 'storeId query param required' });
  }
  const tmpl = templateRepo.findDefaultByStoreId(storeId, type);
  if (!tmpl) return res.status(404).json({ error: 'No default template found' });
  return res.json({ data: tmpl });
}

async function upsert(req, res) {
  const t = templateRepo.upsert({
    storeId: req.body.storeId,
    type: req.body.type,
    name: req.body.name,
    content: req.body.content,
    paperWidth: req.body.paperWidth,
    isDefault: req.body.isDefault,
  });
  return res.status(201).json({ data: t });
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const updated = templateRepo.update(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Template not found' });
  return res.json({ data: updated });
}

function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  const existing = templateRepo.findById(id);
  if (!existing) return res.status(404).json({ error: 'Template not found' });
  templateRepo.remove(id);
  return res.json({ data: { message: 'Deleted' } });
}

function preview(req, res) {
  const { content, payload, paperWidth } = req.body;
  try {
    const text = templateService.renderRaw({ content, payload });
    const escBytes = escposService.encode(text, { paperWidth: paperWidth || 80 });
    return res.json({
      data: {
        preview: text,
        bytes: escBytes.length,
        hexPreview: escBytes.toString('hex').slice(0, 200),
      },
    });
  } catch (err) {
    return res.status(400).json({ error: 'Render failed', details: err.message });
  }
}

module.exports = { list, getDefault, upsert, update, remove, preview };
