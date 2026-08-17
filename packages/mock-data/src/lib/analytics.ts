import type { Transaction } from '../types/transaction';
import type { Product } from '../types/product';
import type { InventoryItem, StockStatus, StockMovementEntry } from '../types/inventory';
import type { Expense } from '../types/expense';
import type { Staff } from '../types/staff';
import type {
  SalesSummary,
  ProfitSummary,
  TopProduct,
  TrendingProduct,
  PeakHour,
  CategoryBreakdown,
  PaymentBreakdown,
  InventoryStatusSummary,
  StockStatusRow,
  StaffPerformance,
  ExceptionItem,
  DailySalesPoint,
} from '../types/report';
import { transactionSubtotal, transactionNet, transactionItemsCount, transactionCogs } from './calculations';
import { isInRange, dayLabel, shortDate, type DateRange } from './dates';

function completed(txs: Transaction[]): Transaction[] {
  return txs.filter((t) => t.status === 'completed');
}

export function getSalesByRange(transactions: Transaction[], range: DateRange): SalesSummary {
  const all = transactions.filter((t) => isInRange(t.timestamp, range));
  const ok = completed(all);
  const gross = ok.reduce((s, t) => s + transactionSubtotal(t), 0);
  const discounts = ok.reduce((s, t) => s + t.discount, 0);
  const voided = all
    .filter((t) => t.status === 'voided')
    .reduce((s, t) => s + transactionSubtotal(t), 0);
  const refunds = all
    .filter((t) => t.status === 'refunded')
    .reduce((s, t) => s + transactionNet(t), 0);
  const net = gross - discounts;
  const itemsSold = ok.reduce((s, t) => s + transactionItemsCount(t), 0);
  return {
    grossSales: gross,
    discounts,
    voidedSales: voided,
    refunds,
    netSales: net,
    transactions: ok.length,
    averageOrderValue: ok.length ? net / ok.length : 0,
    itemsSold,
  };
}

export function getProfitSummary(
  transactions: Transaction[],
  products: Product[],
  expenses: Expense[],
  range: DateRange,
): ProfitSummary {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const ok = completed(transactions.filter((t) => isInRange(t.timestamp, range)));
  const revenue = ok.reduce((s, t) => s + transactionNet(t), 0);
  const cogs = ok.reduce((s, t) => s + transactionCogs(t, productsById), 0);
  const operatingExpenses = expenses.filter((e) => isInRange(e.timestamp, range)).reduce((s, e) => s + e.amount, 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - operatingExpenses;
  return {
    revenue,
    cogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    grossMargin: revenue ? grossProfit / revenue : 0,
    netMargin: revenue ? netProfit / revenue : 0,
  };
}

export type TopProductsSort = 'sales' | 'revenue' | 'profit';

export function getTopProducts(
  transactions: Transaction[],
  products: Product[],
  range: DateRange,
  sortBy: TopProductsSort = 'sales',
  limit = 10,
): TopProduct[] {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const counts = new Map<string, { sold: number; revenue: number; profit: number }>();
  for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, range)))) {
    for (const it of t.items) {
      const entry = counts.get(it.productId) ?? { sold: 0, revenue: 0, profit: 0 };
      entry.sold += it.qty;
      entry.revenue += it.price * it.qty;
      const p = productsById.get(it.productId);
      if (p) entry.profit += (it.price - p.cost) * it.qty;
      counts.set(it.productId, entry);
    }
  }
  const rows = [...counts.entries()].map(([productId, v]) => {
    const p = productsById.get(productId);
    return {
      productId,
      name: p?.name ?? productId,
      category: p?.category ?? '-',
      sold: v.sold,
      revenue: v.revenue,
      profit: v.profit,
    };
  });
  const key = sortBy === 'revenue' ? 'revenue' : sortBy === 'profit' ? 'profit' : 'sold';
  return rows.sort((a, b) => b[key] - a[key]).slice(0, limit);
}

