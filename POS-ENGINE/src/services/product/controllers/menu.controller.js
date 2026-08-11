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

module.exports = {
  getMenu,
};
