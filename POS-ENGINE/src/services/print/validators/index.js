module.exports = {
  validatePrinterCreate: require('./print.validator').validatePrinterCreate,
  validateTemplateUpsert: require('./print.validator').validateTemplateUpsert,
  validatePrint: require('./print.validator').validatePrint,
  validatePreview: require('./print.validator').validatePreview,
};
