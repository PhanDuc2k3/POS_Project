import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Activate from './pages/Activate';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Store from './pages/Store';
import Profile from './pages/Profile';
import ActivityLog from './pages/ActivityLog';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="products" element={<Products />} />
        <Route path="settings" element={<Settings />} />
        <Route path="store" element={<Store />} />
        <Route path="profile" element={<Profile />} />
        <Route path="activity" element={<ActivityLog />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
