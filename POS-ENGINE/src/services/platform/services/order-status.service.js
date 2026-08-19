const TRANSITIONS = {
  PENDING: new Set(['CONTACTED', 'REJECTED', 'CANCELLED']),
  CONTACTED: new Set(['QUOTED', 'CANCELLED']),
  QUOTED: new Set(['WAITING_PAYMENT', 'CANCELLED']),
  WAITING_PAYMENT: new Set(['PAID', 'CANCELLED']),
  PAID: new Set(['APPROVED']),
  APPROVED: new Set(['PROVISIONING']),
  PROVISIONING: new Set(['ACTIVE', 'PROVISIONING_FAILED']),
  PROVISIONING_FAILED: new Set(['PROVISIONING']),
  ACTIVE: new Set([]),
  REJECTED: new Set([]),
  CANCELLED: new Set([]),
};

function normalize(status) {
  return String(status || '').trim().toUpperCase();
}

function canTransition(from, to) {
  const allowed = TRANSITIONS[normalize(from)];
  return Boolean(allowed && allowed.has(normalize(to)));
}

function validateTransition(from, to) {
  if (!canTransition(from, to)) {
    return {
      error: `Invalid order status transition: ${normalize(from)} -> ${normalize(to)}`,
      status: 409,
    };
  }
  return null;
}

module.exports = {
  canTransition,
  validateTransition,
};
