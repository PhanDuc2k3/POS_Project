import { useState, useEffect, useCallback } from 'react';
import { ORDER_STATUS_LABELS } from '../constants/orderStatus';
import { REALTIME_EVENTS } from '../constants/realtimeEvents';
import { transactionAPI } from '../services/transaction.api';
import { useRealtime } from '../hooks/useRealtime';
import { formatVietnamDateTime, formatVietnamTime } from '../utils/time';
import './Transactions.css';


function formatCurrency(v) { return new Intl.NumberFormat('vi-VN').format(v) + ' đ'; }

function Transactions() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => { loadOrders(); }, [page, statusFilter]);

  // Realtime: auto-refresh when transactions change
  const handleTxnChange = useCallback(() => {
    loadOrders();
  }, [page, statusFilter]);

  useRealtime(REALTIME_EVENTS.TRANSACTION_CREATED, handleTxnChange);
  useRealtime(REALTIME_EVENTS.TRANSACTION_CANCELLED, handleTxnChange);
  useRealtime(REALTIME_EVENTS.TRANSACTION_REFUNDED, handleTxnChange);

  async function loadOrders() {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await transactionAPI.getOrders(params);
      setOrders(data.items);
      setTotal(data.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadOrders();
  }

  async function handleSelectOrder(order) {
    try {
      const detail = await transactionAPI.getOrder(order.id);
      setSelected(detail);
    } catch { setSelected(order); }
  }

  async function handleCancel(id) {
    if (!confirm('Hủy giao dịch này?')) return;
    try { await transactionAPI.cancelOrder(id); setSelected(null); loadOrders(); showToast('Đã hủy giao dịch'); }
    catch (err) { showToast(err.message); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="transactions">
      <form className="transactions-toolbar" onSubmit={handleSearch}>
        <input className="search-input" placeholder="Tìm theo mã GD, số tiền..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="completed">Thành công</option>
          <option value="pending">Đang chờ</option>
          <option value="cancelled">Đã hủy</option>
          <option value="refunded">Hoàn tiền</option>
        </select>
        <span className="transactions-count">{total} giao dịch</span>
      </form>

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
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="6" style={{textAlign:'center',color:'var(--gray-400)'}}>Đang tải...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan="6" style={{textAlign:'center',color:'var(--gray-400)'}}>Chưa có giao dịch</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} onClick={() => handleSelectOrder(o)}>
                <td>{formatVietnamTime(o.createdAt)}</td>
                <td>{o.orderNumber}</td>
                <td>{formatCurrency(o.finalTotal)}</td>
                <td>{o.paymentMethod === 'cash' ? 'Tiền mặt' : o.paymentMethod === 'transfer' ? 'Chuyển khoản' : o.paymentMethod}</td>
                <td><span className={`status-badge ${o.status}`}>{ORDER_STATUS_LABELS[o.status] || o.status}</span></td>
                <td>{o.deviceName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="transactions-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau →</button>
        </div>
      )}

      {/* Order detail modal */}
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
              <div className="modal-item" style={{color:'var(--danger)'}}>
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Transactions;
