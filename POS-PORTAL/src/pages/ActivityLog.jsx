import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Key,
  LogIn,
  LogOut,
  Search,
  Shield,
  TrendingUp,
  UserCircle,
  Users,
} from 'lucide-react';
import { authAPI } from '../services/auth.api';
import { formatVietnamDate, formatVietnamTime, parsePortalDate } from '../utils/time';
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
  SECURITY_QUESTION_SET: 'Cấu hình bảo mật',
  SESSION_REVOKED: 'Hủy phiên',
  RESET_VERIFY_FAILED: 'Xác minh thất bại',
  RESET_TOKEN_CREATED: 'Yêu cầu đặt lại mật khẩu',
};

const dangerousActions = new Set([
  'LOGIN_FAILED',
  'PASSWORD_CHANGE_FAILED',
  'RESET_VERIFY_FAILED',
  'SESSION_REVOKED',
]);

const configActions = new Set([
  'SECURITY_QUESTION_SET',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'RESET_TOKEN_CREATED',
]);

function getActionTone(action) {
  if (dangerousActions.has(action)) return 'alert';
  if (action?.includes('LOGIN')) return 'create';
  if (action?.includes('LOGOUT')) return 'delete';
  if (configActions.has(action)) return 'config';
  return 'update';
}

const toneLabels = {
  alert: 'ALERT',
  config: 'CONFIG',
  create: 'LOGIN',
  delete: 'LOGOUT',
  update: 'UPDATE',
};

function getObjectInfo(item) {
  if (item.action?.includes('LOGIN') || item.action?.includes('LOGOUT')) {
    return { title: 'User Session', subtitle: item.ipAddress || 'POS Portal' };
  }
  if (item.action?.includes('PASSWORD') || item.action?.includes('SECURITY')) {
    return { title: 'System Settings', subtitle: 'Security' };
  }
  if (item.action?.includes('PROFILE') || item.action?.includes('AVATAR')) {
    return { title: 'Account Profile', subtitle: item.username || 'Admin' };
  }
  return { title: `Log ID: #${item.id}`, subtitle: 'System Activity' };
}

function isSameVietnamDate(value, offsetDays = 0) {
  const date = parsePortalDate(value, { assumeUtc: true });
  if (!date || Number.isNaN(date.getTime())) return false;
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  return formatVietnamDate(date) === formatVietnamDate(target);
}

