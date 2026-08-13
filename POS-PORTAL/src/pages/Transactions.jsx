import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Download, Plus, Search } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '../constants/orderStatus';
import { REALTIME_EVENTS } from '../constants/realtimeEvents';
import { storeAPI } from '../services/store.api';
import { transactionAPI } from '../services/transaction.api';
import { useRealtime } from '../hooks/useRealtime';
import { formatVietnamDateTime } from '../utils/time';
import './Transactions.css';

const PAGE_SIZE = 50;

function formatCurrency(v) { return new Intl.NumberFormat('vi-VN').format(v || 0) + ' đ'; }

function paymentLabel(method) {
  if (method === 'cash') return 'Tiền mặt';
  if (method === 'transfer') return 'Chuyển khoản';
  if (method === 'card') return 'Thẻ tín dụng';
  if (method === 'wallet') return 'Ví điện tử';
  return method || '—';
}

function Transactions() {
  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDraft, setSessionDraft] = useState({ tableCode: '', guestCount: 2, note: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const restaurantEnabled = Boolean(store && (store.operatingMode === 'restaurant' || ['restaurant', 'chain'].includes(store.packageTier)));

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => { loadOrders(); }, [page, statusFilter, paymentFilter]);

  const handleTxnChange = useCallback(() => {
    loadOrders();
    if (restaurantEnabled) loadSessions();
  }, [page, statusFilter, paymentFilter, restaurantEnabled]);

  useRealtime(REALTIME_EVENTS.TRANSACTION_CREATED, handleTxnChange);
  useRealtime(REALTIME_EVENTS.TRANSACTION_CANCELLED, handleTxnChange);
  useRealtime(REALTIME_EVENTS.TRANSACTION_REFUNDED, handleTxnChange);

  async function loadMeta() {
    try {
      const data = await storeAPI.getStore();
      setStore(data);
      if (data && (data.operatingMode === 'restaurant' || ['restaurant', 'chain'].includes(data.packageTier))) {
        loadSessions();
      }
    } catch {
      // ignore
    }
  }

  async function loadOrders() {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentMethod = paymentFilter;
      if (search) params.search = search;
      const data = await transactionAPI.getOrders(params);
      setOrders(data.items);
      setTotal(data.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function loadSessions() {
    try {
      const data = await transactionAPI.getDiningSessions({ status: 'open', limit: 12 });
      setSessions(data.items || []);
    } catch {
      setSessions([]);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadOrders();
  }

  async function handleCreateSession(e) {
    e.preventDefault();
    try {
      if (!sessionDraft.tableCode.trim()) {
        showToast('Nhập số bàn trước khi mở phiên');
        return;
      }
      await transactionAPI.createDiningSession({
        tableCode: sessionDraft.tableCode.trim(),
        guestCount: sessionDraft.guestCount,
        note: sessionDraft.note,
      });
      setSessionDraft({ tableCode: '', guestCount: 2, note: '' });
      loadSessions();
      showToast('Đã mở phiên bàn');
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleSelectOrder(order) {
    try {
      const detail = await transactionAPI.getOrder(order.id);
      setSelected(detail);
    } catch { setSelected(order); }
  }

  async function handleSelectSession(session) {
    try {
      const detail = await transactionAPI.getDiningSession(session.id);
      setSelectedSession(detail);
    } catch {
      setSelectedSession(session);
    }
  }

  async function handleCancel(id) {
    if (!confirm('Hủy giao dịch này?')) return;
    try {
      await transactionAPI.cancelOrder(id);
      setSelected(null);
      loadOrders();
      showToast('Đã hủy giao dịch');
    } catch (err) { showToast(err.message); }
  }

  async function handleCloseSession(id) {
    if (!confirm('Đóng phiên bàn này?')) return;
    try {
      await transactionAPI.closeDiningSession(id);
      setSelectedSession(null);
      loadSessions();
      showToast('Đã đóng phiên bàn');
    } catch (err) {
      showToast(err.message);
    }
  }

  function exportCsv() {
    const header = ['Thời gian', 'Mã GD', 'Số tiền', 'Thanh toán', 'Trạng thái', 'Thiết bị'];
    const rows = orders.map((o) => [
      formatVietnamDateTime(o.createdAt),
      o.orderNumber,
      o.finalTotal,
      paymentLabel(o.paymentMethod),
      ORDER_STATUS_LABELS[o.status] || o.status,
      o.deviceName || '',
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'giao-dich.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="transactions">
      <div className="transactions-heading">
        <div>
          <h1>Giao dịch</h1>
          <p>Theo dõi và quản lý lịch sử thanh toán</p>
        </div>
        <button className="export-btn" type="button" onClick={exportCsv}>
          <Download size={14} />
          Xuất Excel
        </button>
      </div>

      <section className="transactions-card">
        <form className="transactions-toolbar" onSubmit={handleSearch}>
          <label className="search-input-wrap">
            <Search size={14} />
            <input
              className="search-input"
              placeholder="Tìm theo Mã GD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="select-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="completed">Thành công</option>
            <option value="pending">Đang chờ</option>
            <option value="cancelled">Đã hủy</option>
            <option value="refunded">Hoàn tiền</option>
          </select>
          <select className="select-filter" value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}>
            <option value="">PT Thanh toán</option>
            <option value="cash">Tiền mặt</option>
            <option value="transfer">Chuyển khoản</option>
          </select>
          <span className="transactions-count">Hiển thị {PAGE_SIZE} giao dịch gần nhất</span>
        </form>

        {restaurantEnabled && (
          <div className="restaurant-panel">
            <div className="restaurant-panel-header">
              <div>
                <strong>Phiên bàn đang mở</strong>
                <span>Quản lý nhanh cho chế độ nhà hàng</span>
              </div>
              <form className="restaurant-create-form" onSubmit={handleCreateSession}>
                <input
                  value={sessionDraft.tableCode}
                  onChange={(e) => setSessionDraft({ ...sessionDraft, tableCode: e.target.value })}
                  placeholder="Bàn 12"
                />
                <input
                  type="number"
                  min="1"
                  value={sessionDraft.guestCount}
                  onChange={(e) => setSessionDraft({ ...sessionDraft, guestCount: e.target.value })}
                  placeholder="2"
                />
                <button type="submit">
                  <Plus size={14} />
                  Mở phiên
                </button>
              </form>
            </div>
            <div className="restaurant-session-list">
              {sessions.length === 0 && <span className="restaurant-empty">Chưa có phiên bàn nào đang mở</span>}
              {sessions.map((session) => (
                <button type="button" className="restaurant-session-item" key={session.id} onClick={() => handleSelectSession(session)}>
                  <strong>{session.tableCode || session.sessionCode}</strong>
                  <span>{session.sessionCode}</span>
                  <span>{session.orderCount || 0} món, {formatCurrency(session.pendingAmount || 0)} chờ</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Mã GD</th>
                <th>Số tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thiết bị</th>
                <th aria-label="Chi tiết"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="empty-cell">Đang tải...</td></tr>}
              {!loading && orders.length === 0 && <tr><td colSpan="7" className="empty-cell">Chưa có giao dịch</td></tr>}
              {orders.map((o) => (
                <tr key={o.id} onClick={() => handleSelectOrder(o)}>
                  <td>{formatVietnamDateTime(o.createdAt)}</td>
                  <td className="order-code">{o.orderNumber}</td>
                  <td className="amount-cell">{formatCurrency(o.finalTotal)}</td>
                  <td><span className={`payment-method ${o.paymentMethod || ''}`}>{paymentLabel(o.paymentMethod)}</span></td>
                  <td><span className={`status-badge ${o.status}`}>{ORDER_STATUS_LABELS[o.status] || o.status}</span></td>
                  <td>{o.deviceName || '—'}</td>
                  <td className="row-action"><ChevronRight size={15} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="transactions-pagination">
          <span>Đang hiển thị {startItem}-{endItem} trong số {total} giao dịch</span>
          <div className="pagination-actions">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            {[1, 2, 3].filter((p) => p <= totalPages).map((p) => (
              <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            {totalPages > 4 && <span>...</span>}
            {totalPages > 3 && <button className={page === totalPages ? 'active' : ''} onClick={() => setPage(totalPages)}>{totalPages}</button>}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Giao dịch {selected.orderNumber}</h3>
            <div className="modal-meta">
              <span>{formatVietnamDateTime(selected.createdAt)}</span>
              <span className={`status-badge ${selected.status}`}>{ORDER_STATUS_LABELS[selected.status]}</span>
            </div>
            {selected.items && (
              <div className="modal-items">
                {selected.items.map((item, i) => (
                  <div className="modal-item" key={i}>
                    <span>{item.productName} x{item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            )}
            {selected.discount > 0 && (
              <div className="modal-item danger-line">
                <span>Giảm giá</span><span>-{formatCurrency(selected.discount)}</span>
              </div>
            )}
            <div className="modal-total">
              <span>Tổng cộng</span>
              <span>{formatCurrency(selected.finalTotal)}</span>
            </div>
            <div className="modal-actions">
              {selected.status === 'completed' && (
                <button className="btn btn-danger" onClick={() => handleCancel(selected.id)}>Hủy giao dịch</button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Phiên bàn {selectedSession.tableCode || selectedSession.sessionCode}</h3>
            <div className="modal-meta">
              <span>{selectedSession.sessionCode}</span>
              <span className={`status-badge ${selectedSession.status}`}>{selectedSession.status}</span>
            </div>
            <div className="modal-items">
              {(selectedSession.orders || []).map((order) => (
                <div className="modal-item" key={order.id}>
                  <span>{order.orderNumber} - {order.status}</span>
                  <span>{formatCurrency(order.finalTotal)}</span>
                </div>
              ))}
            </div>
            <div className="modal-total">
              <span>Tổng cộng</span>
              <span>{formatCurrency(selectedSession.totalAmount || 0)}</span>
            </div>
            <div className="modal-actions">
              {selectedSession.status === 'open' && (
                <button className="btn btn-danger" onClick={() => handleCloseSession(selectedSession.id)}>Đóng phiên</button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedSession(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Transactions;
