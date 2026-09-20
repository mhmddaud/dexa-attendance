import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

/** Requires an authenticated session; otherwise redirect to /login. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

/** Requires a specific role; otherwise redirect to the user's own dashboard. */
export function RoleBasedRoute({ allow }: { allow: Role }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== allow) {
    const fallback =
      user.role === 'HRD' ? '/hrd/dashboard' : '/employee/dashboard';
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
}
