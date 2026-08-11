/**
 * User Model - Data shape definitions
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} passwordHash
 * @property {string} displayName
 * @property {string|null} email
 * @property {string} role
 * @property {number} isActive
 * @property {string|null} avatar
 * @property {string|null} securityQuestion
 * @property {string|null} securityAnswerHash
 * @property {string|null} lastLogin
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} UserPublic
 * @property {number} id
 * @property {string} username
 * @property {string} displayName
 * @property {string|null} email
 * @property {string} role
 * @property {string|null} avatar
 */

/**
 * @typedef {Object} Session
 * @property {number} id
 * @property {number} userId
 * @property {string} tokenHash
 * @property {string|null} ipAddress
 * @property {string|null} deviceId
 * @property {string|null} deviceName
 * @property {string|null} deviceType
 * @property {string} clientType
 * @property {string|null} browser
 * @property {string|null} os
 * @property {string|null} screenResolution
 * @property {boolean} isTrusted
 * @property {string} expiresAt
 * @property {string} lastUsed
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AuditEntry
 * @property {number} id
 * @property {number} userId
 * @property {string} action
 * @property {string|null} details
 * @property {string|null} ipAddress
 * @property {string} createdAt
 */

/**
 * @typedef {Object} DeviceInfo
 * @property {string} browser
 * @property {string} os
 * @property {string} deviceType
 * @property {string} deviceName
 * @property {string|null} deviceId
 * @property {'portal'|'pos_app'} clientType
 * @property {string|null} screenResolution
 */

module.exports = {};
