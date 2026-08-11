/**
 * Topping Controller - HTTP handlers for topping groups and toppings
 */

const toppingService = require('../services/topping.service');
const { getUserFromHeaders } = require('../helpers/request.helper');

function getToppingGroups(req, res) {
  const user = getUserFromHeaders(req);
  const result = toppingService.getToppingGroups(user.id);
  res.json(result.data);
}

function createToppingGroup(req, res) {
  const user = getUserFromHeaders(req);
  const { name, isRequired, maxSelect, sortOrder } = req.body;
  const result = toppingService.createToppingGroup(user.id, { name, isRequired, maxSelect, sortOrder });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(result.status).json(result.data);
}

function updateToppingGroup(req, res) {
  const user = getUserFromHeaders(req);
  const { name, isRequired, maxSelect, sortOrder } = req.body;
  const result = toppingService.updateToppingGroup(user.id, parseInt(req.params.id), { name, isRequired, maxSelect, sortOrder });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
}

function deleteToppingGroup(req, res) {
  const user = getUserFromHeaders(req);
  const result = toppingService.deleteToppingGroup(user.id, parseInt(req.params.id));
  res.json(result);
}

function createTopping(req, res) {
  const user = getUserFromHeaders(req);
  const { groupId, name, price } = req.body;
  const result = toppingService.createTopping(user.id, { groupId, name, price });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(result.status).json(result.data);
}

function updateTopping(req, res) {
  const user = getUserFromHeaders(req);
  const { name, price, isAvailable, sortOrder } = req.body;
  const result = toppingService.updateTopping(user.id, parseInt(req.params.id), { name, price, isAvailable, sortOrder });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
}

function deleteTopping(req, res) {
  const user = getUserFromHeaders(req);
  const result = toppingService.deleteTopping(user.id, parseInt(req.params.id));
  res.json(result);
}

module.exports = {
  getToppingGroups,
  createToppingGroup,
  updateToppingGroup,
  deleteToppingGroup,
  createTopping,
  updateTopping,
  deleteTopping,
};
