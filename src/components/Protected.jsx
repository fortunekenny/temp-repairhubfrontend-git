import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

/** Route guard — optionally restricted to specific roles. */
export default function Protected({ roles }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking session…" />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
