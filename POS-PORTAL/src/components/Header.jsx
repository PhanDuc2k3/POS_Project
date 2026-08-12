import { Bell, Radio, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

function Header() {
  const { user } = useAuth();
  const userLabel = user?.role === 'admin' ? 'Quản trị viên' : user?.displayName || 'Admin';

  return (
    <header className="header">
      <label className="header-search">
        <Search size={13} />
        <input placeholder="Tìm kiếm..." />
      </label>

      <div className="header-actions">
        <button className="header-bell" aria-label="Thông báo">
          <Bell size={16} />
        </button>
        <button className="header-bell" aria-label="Kết nối">
          <Radio size={16} />
        </button>
        <div className="header-user">
          <div className="header-avatar">{(user?.displayName || 'A').charAt(0).toUpperCase()}</div>
          <span>{userLabel}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
