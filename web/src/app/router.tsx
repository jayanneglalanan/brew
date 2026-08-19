import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { canAccess, homePathForRole, type NavKey } from 'mock-data';
import { RangeFilterProvider } from './RangeFilterContext';
import { DataProvider } from './DataContext';
import { AuthProvider, useAuth } from './AuthContext';
import { ShopNameProvider } from './ShopNameContext';
import Layout from '@/components/layout/Layout';
import { ToastProvider } from '@/components/ui/Toast';
import DashboardScreen from '@/features/dashboard/DashboardScreen';
import SalesScreen from '@/features/sales/SalesScreen';
import InventoryScreen from '@/features/inventory/InventoryScreen';
import ProductsScreen from '@/features/products/ProductsScreen';
import AnalyticsScreen from '@/features/analytics/AnalyticsScreen';
import ProfitScreen from '@/features/profit/ProfitScreen';
import ReportsScreen from '@/features/reports/ReportsScreen';
import ManagementScreen from '@/features/management/ManagementScreen';
import SettingsScreen from '@/features/settings/SettingsScreen';
import LoginScreen from '@/features/login/LoginScreen';

const PATH_KEY: Array<{ prefix: string; key: NavKey }> = [
  { prefix: '/sales', key: 'sales' },
  { prefix: '/inventory', key: 'inventory' },
  { prefix: '/products', key: 'products' },
  { prefix: '/analytics', key: 'analytics' },
  { prefix: '/profit', key: 'profit' },
  { prefix: '/reports', key: 'reports' },
  { prefix: '/management', key: 'management' },
];

function keyForPath(pathname: string): NavKey {
  for (const { prefix, key } of PATH_KEY) {
    if (pathname.startsWith(prefix)) return key;
  }
  return 'dashboard';
}

function RoleGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user && !canAccess(user.role, keyForPath(pathname))) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return <>{children}</>;
}

function Gate() {
  const { authed } = useAuth();
  if (!authed) return <LoginScreen />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardScreen />} />
        <Route path="sales" element={<RoleGuard><SalesScreen /></RoleGuard>} />
        <Route path="inventory" element={<RoleGuard><InventoryScreen /></RoleGuard>} />
        <Route path="products" element={<RoleGuard><ProductsScreen /></RoleGuard>} />
        <Route path="analytics" element={<RoleGuard><AnalyticsScreen /></RoleGuard>} />
        <Route path="profit" element={<RoleGuard><ProfitScreen /></RoleGuard>} />
        <Route path="reports" element={<RoleGuard><ReportsScreen /></RoleGuard>} />
        <Route path="management" element={<RoleGuard><ManagementScreen /></RoleGuard>} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<RoleGuard><DashboardScreen /></RoleGuard>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ShopNameProvider>
          <RangeFilterProvider>
            <DataProvider>
              <ToastProvider>
                <Gate />
              </ToastProvider>
            </DataProvider>
          </RangeFilterProvider>
        </ShopNameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}