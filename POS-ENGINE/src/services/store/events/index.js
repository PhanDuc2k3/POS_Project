/**
 * Store Service Events
 * Defines event topics published by this service.
 */

const EVENTS = {
  STORE_UPDATED: 'store.updated',
  BANK_UPDATED: 'store.bankUpdated',
  RECEIPT_UPDATED: 'store.receiptUpdated',
  CATEGORY_CREATED: 'store.categoryCreated',
  PRODUCT_CREATED: 'store.productCreated',
  PRODUCT_UPDATED: 'store.productUpdated',
};

module.exports = EVENTS;