export function getTrendingProducts(
  transactions: Transaction[],
  products: Product[],
  range: DateRange,
  limit = 6,
): TrendingProduct[] {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const count = (window: DateRange): Map<string, number> => {
    const m = new Map<string, number>();
    for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, window)))) {
      for (const it of t.items) {
        m.set(it.productId, (m.get(it.productId) ?? 0) + it.qty);
      }
    }
    return m;
  };
  const current = count(range);
  const length = range.end.getTime() - range.start.getTime();
  const prevStart = new Date(range.start.getTime() - length - 86400000);
  const prevEnd = new Date(range.start.getTime() - 1);
  const previous = count({ start: prevStart, end: prevEnd, label: 'previous' });
  const rows: TrendingProduct[] = [];
  for (const [productId, currentSales] of current) {
    const prevSales = previous.get(productId) ?? 0;
    if (currentSales < 3) continue;
    rows.push({
      productId,
      name: productsById.get(productId)?.name ?? productId,
      currentSales,
      previousSales: prevSales,
      changePercent: prevSales ? (currentSales - prevSales) / prevSales : 1,
    });
  }
  return rows.sort((a, b) => b.changePercent - a.changePercent).slice(0, limit);
}

export function getPeakHours(transactions: Transaction[], range: DateRange): PeakHour[] {
  const buckets: PeakHour[] = [];
  for (let hour = 0; hour < 24; hour++) {
    buckets.push({ hour, label: '', transactions: 0, sales: 0 });
  }
  for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, range)))) {
    const hour = new Date(t.timestamp).getHours();
    buckets[hour].transactions += 1;
    buckets[hour].sales += transactionNet(t);
  }
  return buckets
    .filter((b) => b.transactions > 0)
    .map((b) => ({
      ...b,
      label: `${b.hour % 12 === 0 ? 12 : b.hour % 12} ${b.hour < 12 ? 'AM' : 'PM'}`,
    }));
}

export function getCategoryBreakdown(transactions: Transaction[], products: Product[], range: DateRange): CategoryBreakdown[] {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const byCat = new Map<string, number>();
  for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, range)))) {
    for (const it of t.items) {
      const cat = productsById.get(it.productId)?.category ?? 'Other';
      byCat.set(cat, (byCat.get(cat) ?? 0) + it.price * it.qty);
    }
  }
  const total = [...byCat.values()].reduce((a, b) => a + b, 0);
  return [...byCat.entries()]
    .map(([category, sales]) => ({ category, sales, share: total ? sales / total : 0 }))
    .sort((a, b) => b.sales - a.sales);
}

const PAYMENT_LABELS: Record<string, string> = { cash: 'Cash', gcash: 'GCash', card: 'Card' };

export function getPaymentBreakdown(transactions: Transaction[], range: DateRange): PaymentBreakdown[] {
  const byMethod = new Map<string, number>();
  for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, range)))) {
    byMethod.set(t.paymentMethod, (byMethod.get(t.paymentMethod) ?? 0) + transactionNet(t));
  }
  const total = [...byMethod.values()].reduce((a, b) => a + b, 0);
  return [...byMethod.entries()]
    .map(([method, sales]) => ({
      method: method as PaymentBreakdown['method'],
      label: PAYMENT_LABELS[method] ?? method,
      sales,
      share: total ? sales / total : 0,
    }))
    .sort((a, b) => b.sales - a.sales);
}

export function getDailySales(transactions: Transaction[], products: Product[], range: DateRange): DailySalesPoint[] {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const buckets = new Map<string, DailySalesPoint>();
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  for (let d = new Date(cursor); d <= end; d.setDate(d.getDate() + 1)) {
    buckets.set(d.toDateString(), { label: dayLabel(d.toISOString()), sales: 0, transactions: 0, profit: 0 });
  }
  for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, range)))) {
    const key = new Date(t.timestamp).toDateString();
    const b = buckets.get(key);
    if (!b) continue;
    b.sales += transactionNet(t);
    b.transactions += 1;
    b.profit += transactionNet(t) - transactionCogs(t, productsById);
  }
  return [...buckets.values()];
}

