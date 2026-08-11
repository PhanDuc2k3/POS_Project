/**
 * Dashboard Service - Business logic for statistics & reports
 */

const dashboardRepo = require('../repositories/dashboard.repo');

function getStats(storeId) {
  const today = dashboardRepo.getTodayStats(storeId);
  return {
    todayRevenue: today.revenue,
    todayOrders: today.orders,
    avgOrderValue: today.avgValue,
  };
}

function getHourlyChart(storeId, date) {
  return dashboardRepo.getHourlyRevenue(storeId, date);
}

function getRevenueReport(storeId, period) {
  return dashboardRepo.getRevenueByPeriod(storeId, period);
}

function getTopProducts(storeId, date) {
  return dashboardRepo.getTopProducts(storeId, date);
}

function getPaymentBreakdown(storeId, date) {
  return dashboardRepo.getPaymentBreakdown(storeId, date);
}

module.exports = { getStats, getHourlyChart, getRevenueReport, getTopProducts, getPaymentBreakdown };
