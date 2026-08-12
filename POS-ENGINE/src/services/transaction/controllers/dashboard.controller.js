/**
 * Dashboard Controller - HTTP handlers for statistics
 */

const dashboardService = require('../services/dashboard.service');

function getStats(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const { period } = req.query;
  const stats = dashboardService.getStats(storeId, period);
  res.json(stats);
}

function getHourlyChart(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const { date } = req.query;
  const data = dashboardService.getHourlyChart(storeId, date);
  res.json(data);
}

function getRevenueReport(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const { period } = req.query; // today, yesterday, 7days, 30days, month
  const data = dashboardService.getRevenueReport(storeId, period || 'today');
  res.json(data);
}

function getTopProducts(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const { date, period } = req.query;
  const data = dashboardService.getTopProducts(storeId, { date, period });
  res.json(data);
}

function getPaymentBreakdown(req, res) {
  const storeId = parseInt(req.headers['x-store-id']) || 1;
  const { date } = req.query;
  const data = dashboardService.getPaymentBreakdown(storeId, date);
  res.json(data);
}

module.exports = { getStats, getHourlyChart, getRevenueReport, getTopProducts, getPaymentBreakdown };
