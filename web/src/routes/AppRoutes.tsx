import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../layouts/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { DownloadAppPage } from '../pages/DownloadAppPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomerListPage } from '../pages/customers/CustomerListPage';
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage';
import { PickupListPage } from '../pages/pickups/PickupListPage';
import { PickupCreatePage } from '../pages/pickups/PickupCreatePage';
import { PickupDetailPage } from '../pages/pickups/PickupDetailPage';
import { OrderListPage } from '../pages/orders/OrderListPage';
import { OrderDetailPage } from '../pages/orders/OrderDetailPage';
import { WalkInOrderCreatePage } from '../pages/orders/WalkInOrderCreatePage';
import { DriverListPage } from '../pages/drivers/DriverListPage';
import { ServicesPage } from '../pages/services/ServicesPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DRIVER_LOGISTICS_ENABLED } from '../utils/featureFlags';

export function AppRoutes() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/download-app" element={<DownloadAppPage />} />

      <Route element={<ProtectedRoute allowedRoles={['ROOT_ADMIN', 'ADMIN']} />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          {DRIVER_LOGISTICS_ENABLED && (
            <>
              <Route path="/pickups" element={<PickupListPage />} />
              <Route path="/pickups/new" element={<PickupCreatePage />} />
              <Route path="/pickups/:id" element={<PickupDetailPage />} />
              <Route path="/drivers" element={<DriverListPage />} />
            </>
          )}
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/walk-in" element={<WalkInOrderCreatePage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
