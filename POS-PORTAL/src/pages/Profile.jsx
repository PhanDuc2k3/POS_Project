import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/auth.api';
import { LogOut, Key, Monitor, Smartphone, Tablet, Trash2, Shield, Camera, HelpCircle } from 'lucide-react';
import { formatVietnamDate, formatVietnamDateTime, parsePortalDate } from '../utils/time';
import './Profile.css';

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  pos: Monitor,
  unknown: Monitor,
};

function Profile() {
  const { user, logout, logoutAll, updateProfile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [toast, setToast] = useState('');

  // Profile edit
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Security question
  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [secQuestion, setSecQuestion] = useState('');
  const [secAnswer, setSecAnswer] = useState('');
  const [secPassword, setSecPassword] = useState('');

  // Avatar
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  async function loadSessions() {
    try {
      const data = await authAPI.getSessions({ clientType: 'pos_app' });
      setSessions(data);
    } catch {
      // ignore
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    try {
      await updateProfile({ displayName, email });
      showToast('Cập nhật thông tin thành công');
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      showToast('Đổi mật khẩu thành công. Đang đăng xuất...');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setPasswordError(err.message);
    }
  }

  async function handleRevokeSession(id) {
    try {
      await authAPI.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast('Đã hủy phiên đăng nhập');
    } catch {
      showToast('Không thể hủy phiên');
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ảnh quá lớn. Tối đa 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await authAPI.uploadAvatar(reader.result);
        await updateProfile({});
        showToast('Cập nhật ảnh đại diện thành công');
      } catch (err) {
        showToast(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleDeleteAvatar() {
    try {
      await authAPI.deleteAvatar();
      await updateProfile({});
      showToast('Đã xóa ảnh đại diện');
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleSecurityQuestion(e) {
    e.preventDefault();
    try {
      await authAPI.setSecurityQuestion(secQuestion, secAnswer, secPassword);
      showToast('Đã thiết lập câu hỏi bảo mật');
      setShowSecurityForm(false);
      setSecPassword('');
      setSecAnswer('');
    } catch (err) {
      showToast(err.message);
    }
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = parsePortalDate(dateStr, { assumeUtc: true });
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return formatVietnamDate(date);
  }

  return (
    <div className="profile">
      {/* Profile Info */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
          {user?.avatar ? (
            <img src={`http://localhost:4000${user.avatar}`} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar">
              {(user?.displayName || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-avatar-overlay">
            <Camera size={16} />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>
        <div>
          <div className="profile-name">{user?.displayName || 'Admin'}</div>
          <div className="profile-role">{user?.role === 'admin' ? 'Chủ cửa hàng' : user?.role}</div>
          {user?.avatar && (
            <button className="btn-link" onClick={handleDeleteAvatar}>Xóa ảnh</button>
          )}
        </div>
      </div>

      {/* Edit Profile */}
      <form className="profile-section" onSubmit={handleProfileSave}>
        <h3 className="profile-section-title">Thông tin cá nhân</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Tên hiển thị</label>
            <input
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input className="form-input" value={user?.username || ''} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Đăng nhập lần cuối</label>
            <input className="form-input" value={formatVietnamDateTime(user?.lastLogin, { assumeUtc: true }) || 'N/A'} disabled />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Lưu thông tin</button>
        </div>
      </form>

      {/* Change Password */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h3 className="profile-section-title">Bảo mật</h3>
          <button
            className="btn btn-ghost"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            <Key size={14} />
            {showPasswordForm ? 'Hủy' : 'Đổi mật khẩu'}
          </button>
        </div>

        {showPasswordForm && (
          <form className="password-form" onSubmit={handleChangePassword}>
            {passwordError && <div className="login-error">{passwordError}</div>}
            <div className="form-group">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input
                className="form-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Xác nhận đổi mật khẩu</button>
            </div>
          </form>
        )}
      </div>

      {/* Security Question */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h3 className="profile-section-title">
            <HelpCircle size={14} style={{ marginRight: 6 }} />
            Câu hỏi bảo mật
          </h3>
          <button className="btn btn-ghost" onClick={() => setShowSecurityForm(!showSecurityForm)}>
            {user?.hasSecurityQuestion ? 'Thay đổi' : 'Thiết lập'}
          </button>
        </div>
        {user?.hasSecurityQuestion && !showSecurityForm && (
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            ✓ Đã thiết lập: "{user.securityQuestion}"
          </p>
        )}
        {showSecurityForm && (
          <form className="password-form" onSubmit={handleSecurityQuestion}>
            <div className="form-group">
              <label className="form-label">Câu hỏi</label>
              <select className="form-input" value={secQuestion} onChange={(e) => setSecQuestion(e.target.value)} required>
                <option value="">Chọn câu hỏi...</option>
                <option value="Món ăn yêu thích của bạn là gì?">Món ăn yêu thích của bạn là gì?</option>
                <option value="Tên trường tiểu học của bạn?">Tên trường tiểu học của bạn?</option>
                <option value="Tên thú cưng đầu tiên?">Tên thú cưng đầu tiên?</option>
                <option value="Thành phố bạn sinh ra?">Thành phố bạn sinh ra?</option>
                <option value="Biệt danh hồi nhỏ của bạn?">Biệt danh hồi nhỏ của bạn?</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Câu trả lời</label>
              <input className="form-input" value={secAnswer} onChange={(e) => setSecAnswer(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu hiện tại</label>
              <input className="form-input" type="password" value={secPassword} onChange={(e) => setSecPassword(e.target.value)} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Lưu câu hỏi bảo mật</button>
            </div>
          </form>
        )}
      </div>

      {/* Active Sessions */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h3 className="profile-section-title">
            <Shield size={14} style={{ marginRight: 6 }} />
            Thiết bị POS đang đăng nhập
          </h3>
          <span className="session-count">{sessions.length} thiết bị POS</span>
        </div>
        <div className="sessions-list">
          {sessions.length === 0 && (
            <p className="sessions-empty">Không có thiết bị POS nào đang hoạt động</p>
          )}
          {sessions.map((session) => {
            const DeviceIcon = deviceIcons[session.deviceType] || Monitor;
            return (
              <div className={`session-item${session.isCurrent ? ' current' : ''}`} key={session.id}>
                <div className="session-icon-wrapper">
                  <DeviceIcon size={20} />
                </div>
                <div className="session-details">
                  <div className="session-device-name">
                    {session.deviceName || 'Thiết bị không xác định'}
                    {session.isCurrent && <span className="session-current-badge">Thiết bị này</span>}
                  </div>
                  <div className="session-meta-row">
                    <span className="session-ip">{session.ipAddress || 'N/A'}</span>
                    <span className="session-separator">•</span>
                    <span className="session-time">Hoạt động {formatTimeAgo(session.lastUsed)}</span>
                  </div>
                  <div className="session-extra">
                    {session.deviceId && (
                      <span className="session-serial" title="Số serie thiết bị">
                        SN: {session.deviceId}
                      </span>
                    )}
                    {session.os && <span className="session-os-badge">{session.os}</span>}
                    {session.browser && session.browser !== 'Unknown' && (
                      <span className="session-os-badge">{session.browser}</span>
                    )}
                    {session.screenResolution && (
                      <span className="session-os-badge">{session.screenResolution}</span>
                    )}
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    className="session-revoke"
                    onClick={() => handleRevokeSession(session.id)}
                    title="Đăng xuất thiết bị này"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="profile-section">
        <h3 className="profile-section-title">Đăng xuất</h3>
        <div className="logout-actions">
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut size={14} />
            Đăng xuất thiết bị này
          </button>
          {sessions.length > 1 && (
            <button className="btn btn-danger" onClick={logoutAll}>
              <LogOut size={14} />
              Đăng xuất tất cả ({sessions.length}) thiết bị
            </button>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Profile;
