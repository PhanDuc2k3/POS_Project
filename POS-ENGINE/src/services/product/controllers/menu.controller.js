/**
 * Menu Controller - Full POS menu endpoint
 */

const menuService = require('../services/menu.service');
const { getUserFromHeaders } = require('../helpers/request.helper');

function getMenu(req, res) {
  const user = getUserFromHeaders(req);
  const result = menuService.getFullMenu(user.id);
  res.json(result.data);
}

function getPublicMenu(req, res) {
  const storeId = parseInt(req.query.storeId || req.headers['x-store-id']) || 1;
  const result = menuService.getFullMenu(storeId);
  res.json(result.data);
}

module.exports = {
  getMenu,
  getPublicMenu,
};
