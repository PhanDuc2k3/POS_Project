import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Store,
  User,
  LogOut,
  Activity,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: Receipt, label: 'Giao d\u1ECBch' },
  { to: '/products', icon: ShoppingBag, label: 'S\u1EA3n ph\u1EA9m' },
  { to: '/store', icon: Store, label: 'C\u1EEDa h\u00E0ng' },
  { to: '/settings', icon: Settings, label: 'C\u00E0i \u0111\u1EB7t' },
  { to: '/activity', icon: Activity, label: 'Nh\u1EADt k\u00FD' },
  { to: '/profile', icon: User, label: 'T\u00E0i kho\u1EA3n' },
];

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">P</div>
        <span className="sidebar-brand-text">POS Control</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(user?.displayName || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.displayName || 'Admin'}</span>
            <span className="sidebar-user-role">{user?.role === 'admin' ? 'Chủ cửa hàng' : user?.role}</span>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
