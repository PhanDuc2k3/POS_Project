import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import './Header.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Giao dịch',
  '/products': 'Sản phẩm',
  '/settings': 'Cài đặt',
  '/store': 'Cửa hàng',
  '/profile': 'Tài khoản',
  '/activity': 'Nhật ký hoạt động',
};

function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'POS Portal';

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <button className="header-bell" aria-label="Thông báo">
          <Bell size={18} />
        </button>
        <div className="header-avatar">A</div>
      </div>
    </header>
  );
}

export default Header;
