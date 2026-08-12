/**
 * Dashboard Repository - Aggregation queries for statistics
 */

const { getDatabase } = require('../database');
const { todayVietnamDate, vietnamDate } = require('../../../shared/time');

function getTodayStats(storeId) {
  const db = getDatabase();
  const today = todayVietnamDate();

  const result = db.exec(
    `SELECT 
       COALESCE(SUM(final_total), 0) as revenue,
       COUNT(*) as orders,
       COALESCE(AVG(final_total), 0) as avg_value
     FROM orders 
     WHERE store_id = ? AND date(created_at) = ? AND status = 'completed'`,
    [storeId, today]
  );

  if (!result.length || !result[0].values.length) {
    return { revenue: 0, orders: 0, avgValue: 0 };
  }

  const r = result[0].values[0];
  return { revenue: r[0], orders: r[1], avgValue: Math.round(r[2]) };
}

function getStatsByDateRange(storeId, startDate, endDate) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT
       COALESCE(SUM(final_total), 0) as revenue,
       COUNT(*) as orders,
       COALESCE(AVG(final_total), 0) as avg_value
     FROM orders
     WHERE store_id = ? AND date(created_at) >= ? AND date(created_at) <= ? AND status = 'completed'`,
    [storeId, startDate, endDate]
  );

  if (!result.length || !result[0].values.length) {
    return { revenue: 0, orders: 0, avgValue: 0 };
  }

  const r = result[0].values[0];
  return { revenue: r[0], orders: r[1], avgValue: Math.round(r[2]) };
}

function getPeriodRange(period) {
  switch (period) {
    case 'yesterday':
      return { startDate: vietnamDate(-1), endDate: vietnamDate(-1) };
    case '7days':
      return { startDate: vietnamDate(-6), endDate: todayVietnamDate() };
    case '30days':
      return { startDate: vietnamDate(-29), endDate: todayVietnamDate() };
    case 'month':
      return { startDate: `${todayVietnamDate().slice(0, 7)}-01`, endDate: todayVietnamDate() };
    default:
      return { startDate: todayVietnamDate(), endDate: todayVietnamDate() };
  }
}

function getStatsByPeriod(storeId, period) {
  const { startDate, endDate } = getPeriodRange(period);
  return getStatsByDateRange(storeId, startDate, endDate);
}

function getHourlyRevenue(storeId, date) {
  const db = getDatabase();
  const targetDate = date || todayVietnamDate();

  const result = db.exec(
    `SELECT 
       strftime('%H', created_at) as hour,
       SUM(final_total) as revenue,
       COUNT(*) as orders
     FROM orders
     WHERE store_id = ? AND date(created_at) = ? AND status = 'completed'
     GROUP BY strftime('%H', created_at)
     ORDER BY hour`,
    [storeId, targetDate]
  );

  // Fill all 24 hours
  const hourly = [];
  for (let h = 0; h < 24; h++) {
    hourly.push({ hour: `${h}h`, revenue: 0, orders: 0 });
  }

  if (result.length && result[0].values.length) {
    for (const row of result[0].values) {
      const idx = parseInt(row[0]);
      hourly[idx] = { hour: `${idx}h`, revenue: row[1], orders: row[2] };
    }
  }

  return hourly;
}

function getRevenueByDateRange(storeId, startDate, endDate) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT 
       date(created_at) as day,
       SUM(final_total) as revenue,
       COUNT(*) as orders
     FROM orders
     WHERE store_id = ? AND date(created_at) >= ? AND date(created_at) <= ? AND status = 'completed'
     GROUP BY date(created_at)
     ORDER BY day`,
    [storeId, startDate, endDate]
  );

  if (!result.length) return [];
  return result[0].values.map(r => ({ date: r[0], revenue: r[1], orders: r[2] }));
}

function getRevenueByPeriod(storeId, period) {
  const db = getDatabase();
  let startDate;

  switch (period) {
    case 'yesterday':
      startDate = vietnamDate(-1);
      return getRevenueByDateRange(storeId, startDate, startDate);
    case '7days':
      return getRevenueByDateRange(storeId, vietnamDate(-6), todayVietnamDate());
    case '30days':
      return getRevenueByDateRange(storeId, vietnamDate(-29), todayVietnamDate());
    case 'month':
      startDate = `${todayVietnamDate().slice(0, 7)}-01`;
      return getRevenueByDateRange(storeId, startDate, todayVietnamDate());
    default:
      return getRevenueByDateRange(storeId, todayVietnamDate(), todayVietnamDate());
  }
}

function getTopProducts(storeId, date) {
  const db = getDatabase();
  const targetDate = date || todayVietnamDate();

  const result = db.exec(
    `SELECT 
       oi.product_name,
       SUM(oi.quantity) as total_qty,
       SUM(oi.total) as total_revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.store_id = ?
       AND date(o.created_at) = ?
       AND o.status = 'completed'
       AND oi.product_id IS NOT NULL
       AND oi.product_name NOT LIKE 'Thuế VAT%'
     GROUP BY oi.product_name
     ORDER BY total_qty DESC
     LIMIT 10`,
    [storeId, targetDate]
  );

  if (!result.length) return [];
  return result[0].values.map(r => ({ name: r[0], quantity: r[1], revenue: r[2] }));
}

function getTopProductsByDateRange(storeId, startDate, endDate) {
  const db = getDatabase();
  const result = db.exec(
    `SELECT
       oi.product_name,
       SUM(oi.quantity) as total_qty,
       SUM(oi.total) as total_revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.store_id = ?
       AND date(o.created_at) >= ?
       AND date(o.created_at) <= ?
       AND o.status = 'completed'
       AND oi.product_id IS NOT NULL
       AND oi.product_name NOT LIKE 'Thuế VAT%'
     GROUP BY oi.product_name
     ORDER BY total_qty DESC
     LIMIT 10`,
    [storeId, startDate, endDate]
  );

  if (!result.length) return [];
  return result[0].values.map(r => ({ name: r[0], quantity: r[1], revenue: r[2] }));
}

function getTopProductsByPeriod(storeId, period) {
  const { startDate, endDate } = getPeriodRange(period);
  return getTopProductsByDateRange(storeId, startDate, endDate);
}

function getPaymentBreakdown(storeId, date) {
  const db = getDatabase();
  const targetDate = date || todayVietnamDate();

  const result = db.exec(
    `SELECT payment_method, COUNT(*) as count, SUM(final_total) as total
     FROM orders
     WHERE store_id = ? AND date(created_at) = ? AND status = 'completed'
     GROUP BY payment_method`,
    [storeId, targetDate]
  );

  if (!result.length) return [];
  return result[0].values.map(r => ({ method: r[0], count: r[1], total: r[2] }));
}

module.exports = {
  getTodayStats,
  getStatsByPeriod,
  getHourlyRevenue,
  getRevenueByDateRange,
  getRevenueByPeriod,
  getTopProducts,
  getTopProductsByPeriod,
  getPaymentBreakdown,
};
