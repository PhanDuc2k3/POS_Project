/**
 * Printer Controller
 *
 * CRUD for registered printers + test-print action.
 */

const printerRepo = require('../repositories/printer.repo');
const printerService = require('../services/printer.service');
const { getUserFromHeaders } = require('../helpers/request.helper');

async function list(req, res) {
  const storeId = parseInt(req.query.storeId, 10);
  if (!Number.isInteger(storeId)) {
    return res.status(400).json({ error: 'storeId query param required' });
  }
  return res.json({ data: printerRepo.findByStoreId(storeId) });
}

function create(req, res) {
  try {
    const body = req.body;
    const printer = printerRepo.create({
      storeId: body.storeId,
      name: body.name,
      type: body.type,
      interfacePath: body.interfacePath,
      vendorId: body.vendorId,
      productId: body.productId,
      paperWidth: body.paperWidth,
      charset: body.charset,
      isDefault: body.isDefault,
    });
    return res.status(201).json({ data: printer });
  } catch (err) {
    console.error('[Print] create printer error:', err);
    return res.status(500).json({ error: 'Create failed', details: err.message });
  }
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const updated = printerRepo.update(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Printer not found' });
  return res.json({ data: updated });
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  const existing = printerRepo.findById(id);
  if (!existing) return res.status(404).json({ error: 'Printer not found' });
  printerRepo.remove(id);
  return res.json({ data: { message: 'Deleted' } });
}

async function testPrint(req, res) {
  const id = parseInt(req.params.id, 10);
  const printer = printerRepo.findById(id);
  if (!printer) return res.status(404).json({ error: 'Printer not found' });
  const user = getUserFromHeaders(req);
  console.log(`[Print] test print requested by user=${user.username} printer=#${id}`);
  try {
    const result = await printerService.printTest(printer);
    return res.json({ data: { ok: true, ...result } });
  } catch (err) {
    return res.status(500).json({ error: 'Print failed', details: err.message });
  }
}

module.exports = { list, create, update, remove, testPrint };
