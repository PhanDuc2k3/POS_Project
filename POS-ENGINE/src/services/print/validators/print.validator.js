/**
 * Validators for print service.
 *
 * Each returns { value, errors } where errors is an array of strings.
 */

function validatePrinterCreate(body) {
  const errors = [];
  if (!body.storeId || !Number.isInteger(body.storeId)) errors.push('storeId is required (integer)');
  if (!body.name || typeof body.name !== 'string') errors.push('name is required');
  if (body.vendorId !== undefined && !Number.isInteger(body.vendorId)) errors.push('vendorId must be integer');
  if (body.productId !== undefined && !Number.isInteger(body.productId)) errors.push('productId must be integer');
  if (body.paperWidth !== undefined && ![58, 80].includes(body.paperWidth)) errors.push('paperWidth must be 58 or 80');
  if (body.type !== undefined && !['usb', 'network', 'mock'].includes(body.type)) {
    errors.push('type must be one of: usb, network, mock');
  }
  return { errors };
}

function validateTemplateUpsert(body) {
  const errors = [];
  if (!body.storeId || !Number.isInteger(body.storeId)) errors.push('storeId is required (integer)');
  if (!body.name || typeof body.name !== 'string') errors.push('name is required');
  if (!body.content || typeof body.content !== 'string') errors.push('content is required (string)');
  if (body.paperWidth !== undefined && ![58, 80].includes(body.paperWidth)) errors.push('paperWidth must be 58 or 80');
  return { errors };
}

function validatePrint(body) {
  const errors = [];
  if (!body.storeId || !Number.isInteger(body.storeId)) errors.push('storeId is required');
  if (body.type && !['receipt', 'kitchen', 'label', 'report'].includes(body.type)) {
    errors.push('type must be one of: receipt, kitchen, label, report');
  }
  if (!body.payload || typeof body.payload !== 'object') errors.push('payload is required (object)');
  return { errors };
}

function validatePreview(body) {
  const errors = [];
  if (!body.content || typeof body.content !== 'string') errors.push('content is required');
  if (!body.payload || typeof body.payload !== 'object') errors.push('payload is required');
  return { errors };
}

module.exports = {
  validatePrinterCreate,
  validateTemplateUpsert,
  validatePrint,
  validatePreview,
};
