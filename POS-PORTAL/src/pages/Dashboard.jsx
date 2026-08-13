import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BadgeDollarSign,
  Box,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Receipt,
  ShoppingBag,
  Store,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { REALTIME_EVENTS } from '../constants/realtimeEvents';
import { dashboardAPI } from '../services/dashboard.api';
import { storeAPI } from '../services/store.api';
import { transactionAPI } from '../services/transaction.api';
import { useRealtime } from '../hooks/useRealtime';
import { formatVietnamDateTime } from '../utils/time';
import './Dashboard.css';

const timeFilters = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: '7days', label: '7 ngày' },
  { key: '30days', label: '30 ngày' },
  { key: 'month', label: 'Tháng này' },
];

const paymentLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  card: 'Thẻ',
  wallet: 'Ví điện tử',
};

function formatCurrency(value) {
  return `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`;
}

function formatCompactCurrency(value) {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 ? 1 : 0)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function getPackageLabel(value) {
  if (!value) return 'Starter';
  if (value === 'pro') return 'Pro';
  if (value === 'restaurant') return 'Restaurant';
  if (value === 'chain') return 'Chain';
  return String(value).toUpperCase();
}

function getModeLabel(value) {
  if (value === 'restaurant') return 'Nhà hàng';
  if (value === 'simple') return 'Bán lẻ';
  if (value === 'chain') return 'Chuỗi';
  return 'Vận hành';
}

