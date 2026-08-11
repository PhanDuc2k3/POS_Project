/**
 * Store Models - Data shape definitions
 */

/**
 * @typedef {Object} Store
 * @property {number} id
 * @property {number} ownerId
 * @property {string} name
 * @property {string|null} phone
 * @property {string|null} address
 * @property {string|null} logo
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} BankConfig
 * @property {number} id
 * @property {number} storeId
 * @property {string|null} bankName
 * @property {string|null} bankBin
 * @property {string|null} accountName
 * @property {string|null} accountNumber
 * @property {string} qrProvider
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} ReceiptConfig
 * @property {number} id
 * @property {number} storeId
 * @property {string|null} header
 * @property {string} footer
 * @property {boolean} showQR
 * @property {boolean} showLogo
 * @property {boolean} showTime
 * @property {boolean} showTxnId
 * @property {boolean} showStoreInfo
 * @property {string} paperWidth
 */

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {number} storeId
 * @property {string} name
 * @property {number} sortOrder
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {number} storeId
 * @property {number|null} categoryId
 * @property {string|null} categoryName
 * @property {string} name
 * @property {number} price
 * @property {string|null} image
 * @property {string|null} description
 * @property {boolean} isAvailable
 * @property {number} sortOrder
 * @property {string} createdAt
 */

module.exports = {};
