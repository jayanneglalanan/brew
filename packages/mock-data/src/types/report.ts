import type { PaymentMethod } from './transaction';
import type { StockStatus } from './inventory';

export interface SalesSummary {
  grossSales: number;
  discounts: number;
  voidedSales: number;
  refunds: number;
  netSales: number;
  transactions: number;
  averageOrderValue: number;
  itemsSold: number;
}

export interface ProfitSummary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  category: string;
  sold: number;
  revenue: number;
  profit: number;
}

export interface TrendingProduct {
  productId: string;
  name: string;
  currentSales: number;
  previousSales: number;
  changePercent: number;
}

export interface PeakHour {
  hour: number;
  label: string;
  transactions: number;
  sales: number;
}

export interface CategoryBreakdown {
  category: string;
  sales: number;
  share: number;
}

export interface PaymentBreakdown {
  method: PaymentMethod;
  label: string;
  sales: number;
  share: number;
}

export interface InventoryStatusSummary {
  total: number;
  healthy: number;
  low: number;
  critical: number;
  inventoryValue: number;
  lowItems: Array<{ item: string; current: number; unit: string; level: StockStatus }>;
}

export interface StockStatusRow {
  itemId: string;
  name: string;
  current: number;
  unit: string;
  reorderLevel: number;
  status: StockStatus;
}

export interface StaffPerformance {
  staffId: string;
  name: string;
  role: string;
  transactions: number;
  sales: number;
  voids: number;
  discounts: number;
}

export interface ExceptionItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
}

export interface DailySalesPoint {
  label: string;
  sales: number;
  transactions: number;
  profit: number;
}
