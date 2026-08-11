import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/auth.api';
import './Login.css';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=username, 2=answer, 3=new password
  const [username, setUsername] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGetQuestion(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.forgotPasswordQuestion(username);
      setQuestion(data.question);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function handleVerifyAnswer(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.forgotPasswordVerify(username, answer);
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPasswordReset(resetToken, newPassword);
      navigate('/login', { state: { message: 'Đặt lại mật khẩu thành công!' } });
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">🔑</div>
          <h1>Quên mật khẩu</h1>
          <p>
            {step === 1 && 'Nhập tên đăng nhập để bắt đầu'}
            {step === 2 && 'Trả lời câu hỏi bảo mật'}
            {step === 3 && 'Tạo mật khẩu mới'}
          </p>
        </div>
        {error && <div className="login-error">{error}</div>}

        {step === 1 && (
          <form className="login-form" onSubmit={handleGetQuestion}>
            <div className="login-field">
              <label>Tên đăng nhập</label>
              <input type="text" value={username}
                onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <button type="submit" className="login-btn" disabled={loading || !username}>
              {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="login-form" onSubmit={handleVerifyAnswer}>
            <div className="login-field">
              <label>Câu hỏi bảo mật</label>
              <p style={{ fontSize: 14, color: 'var(--gray-700)', fontWeight: 500 }}>{question}</p>
            </div>
            <div className="login-field">
              <label>Câu trả lời</label>
              <input type="text" value={answer}
                onChange={(e) => setAnswer(e.target.value)} required />
            </div>
            <button type="submit" className="login-btn" disabled={loading || !answer}>
              {loading ? 'Đang xác minh...' : 'Xác nhận'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="login-form" onSubmit={handleResetPassword}>
            <div className="login-field">
              <label>Mật khẩu mới</label>
              <input type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="login-field">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" className="login-forgot">← Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