export function getDailySalesShort(transactions: Transaction[], range: DateRange): Array<{ label: string; sales: number; transactions: number }> {
  const buckets = new Map<string, { label: string; sales: number; transactions: number }>();
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  for (let d = new Date(cursor); d <= end; d.setDate(d.getDate() + 1)) {
    buckets.set(d.toDateString(), { label: shortDate(d.toISOString()), sales: 0, transactions: 0 });
  }
  for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, range)))) {
    const b = buckets.get(new Date(t.timestamp).toDateString());
    if (b) {
      b.sales += transactionNet(t);
      b.transactions += 1;
    }
  }
  return [...buckets.values()];
}

export function stockStatus(item: InventoryItem): StockStatus {
  if (item.currentStock <= item.criticalLevel) return 'critical';
  if (item.currentStock <= item.reorderLevel) return 'low';
  return 'good';
}

export function getStockStatusRows(inventory: InventoryItem[]): StockStatusRow[] {
  return inventory
    .map((it) => ({
      itemId: it.id,
      name: it.name,
      current: it.currentStock,
      unit: it.unit,
      reorderLevel: it.reorderLevel,
      status: stockStatus(it),
    }))
    .sort((a, b) => (a.status === b.status ? a.current - b.current : a.status === 'critical' ? -1 : b.status === 'critical' ? 1 : a.status === 'low' ? -1 : 1));
}

export function getInventorySummary(inventory: InventoryItem[]): InventoryStatusSummary {
  let healthy = 0;
  let low = 0;
  let critical = 0;
  const lowItems: InventoryStatusSummary['lowItems'] = [];
  let inventoryValue = 0;
  for (const it of inventory) {
    const s = stockStatus(it);
    if (s === 'good') healthy += 1;
    if (s === 'low') {
      low += 1;
      lowItems.push({ item: it.name, current: it.currentStock, unit: it.unit, level: 'low' });
    }
    if (s === 'critical') {
      critical += 1;
      lowItems.push({ item: it.name, current: it.currentStock, unit: it.unit, level: 'critical' });
    }
    inventoryValue += it.currentStock * it.costPerUnit;
  }
  return { total: inventory.length, healthy, low, critical, inventoryValue, lowItems };
}

export interface StockMovementSummary {
  itemId: string;
  name: string;
  unit: string;
  purchases: number;
  salesConsumption: number;
  wastage: number;
  damaged: number;
  adjustments: number;
  currentStock: number;
}

export function getStockMovement(
  inventory: InventoryItem[],
  products: Product[],
  transactions: Transaction[],
  movements: StockMovementEntry[],
  range: DateRange,
): StockMovementSummary[] {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const rows = inventory.map((it) => ({
    itemId: it.id,
    name: it.name,
    unit: it.unit,
    purchases: 0,
    salesConsumption: 0,
    wastage: 0,
    damaged: 0,
    adjustments: 0,
    currentStock: it.currentStock,
  }));
  const rowById = new Map(rows.map((r) => [r.itemId, r]));
  for (const mv of movements.filter((m) => isInRange(m.timestamp, range))) {
    const row = rowById.get(mv.itemId);
    if (!row) continue;
    const n = typeof mv.qty === 'number' ? mv.qty : parseFloat(String(mv.qty));
    if (!Number.isFinite(n)) continue;
    if (mv.type === 'purchase') row.purchases += n;
    else if (mv.type === 'wastage') row.wastage += n;
    else if (mv.type === 'damaged') row.damaged += n;
    else row.adjustments += n;
  }
  for (const t of completed(transactions.filter((x) => isInRange(x.timestamp, range)))) {
    for (const it of t.items) {
      const p = productsById.get(it.productId);
      if (!p) continue;
      for (const ing of p.ingredients) {
        const row = rowById.get(ing.ingredientId);
        if (row) row.salesConsumption += ing.qty * it.qty;
      }
    }
  }
  return rows.filter((r) => r.purchases + r.salesConsumption + r.wastage + r.adjustments > 0);
}

