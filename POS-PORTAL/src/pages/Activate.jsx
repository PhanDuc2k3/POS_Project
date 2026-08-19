import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Store } from 'lucide-react';
import { authAPI } from '../services/auth.api';
import './Login.css';

function Activate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const activationToken = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!activationToken) {
      setError('Liên kết kích hoạt không hợp lệ');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu cần ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const user = await authAPI.activate(activationToken, password);
      setSuccess(`Tài khoản ${user.username} đã được kích hoạt. Đang chuyển tới đăng nhập...`);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.message || 'Kích hoạt thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">
            <Store size={22} strokeWidth={2.4} />
          </div>
          <h1>Kích hoạt POS Portal</h1>
          <p>Đặt mật khẩu để bắt đầu sử dụng hệ thống</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-error success">{success}</div>}

          <div className="login-field">
            <label htmlFor="password">Mật khẩu mới</label>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" size={16} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" size={16} />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading || !activationToken}>
            {loading ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
          </button>

          <Link to="/login" className="login-forgot">Quay lại đăng nhập</Link>
        </form>
      </div>
    </div>
  );
}

export default Activate;
