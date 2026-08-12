import { NavLink } from 'react-router-dom';
import {
  Activity,
  Building2,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Store,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: Receipt, label: 'Giao dịch' },
  { to: '/products', icon: Package, label: 'Sản phẩm' },
  { to: '/store', icon: Building2, label: 'Cửa hàng' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
  { to: '/activity', icon: Activity, label: 'Nhật ký' },
  { to: '/profile', icon: User, label: 'Tài khoản' },
];

function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Store size={18} strokeWidth={2.5} />
        </div>
        <div>
          <span className="sidebar-brand-text">POS<br />Control</span>
          <span className="sidebar-brand-subtitle">Admin Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
