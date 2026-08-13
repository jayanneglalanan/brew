import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RangeFilterProvider } from './RangeFilterContext';
import { DataProvider } from './DataContext';
import Layout from '@/components/layout/Layout';
import DashboardScreen from '@/features/dashboard/DashboardScreen';
import SalesScreen from '@/features/sales/SalesScreen';
import InventoryScreen from '@/features/inventory/InventoryScreen';
import ProductsScreen from '@/features/products/ProductsScreen';
import AnalyticsScreen from '@/features/analytics/AnalyticsScreen';
import ProfitScreen from '@/features/profit/ProfitScreen';
import ReportsScreen from '@/features/reports/ReportsScreen';
import ManagementScreen from '@/features/management/ManagementScreen';
import RegisterScreen from '@/features/register/RegisterScreen';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <RangeFilterProvider>
        <DataProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardScreen />} />
              <Route path="register" element={<RegisterScreen />} />
              <Route path="sales" element={<SalesScreen />} />
              <Route path="inventory" element={<InventoryScreen />} />
              <Route path="products" element={<ProductsScreen />} />
              <Route path="analytics" element={<AnalyticsScreen />} />
              <Route path="profit" element={<ProfitScreen />} />
              <Route path="reports" element={<ReportsScreen />} />
              <Route path="management" element={<ManagementScreen />} />
              <Route path="*" element={<DashboardScreen />} />
            </Route>
          </Routes>
        </DataProvider>
      </RangeFilterProvider>
    </BrowserRouter>
  );
}
