import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">P</div>
          <h1>POS Control Center</h1>
          <p>Đăng nhập để quản lý hệ thống</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="login-field">
            <label htmlFor="username">Tên đăng nhập</label>
            <input id="username" type="text" value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin" autoComplete="username" required />
          </div>
          <div className="login-field">
            <label htmlFor="password">Mật khẩu</label>
            <input id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" required />
          </div>
          <div className="login-options">
            <label className="login-remember">
              <input type="checkbox" checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)} />
              <span>Nhớ tôi (30 ngày)</span>
            </label>
            <Link to="/forgot-password" className="login-forgot">Quên mật khẩu?</Link>
          </div>
          <button type="submit" className="login-btn"
            disabled={loading || !username || !password}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