function Dashboard() {
  const [store, setStore] = useState(null);
  const [revenueFilter, setRevenueFilter] = useState('today');
  const [topProductsFilter, setTopProductsFilter] = useState('today');
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, avgOrderValue: 0 });
  const [hourlyData, setHourlyData] = useState([]);
  const [summaryTopProducts, setSummaryTopProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(true);

  useEffect(() => {
    loadStore();
  }, []);

  useEffect(() => {
    loadStatsAndRevenue();
  }, [revenueFilter]);

  useEffect(() => {
    loadTopProducts();
    loadPaymentBreakdown();
    loadRecentOrders();
  }, [topProductsFilter]);

  const handleNewTransaction = useCallback(() => {
    loadStatsAndRevenue();
    loadTopProducts();
    loadPaymentBreakdown();
    loadRecentOrders();
  }, [revenueFilter, topProductsFilter]);

  useRealtime(REALTIME_EVENTS.TRANSACTION_CREATED, handleNewTransaction);
  useRealtime(REALTIME_EVENTS.TRANSACTION_CANCELLED, handleNewTransaction);
  useRealtime(REALTIME_EVENTS.TRANSACTION_REFUNDED, handleNewTransaction);

  async function loadStore() {
    try {
      const data = await storeAPI.getStore();
      setStore(data);
    } catch {
      setStore(null);
    }
  }

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

      setStats({
        todayRevenue: s.revenue ?? s.todayRevenue ?? 0,
        todayOrders: s.orders ?? s.todayOrders ?? 0,
        avgOrderValue: s.avgValue ?? s.avgOrderValue ?? 0,
      });
      setSummaryTopProducts(top || []);
      setHourlyData(
        revenueFilter === 'today'
          ? data || []
          : (data || []).map((d) => ({
              hour: d.date?.slice(5) || d.date,
              revenue: d.revenue,
              orders: d.orders,
            }))
      );
    } catch {
      setStats({ todayRevenue: 0, todayOrders: 0, avgOrderValue: 0 });
      setSummaryTopProducts([]);
      setHourlyData([]);
    } finally {
      setLoading(false);
      setPanelLoading(false);
    }
  }

  async function loadTopProducts() {
    try {
      const data = await dashboardAPI.getTopProducts({ period: topProductsFilter });
      setTopProducts(data || []);
    } catch {
      setTopProducts([]);
    }
  }

  async function loadPaymentBreakdown() {
    try {
      const data = await dashboardAPI.getPaymentBreakdown();
      setPaymentBreakdown(data || []);
    } catch {
      setPaymentBreakdown([]);
    }
  }

  async function loadRecentOrders() {
    try {
      const data = await transactionAPI.getRecent(5);
      setRecentOrders(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {
      setRecentOrders([]);
    }
  }

  const storeStatus = useMemo(() => {
    if (!store) return 'Chưa đồng bộ cửa hàng';
    return `${getPackageLabel(store.packageTier)} · ${getModeLabel(store.operatingMode)}`;
  }, [store]);

  const paymentTotal = paymentBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);

  const statCards = [
    {
      label: 'Doanh thu hôm nay',
      value: formatCurrency(stats.todayRevenue),
      hint: revenueFilter === 'today' ? 'Tính theo dữ liệu trực tiếp' : `Mốc ${timeFilters.find((f) => f.key === revenueFilter)?.label || revenueFilter}`,
      icon: CircleDollarSign,
    },
    {
      label: 'Số giao dịch',
      value: String(stats.todayOrders || 0),
      hint: 'Đơn đã hoàn tất',
      icon: Receipt,
    },
    {
      label: 'Trung bình / GD',
      value: formatCurrency(stats.avgOrderValue),
      hint: 'Giá trị trung bình mỗi đơn',
      icon: BadgeDollarSign,
    },
    {
      label: 'Món dẫn đầu',
      value: summaryTopProducts[0]?.name || 'Chưa có dữ liệu',
      hint: summaryTopProducts[0] ? `${summaryTopProducts[0].quantity || 0} món đã bán` : 'Sẽ hiện ở đây khi có đơn',
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">Bảng điều hành</div>
          <h1>{store?.name || 'POS Portal'}</h1>
          <p>{store?.address || 'Tổng quan vận hành, doanh thu và hoạt động gần nhất trong một màn hình.'}</p>
          <div className="dashboard-hero-meta">
            <span><Store size={14} /> {storeStatus}</span>
            <span><Clock3 size={14} /> Cập nhật theo thời gian thực</span>
            <span><CalendarDays size={14} /> Hôm nay</span>
          </div>
          <div className="dashboard-hero-actions">
            <Link to="/transactions" className="dashboard-action primary">Xem giao dịch</Link>
            <Link to="/products" className="dashboard-action">Quản lý sản phẩm</Link>
          </div>
        </div>

        <div className="dashboard-hero-panel">
          <div className="hero-panel-row">
            <span>Tổng đơn</span>
            <strong>{stats.todayOrders.toLocaleString('vi-VN')}</strong>
          </div>
          <div className="hero-panel-row">
            <span>Doanh thu</span>
            <strong>{formatCurrency(stats.todayRevenue)}</strong>
          </div>
          <div className="hero-panel-row">
            <span>Phương thức nổi bật</span>
            <strong>
              {paymentBreakdown[0]
                ? paymentLabels[paymentBreakdown[0].method] || paymentBreakdown[0].method
                : 'Chưa có dữ liệu'}
            </strong>
          </div>
        </div>
      </section>

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
            <div>
              <h2 className="chart-title">
                {revenueFilter === 'today' ? 'Doanh thu theo giờ' : 'Doanh thu theo ngày'}
              </h2>
              <p className="chart-subtitle">Nhìn ra nhịp bán hàng trong từng khung thời gian</p>
            </div>
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
            {loading ? (
              <div className="empty-state">Đang tải biểu đồ...</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
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
            )}
          </div>
        </section>

        <aside className="dashboard-side">
          <section className="chart-section breakdown-panel">
            <div className="panel-heading">
              <div>
                <h2 className="chart-title">Cơ cấu thanh toán</h2>
                <p className="chart-subtitle">Tỷ trọng theo phương thức hôm nay</p>
              </div>
            </div>
            <div className="breakdown-list">
              {paymentBreakdown.length === 0 && <div className="empty-state compact">Chưa có dữ liệu</div>}
              {paymentBreakdown.map((item) => {
                const percent = paymentTotal ? Math.round((item.total / paymentTotal) * 100) : 0;
                return (
                  <div className="breakdown-item" key={item.method}>
                    <div className="breakdown-label">
                      <CreditCard size={14} />
                      <span>{paymentLabels[item.method] || item.method || 'Khác'}</span>
                    </div>
                    <strong>{percent}%</strong>
                    <div className="breakdown-bar">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>{formatCurrency(item.total)}</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="chart-section recent-panel">
            <div className="panel-heading">
              <div>
                <h2 className="chart-title">Giao dịch gần đây</h2>
                <p className="chart-subtitle">5 đơn mới nhất đã hoàn tất</p>
              </div>
            </div>
            <div className="recent-list">
              {recentOrders.length === 0 && <div className="empty-state compact">Chưa có giao dịch gần đây</div>}
              {recentOrders.slice(0, 5).map((order) => (
                <div className="recent-item" key={order.id}>
                  <div className="recent-main">
                    <strong>{order.orderNumber}</strong>
                    <span>{formatVietnamDateTime(order.createdAt)}</span>
                  </div>
                  <div className="recent-meta">
                    <span>{paymentLabels[order.paymentMethod] || order.paymentMethod || '—'}</span>
                    <span>{formatCurrency(order.finalTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="dashboard-grid bottom-grid">
        <section className="chart-section top-products-panel">
          <div className="top-products-title-row">
            <div>
              <h2 className="chart-title">Sản phẩm bán chạy</h2>
              <p className="chart-subtitle">Bản đồ món hàng đang kéo doanh thu</p>
            </div>
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
            {!panelLoading && topProducts.length === 0 && <div className="top-products-empty">Chưa có dữ liệu</div>}
            {topProducts.slice(0, 4).map((product, index) => (
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
        </section>

        <section className="chart-section insight-panel">
          <div className="panel-heading">
            <div>
              <h2 className="chart-title">Tín hiệu nhanh</h2>
              <p className="chart-subtitle">Một cái nhìn ngắn cho ca làm</p>
            </div>
          </div>
          <div className="insight-list">
            <div className="insight-item">
              <TrendingUp size={16} />
              <div>
                <strong>{stats.todayOrders ? `${Math.round(stats.todayRevenue / Math.max(stats.todayOrders, 1))} đ / đơn` : 'Chưa có đơn'}</strong>
                <span>Giá trị trung bình theo đơn hoàn tất</span>
              </div>
            </div>
            <div className="insight-item">
              <ShoppingBag size={16} />
              <div>
                <strong>{summaryTopProducts[0]?.name || 'Chưa có sản phẩm nổi bật'}</strong>
                <span>{summaryTopProducts[0] ? `${summaryTopProducts[0].quantity || 0} món đã bán` : 'Món dẫn đầu sẽ hiện ở đây'}</span>
              </div>
            </div>
            <div className="insight-item">
              <Store size={16} />
              <div>
                <strong>{store?.phone || 'Chưa có số điện thoại'}</strong>
                <span>{store?.email || 'Thông tin cửa hàng sẽ hiển thị tại đây'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
