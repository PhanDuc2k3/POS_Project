/**
 * Product Controller - HTTP handlers for products
 */

const productService = require('../services/product.service');
const { getUserFromHeaders } = require('../helpers/request.helper');

function getProducts(req, res) {
  const user = getUserFromHeaders(req);
  const { categoryId, available } = req.query;
  const result = productService.getProducts(user.id, { categoryId, available });
  res.json(result.data);
}

function createProduct(req, res) {
  const user = getUserFromHeaders(req);
  const { name, price, categoryId, image, description } = req.body;
  const result = productService.createProduct(user.id, { name, price, categoryId, image, description });

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(result.status).json(result.data);
}

function updateProduct(req, res) {
  const user = getUserFromHeaders(req);
  const result = productService.updateProduct(user.id, parseInt(req.params.id), req.body);

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
}

function deleteProduct(req, res) {
  const user = getUserFromHeaders(req);
  const result = productService.deleteProduct(user.id, parseInt(req.params.id));
  res.json(result);
}

function toggleProduct(req, res) {
  const user = getUserFromHeaders(req);
  const result = productService.toggleProduct(user.id, parseInt(req.params.id));

  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function linkToppingGroup(req, res) {
  const user = getUserFromHeaders(req);
  const { groupId } = req.body;
  if (!groupId) return res.status(400).json({ error: 'groupId is required' });

  const result = productService.linkToppingGroup(user.id, parseInt(req.params.id), groupId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
}

function unlinkToppingGroup(req, res) {
  const user = getUserFromHeaders(req);
  const result = productService.unlinkToppingGroup(user.id, parseInt(req.params.id), parseInt(req.params.groupId));
  res.json(result);
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProduct,
  linkToppingGroup,
  unlinkToppingGroup,
};
