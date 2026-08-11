import { useState, useEffect } from 'react';
import { authAPI } from '../services/auth.api';
import { Shield, LogIn, LogOut, Key, UserCircle, AlertTriangle } from 'lucide-react';
import { formatVietnamDateTime } from '../utils/time';
import './ActivityLog.css';

const actionIcons = {
  LOGIN_SUCCESS: LogIn,
  LOGIN_FAILED: AlertTriangle,
  LOGOUT: LogOut,
  LOGOUT_ALL: LogOut,
  PASSWORD_CHANGED: Key,
  PASSWORD_CHANGE_FAILED: AlertTriangle,
  PASSWORD_RESET: Key,
  PROFILE_UPDATED: UserCircle,
  AVATAR_UPDATED: UserCircle,
  SECURITY_QUESTION_SET: Shield,
  SESSION_REVOKED: Shield,
  RESET_VERIFY_FAILED: AlertTriangle,
  RESET_TOKEN_CREATED: Key,
};

const actionLabels = {
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  LOGOUT: 'Đăng xuất',
  LOGOUT_ALL: 'Đăng xuất tất cả',
  PASSWORD_CHANGED: 'Đổi mật khẩu',
  PASSWORD_CHANGE_FAILED: 'Đổi mật khẩu thất bại',
  PASSWORD_RESET: 'Đặt lại mật khẩu',
  PROFILE_UPDATED: 'Cập nhật hồ sơ',
  AVATAR_UPDATED: 'Cập nhật ảnh đại diện',
  SECURITY_QUESTION_SET: 'Thiết lập câu hỏi bảo mật',
  SESSION_REVOKED: 'Hủy phiên đăng nhập',
  RESET_VERIFY_FAILED: 'Xác minh thất bại',
  RESET_TOKEN_CREATED: 'Yêu cầu đặt lại mật khẩu',
};

const actionColors = {
  LOGIN_SUCCESS: 'success',
  LOGIN_FAILED: 'danger',
  PASSWORD_CHANGE_FAILED: 'danger',
  RESET_VERIFY_FAILED: 'danger',
  LOGOUT: 'neutral',
  LOGOUT_ALL: 'neutral',
};

function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadActivity(); }, [page]);

  async function loadActivity() {
    setLoading(true);
    try {
      const data = await authAPI.getActivity(page, 20);
      setActivities(data.items);
      setTotal(data.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="activity-page">
      <div className="activity-header">
        <h2 className="activity-title">
          <Shield size={18} /> Nhật ký hoạt động
        </h2>
        <span className="activity-count">{total} sự kiện</span>
      </div>

      <div className="activity-list">
        {loading && <p className="activity-empty">Đang tải...</p>}
        {!loading && activities.length === 0 && (
          <p className="activity-empty">Chưa có hoạt động nào</p>
        )}
        {activities.map((item) => {
          const Icon = actionIcons[item.action] || Shield;
          const color = actionColors[item.action] || 'primary';
          return (
            <div className={`activity-item ${color}`} key={item.id}>
              <div className={`activity-icon ${color}`}>
                <Icon size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-action">
                  {actionLabels[item.action] || item.action}
                </div>
                {item.details && (
                  <div className="activity-details">{item.details}</div>
                )}
                <div className="activity-meta">
                  <span>{formatVietnamDateTime(item.createdAt, { assumeUtc: true })}</span>
                  {item.ipAddress && <span>• IP: {item.ipAddress}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="activity-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau →</button>
        </div>
      )}
    </div>
  );
}

export default ActivityLog;
