import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BadgeDollarSign, Box, CircleDollarSign, Receipt, ShoppingBag } from 'lucide-react';
import { REALTIME_EVENTS } from '../constants/realtimeEvents';
import { dashboardAPI } from '../services/dashboard.api';
import { useRealtime } from '../hooks/useRealtime';
import './Dashboard.css';

const timeFilters = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: '7days', label: '7 ngày' },
  { key: '30days', label: '30 ngày' },
  { key: 'month', label: 'Tháng này' },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value || 0) + ' đ';
}

function formatCompactCurrency(value) {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 ? 1 : 0)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function Dashboard() {
  const [revenueFilter, setRevenueFilter] = useState('today');
  const [topProductsFilter, setTopProductsFilter] = useState('today');
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, avgOrderValue: 0 });
  const [hourlyData, setHourlyData] = useState([]);
  const [summaryTopProducts, setSummaryTopProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [showTopProductsModal, setShowTopProductsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStatsAndRevenue(); }, [revenueFilter]);
  useEffect(() => { loadTopProducts(); }, [topProductsFilter]);

  const handleNewTransaction = useCallback(() => {
    loadStatsAndRevenue();
    loadTopProducts();
  }, [revenueFilter, topProductsFilter]);

  useRealtime(REALTIME_EVENTS.TRANSACTION_CREATED, handleNewTransaction);
  useRealtime(REALTIME_EVENTS.TRANSACTION_CANCELLED, handleNewTransaction);
  useRealtime(REALTIME_EVENTS.TRANSACTION_REFUNDED, handleNewTransaction);

  async function loadStatsAndRevenue() {
    setLoading(true);
    try {
      const [s, data, top] = await Promise.all([
        dashboardAPI.getStats(revenueFilter),
        revenueFilter === 'today'
          ? dashboardAPI.getHourlyChart()
          : dashboardAPI.getRevenueReport(revenueFilter),
        dashboardAPI.getTopProducts({ period: revenueFilter }),
      ]);
      setStats(s);
      setSummaryTopProducts(top);
      setHourlyData(revenueFilter === 'today'
        ? data
        : data.map(d => ({ hour: d.date?.slice(5) || d.date, revenue: d.revenue, orders: d.orders })));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function loadTopProducts() {
    try {
      const data = await dashboardAPI.getTopProducts({ period: topProductsFilter });
      setTopProducts(data);
    } catch { /* ignore */ }
  }

  const statCards = [
    {
      label: 'Doanh thu hôm nay',
      value: formatCurrency(stats.todayRevenue),
      hint: '+12.5% so với hôm qua',
      icon: CircleDollarSign,
    },
    {
      label: 'Số giao dịch',
      value: String(stats.todayOrders || 0),
      hint: 'Chi phí phát sinh trước',
      icon: Receipt,
    },
    {
      label: 'Trung bình / GD',
      value: formatCurrency(stats.avgOrderValue),
      hint: '+2.1% so với tuần trước',
      icon: BadgeDollarSign,
    },
    {
      label: 'Sản phẩm bán chạy',
      value: summaryTopProducts[0]?.name || '—',
      hint: summaryTopProducts[0] ? `${summaryTopProducts[0].quantity || 0} ly đã bán` : 'Chưa có dữ liệu',
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Tổng quan hoạt động kinh doanh hôm nay</p>
        </div>
        <span className="live-badge">Dữ liệu thời gian thực</span>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-card-header">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-icon"><stat.icon size={14} /></span>
            </div>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-hint">{stat.hint}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="chart-section revenue-panel">
          <div className="chart-header">
            <h2 className="chart-title">
              {revenueFilter === 'today' ? 'Doanh thu theo giờ' : 'Doanh thu theo ngày'}
            </h2>
            <select
              className="chart-select"
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value)}
            >
              {timeFilters.map((filter) => (
                <option key={filter.key} value={filter.key}>{filter.label}</option>
              ))}
            </select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={hourlyData}>
                <CartesianGrid stroke="#dfe7f3" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={formatCompactCurrency}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #dfe7f3', fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#2f66e8" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="chart-section top-products-panel">
          <div className="top-products-title-row">
            <h2 className="chart-title">Sản phẩm bán chạy</h2>
            <select
              className="chart-select"
              value={topProductsFilter}
              onChange={(e) => setTopProductsFilter(e.target.value)}
            >
              {timeFilters.map((filter) => (
                <option key={filter.key} value={filter.key}>{filter.label}</option>
              ))}
            </select>
          </div>
          <div className="top-products-table">
            <div className="top-products-head">
              <span>#</span>
              <span>Sản phẩm</span>
              <span>SL</span>
              <span>D.thu</span>
            </div>
            {loading && <div className="top-products-empty">Đang tải...</div>}
            {!loading && topProducts.length === 0 && <div className="top-products-empty">Chưa có dữ liệu</div>}
            {topProducts.slice(0, 3).map((product, index) => (
              <div className="top-product-row" key={product.name || index}>
                <span className="top-rank">{index + 1}</span>
                <span className="top-name">
                  <strong>{product.name}</strong>
                  <small><Box size={10} /> Đồ uống</small>
                </span>
                <span>{product.quantity || 0}</span>
                <span>{formatCompactCurrency(product.revenue)}</span>
              </div>
            ))}
          </div>
          <button className="view-all-btn" type="button" onClick={() => setShowTopProductsModal(true)}>Xem tất cả</button>
        </section>
      </div>

      {showTopProductsModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowTopProductsModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <div>
                <h3>Sản phẩm bán chạy</h3>
                <p>{timeFilters.find((filter) => filter.key === topProductsFilter)?.label}</p>
              </div>
              <button type="button" onClick={() => setShowTopProductsModal(false)}>×</button>
            </div>
            <div className="dashboard-modal-table">
              <div className="top-products-head">
                <span>#</span>
                <span>Sản phẩm</span>
                <span>SL</span>
                <span>D.thu</span>
              </div>
              {topProducts.length === 0 && <div className="top-products-empty">Chưa có dữ liệu</div>}
              {topProducts.map((product, index) => (
                <div className="top-product-row" key={`${product.name}-${index}`}>
                  <span className="top-rank">{index + 1}</span>
                  <span className="top-name">
                    <strong>{product.name}</strong>
                    <small><Box size={10} /> Đồ uống</small>
                  </span>
                  <span>{product.quantity || 0}</span>
                  <span>{formatCompactCurrency(product.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
