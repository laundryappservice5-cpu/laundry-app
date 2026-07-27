import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import type { UserRole } from '../types';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
