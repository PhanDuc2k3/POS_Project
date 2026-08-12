/**
 * Dashboard Service - Business logic for statistics & reports
 */

const dashboardRepo = require('../repositories/dashboard.repo');

function getStats(storeId, period) {
  const stats = period ? dashboardRepo.getStatsByPeriod(storeId, period) : dashboardRepo.getTodayStats(storeId);
  return {
    todayRevenue: stats.revenue,
    todayOrders: stats.orders,
    avgOrderValue: stats.avgValue,
  };
}

function getHourlyChart(storeId, date) {
  return dashboardRepo.getHourlyRevenue(storeId, date);
}

function getRevenueReport(storeId, period) {
  return dashboardRepo.getRevenueByPeriod(storeId, period);
}

function getTopProducts(storeId, { date, period } = {}) {
  if (period) return dashboardRepo.getTopProductsByPeriod(storeId, period);
  return dashboardRepo.getTopProducts(storeId, date);
}

function getPaymentBreakdown(storeId, date) {
  return dashboardRepo.getPaymentBreakdown(storeId, date);
}

module.exports = { getStats, getHourlyChart, getRevenueReport, getTopProducts, getPaymentBreakdown };