export function getWastage(movements: StockMovementEntry[], inventory: InventoryItem[], range: DateRange) {
  const nameById = new Map(inventory.map((i) => [i.id, i.name]));
  const unitById = new Map(inventory.map((i) => [i.id, i.unit]));
  return movements
    .filter((m) => (m.type === 'wastage' || m.type === 'damaged') && isInRange(m.timestamp, range))
    .map((m) => ({
      id: m.id,
      item: nameById.get(m.itemId) ?? m.itemId,
      unit: unitById.get(m.itemId) ?? '',
      type: m.type,
      qty: m.qty,
      timestamp: m.timestamp,
      note: m.note ?? '',
    }));
}

export function getStaffPerformance(transactions: Transaction[], staff: Staff[], range: DateRange): StaffPerformance[] {
  const acc = new Map<string, StaffPerformance>();
  for (const s of staff) {
    acc.set(s.id, { staffId: s.id, name: s.name, role: s.role, transactions: 0, sales: 0, voids: 0, discounts: 0 });
  }
  for (const t of transactions.filter((x) => isInRange(x.timestamp, range))) {
    const row = acc.get(t.cashierId);
    if (!row) continue;
    if (t.status === 'completed') {
      row.transactions += 1;
      row.sales += transactionNet(t);
      row.discounts += t.discount;
    } else if (t.status === 'voided') {
      row.voids += 1;
    }
  }
  return [...acc.values()].sort((a, b) => b.sales - a.sales);
}

export function getExceptions(
  transactions: Transaction[],
  inventory: InventoryItem[],
  movements: StockMovementEntry[],
  range: DateRange,
): ExceptionItem[] {
  const out: ExceptionItem[] = [];
  for (const it of inventory) {
    const s = stockStatus(it);
    if (s === 'critical') {
      out.push({
        id: `exc-${it.id}`,
        severity: 'critical',
        title: `${it.name} critical`,
        detail: `Only ${it.currentStock} ${it.unit} remaining`,
      });
    } else if (s === 'low') {
      out.push({
        id: `exc-${it.id}`,
        severity: 'warning',
        title: `${it.name} running low`,
        detail: `${it.currentStock} ${it.unit} remaining (reorder at ${it.reorderLevel})`,
      });
    }
  }
  const voided = transactions.filter((t) => t.status === 'voided' && isInRange(t.timestamp, range));
  for (const t of voided) {
    out.push({ id: `exc-v-${t.id}`, severity: 'warning', title: `Voided transaction ${t.orderNumber}`, detail: 'Transaction voided by cashier' });
  }
  const refunded = transactions.filter((t) => t.status === 'refunded' && isInRange(t.timestamp, range));
  for (const t of refunded) {
    out.push({ id: `exc-r-${t.id}`, severity: 'warning', title: `Refund ${t.orderNumber}`, detail: 'Transaction refunded' });
  }
  const bigDiscounts = completed(transactions.filter((t) => isInRange(t.timestamp, range))).filter(
    (t) => t.discount > 0 && t.discount / transactionSubtotal(t) > 0.15,
  );
  for (const t of bigDiscounts.slice(0, 5)) {
    out.push({ id: `exc-d-${t.id}`, severity: 'info', title: `Large discount on ${t.orderNumber}`, detail: `Discount of ₱${t.discount.toFixed(2)} applied` });
  }
  const adjustments = movements.filter((m) => m.type === 'adjustment' && isInRange(m.timestamp, range));
  for (const a of adjustments) {
    out.push({ id: `exc-a-${a.id}`, severity: 'info', title: 'Inventory adjustment', detail: a.note ?? 'Manual stock adjustment' });
  }
  return out.slice(0, 12);
}

export function getInventoryValue(inventory: InventoryItem[]): number {
  return inventory.reduce((s, it) => s + it.currentStock * it.costPerUnit, 0);
}
