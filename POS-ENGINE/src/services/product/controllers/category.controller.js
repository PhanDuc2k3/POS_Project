/**
 * Category Controller - HTTP handlers for categories
 */

const categoryService = require('../services/category.service');
const { getUserFromHeaders } = require('../helpers/request.helper');

function getCategories(req, res) {
  const user = getUserFromHeaders(req);
  const result = categoryService.getCategories(user.id);
  res.json(result.data);
}

function createCategory(req, res) {
  const user = getUserFromHeaders(req);
  const { name, sortOrder } = req.body;
  const result = categoryService.createCategory(user.id, { name, sortOrder });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(result.status).json(result.data);
}

function updateCategory(req, res) {
  const user = getUserFromHeaders(req);
  const { name, sortOrder, isActive } = req.body;
  const result = categoryService.updateCategory(user.id, parseInt(req.params.id), { name, sortOrder, isActive });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
}

function deleteCategory(req, res) {
  const user = getUserFromHeaders(req);
  const result = categoryService.deleteCategory(user.id, parseInt(req.params.id));
  res.json(result);
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