function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [page, limit]);

  async function loadActivity() {
    setLoading(true);
    try {
      const data = await authAPI.getActivity(page, limit);
      setActivities(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setActivities([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const filteredActivities = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return activities.filter((item) => {
      const label = actionLabels[item.action] || item.action || '';
      const haystack = [
        item.id,
        item.action,
        label,
        item.details,
        item.ipAddress,
        item.username,
        item.email,
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = !keyword || haystack.includes(keyword);
      const matchesAction = actionFilter === 'all' || getActionTone(item.action) === actionFilter;
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && isSameVietnamDate(item.createdAt, 0)) ||
        (dateFilter === 'yesterday' && isSameVietnamDate(item.createdAt, -1));

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [activities, actionFilter, dateFilter, search]);

  const stats = useMemo(() => {
    const todayCount = activities.filter((item) => isSameVietnamDate(item.createdAt, 0)).length;
    const warningCount = activities.filter((item) => dangerousActions.has(item.action)).length;
    const uniqueUsers = new Set(
      activities.map((item) => item.username || item.email || item.userId).filter(Boolean)
    ).size;

    return {
      today: todayCount || Math.min(total, activities.length),
      warnings: warningCount,
      users: Math.max(uniqueUsers, activities.length ? 1 : 0),
    };
  }, [activities, total]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function handleLimitChange(event) {
    setLimit(Number(event.target.value));
    setPage(1);
  }

  function handleExport() {
    const headers = ['Thời gian', 'Người dùng', 'Hành động', 'Đối tượng', 'Chi tiết', 'IP'];
    const rows = filteredActivities.map((item) => {
      const object = getObjectInfo(item);
      return [
        `${formatVietnamDate(item.createdAt, { assumeUtc: true })} ${formatVietnamTime(item.createdAt, { assumeUtc: true })}`,
        item.username || item.email || 'Admin System',
        actionLabels[item.action] || item.action,
        object.title,
        item.details || '',
        item.ipAddress || '',
      ];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="activity-page">
      <div className="activity-heading">
        <div>
          <h1>Nhật ký hoạt động</h1>
          <p>Theo dõi các thay đổi quan trọng trong hệ thống</p>
        </div>
        <button className="activity-export" onClick={handleExport}>
          <Download size={15} />
          Xuất báo cáo
        </button>
      </div>

      <div className="activity-stats">
        <div className="activity-stat-card">
          <div className="activity-stat-icon blue"><TrendingUp size={20} /></div>
          <span className="activity-stat-chip positive">+12%</span>
          <p>Hoạt động hôm nay</p>
          <strong>{stats.today.toLocaleString('vi-VN')}</strong>
        </div>
        <div className="activity-stat-card warning">
          <div className="activity-stat-icon red"><Shield size={20} /></div>
          <span className="activity-stat-chip alert">Cần chú ý</span>
          <p>Cảnh báo bảo mật</p>
          <strong>{stats.warnings.toLocaleString('vi-VN')}</strong>
        </div>
        <div className="activity-stat-card">
          <div className="activity-stat-icon gray"><Users size={20} /></div>
          <p>Người dùng đang online</p>
          <strong>{stats.users.toLocaleString('vi-VN')}</strong>
        </div>
      </div>

      <div className="activity-table-card">
        <div className="activity-toolbar">
          <label className="activity-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo ID, chi tiết..."
            />
          </label>
          <label className="activity-select">
            <Calendar size={15} />
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="all">Tất cả ngày</option>
            </select>
          </label>
          <label className="activity-select">
            <Filter size={15} />
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
              <option value="all">Loại hành động</option>
              <option value="create">Đăng nhập</option>
              <option value="update">Cập nhật</option>
              <option value="config">Cấu hình</option>
              <option value="delete">Đăng xuất</option>
              <option value="alert">Cảnh báo</option>
            </select>
          </label>
          <div className="activity-limit">
            <span>Hiển thị:</span>
            <select value={limit} onChange={handleLimitChange}>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
            </select>
          </div>
        </div>

        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người dùng</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th>Chi tiết</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="activity-empty">Đang tải nhật ký...</td>
                </tr>
              )}
              {!loading && filteredActivities.length === 0 && (
                <tr>
                  <td colSpan="6" className="activity-empty">Chưa có hoạt động phù hợp</td>
                </tr>
              )}
              {!loading && filteredActivities.map((item) => {
                const Icon = actionIcons[item.action] || Activity;
                const tone = getActionTone(item.action);
                const object = getObjectInfo(item);
                const userName = item.username || 'Admin System';
                const userMeta = item.email || item.ipAddress || 'admin@pos.vn';

                return (
                  <tr key={item.id}>
                    <td className="activity-time">
                      <strong>{formatVietnamTime(item.createdAt, { assumeUtc: true })}</strong>
                      <span>{formatVietnamDate(item.createdAt, { assumeUtc: true })}</span>
                    </td>
                    <td>
                      <div className="activity-user">
                        <span>{userName.charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{userName}</strong>
                          <small>{userMeta}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`activity-badge ${tone}`}>
                        <Icon size={12} />
                        {toneLabels[tone]}
                      </span>
                    </td>
                    <td className="activity-object">
                      <strong>{object.title}</strong>
                      <span>{object.subtitle}</span>
                    </td>
                    <td className="activity-detail">
                      {item.details || actionLabels[item.action] || item.action}
                    </td>
                    <td className="activity-row-action">
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="activity-footer">
          <span>
            Đang hiển thị {filteredActivities.length ? 1 : 0}-{filteredActivities.length} trên {total.toLocaleString('vi-VN')} kết quả
          </span>
          <div className="activity-pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                className={pageNumber === page ? 'active' : ''}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            {totalPages > 3 && <span>...</span>}
            {totalPages > 3 && (
              <button className={totalPages === page ? 'active' : ''} onClick={() => setPage(totalPages)}>
                {totalPages}
              </button>
            )}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityLog;
