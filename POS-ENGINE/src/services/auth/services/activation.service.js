const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../../../shared/config');
const userRepo = require('../repositories/user.repo');
const auditRepo = require('../repositories/audit.repo');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createUsername(email) {
  const base = String(email || 'owner')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()
    .slice(0, 24) || 'owner';
  return `${base}_${Date.now().toString().slice(-5)}`;
}

function provisionOwner(payload) {
  const email = String(payload?.email || '').trim().toLowerCase();
  const displayName = String(payload?.displayName || payload?.name || '').trim();
  const tenantId = Number(payload?.tenantId || 0);
  const platformAccountId = Number(payload?.platformAccountId || 0);

  if (!email || !displayName || !tenantId || !platformAccountId) {
    return { error: 'email, displayName, tenantId and platformAccountId required', status: 400 };
  }

  const existing = userRepo.findByEmail(email);
  if (existing && existing.tenantId && existing.tenantId !== tenantId) {
    return { error: 'Duplicate email', status: 409 };
  }
  if (existing && existing.tenantId === tenantId) {
    return {
      data: {
        user: existing,
        activationToken: null,
        activationLink: null,
        alreadyExists: true,
      },
    };
  }

  const activationToken = crypto.randomBytes(32).toString('hex');
  const activationTokenHash = hashToken(activationToken);
  const activationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const user = userRepo.createPendingOwner({
    username: createUsername(email),
    displayName,
    email,
    role: 'store_owner',
    tenantId,
    platformAccountId,
    activationTokenHash,
    activationExpiresAt,
  });

  auditRepo.create(user.id, 'OWNER_PROVISIONED', `tenant=${tenantId}; platformAccount=${platformAccountId}`, null);

  return {
    data: {
      user,
      activationToken,
      activationLink: `http://localhost:3000/activate?token=${activationToken}`,
      expiresAt: activationExpiresAt,
      alreadyExists: false,
    },
  };
}

function activate(activationToken, newPassword, ip) {
  if (!activationToken || !newPassword) {
    return { error: 'activationToken and newPassword required', status: 400 };
  }
  if (String(newPassword).length < 6) {
    return { error: 'Password must have at least 6 characters', status: 400 };
  }

  const user = userRepo.findByActivationTokenHash(hashToken(activationToken));
  if (!user) return { error: 'Activation token invalid', status: 401 };
  if (user.activationUsedAt) return { error: 'Activation token already used', status: 409 };
  if (user.activationExpiresAt && new Date(user.activationExpiresAt).getTime() < Date.now()) {
    return { error: 'Activation token expired', status: 401 };
  }

  const passwordHash = bcrypt.hashSync(newPassword, config.BCRYPT_ROUNDS);
  const activated = userRepo.activateUser(user.id, passwordHash);
  auditRepo.create(user.id, 'OWNER_ACTIVATED', null, ip);
  return { data: activated };
}

module.exports = {
  provisionOwner,
  activate,
};
