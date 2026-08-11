/**
 * Store Context Middleware
 * Ensures the user has a store and attaches it to req.
 * Avoids repeating getOrCreateStore in every controller.
 */

const storeRepo = require('../repositories/store.repo');
const { getUserFromHeaders } = require('../helpers/request.helper');

function requireStore(req, res, next) {
  const user = getUserFromHeaders(req);
  if (!user.id) {
    return res.status(401).json({ error: 'User context required' });
  }

  const store = storeRepo.getOrCreate(user.id);
  req.store = store;
  req.storeUser = user;
  next();
}

module.exports = { requireStore };
