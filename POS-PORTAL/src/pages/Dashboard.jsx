import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Receipt, DollarSign, ShoppingBag } from 'lucide-react';
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
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('today');
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, avgOrderValue: 0 });
  const [hourlyData, setHourlyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { loadHourly(); }, [activeFilter]);

  // Realtime: auto-refresh when new transaction arrives
  const handleNewTransaction = useCallback(() => {
    loadDashboard();
    if (activeFilter === 'today') loadHourly();
  }, [activeFilter]);

  useRealtime(REALTIME_EVENTS.TRANSACTION_CREATED, handleNewTransaction);
  useRealtime(REALTIME_EVENTS.TRANSACTION_CANCELLED, handleNewTransaction);
  useRealtime(REALTIME_EVENTS.TRANSACTION_REFUNDED, handleNewTransaction);

  async function loadDashboard() {
    try {
      const [s, h, t] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getHourlyChart(),
        dashboardAPI.getTopProducts(),
      ]);
      setStats(s);
      setHourlyData(h);
      setTopProducts(t);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function loadHourly() {
    try {
      if (activeFilter === 'today') {
        const data = await dashboardAPI.getHourlyChart();
        setHourlyData(data);
      } else {
        // For other periods, show daily revenue
        const data = await dashboardAPI.getRevenueReport(activeFilter);
        setHourlyData(data.map(d => ({ hour: d.date?.slice(5) || d.date, revenue: d.revenue, orders: d.orders })));
      }
    } catch { /* ignore */ }
  }

  const statCards = [
    { label: 'Doanh thu hôm nay', value: formatCurrency(stats.todayRevenue), icon: DollarSign, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Số giao dịch', value: String(stats.todayOrders), icon: Receipt, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Trung bình / GD', value: formatCurrency(stats.avgOrderValue), icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Sản phẩm bán chạy', value: topProducts[0]?.name || '—', icon: ShoppingBag, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-icon" style={{ background: stat.bg }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h2 className="chart-title">
            {activeFilter === 'today' ? 'Doanh thu theo giờ' : 'Doanh thu theo ngày'}
          </h2>
          <div className="chart-filters">
            {timeFilters.map((f) => (
              <button key={f.key}
                className={`filter-btn${activeFilter === f.key ? ' active' : ''}`}
                onClick={() => setActiveFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="chart-section">
          <h2 className="chart-title">Sản phẩm bán chạy hôm nay</h2>
          <div className="top-products">
            {topProducts.map((p, i) => (
              <div className="top-product-item" key={i}>
                <span className="top-product-rank">#{i + 1}</span>
                <span className="top-product-name">{p.name}</span>
                <span className="top-product-qty">{p.quantity} phần</span>
                <span className="top-product-revenue">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
