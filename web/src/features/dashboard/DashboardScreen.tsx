import {
  expenses,
  getCategoryBreakdown,
  getDailySales,
  getExceptions,
  getInventorySummary,
  getPaymentBreakdown,
  getProfitSummary,
  getSalesByRange,
  getTopProducts,
  getTrendingProducts,
  previousPeriod,
  DAY_MS,
  formatPeso,
  formatPercent,
  formatNumber,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import { useRangeFilter } from '@/app/RangeFilterContext';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { Donut, SalesChart, ProgressBar } from '@/components/charts';
import { PageHeader } from '@/components/ui/Page';
import type { ExceptionItem } from 'mock-data';

const SEVERITY: Record<string, string> = {
  critical: 'bg-rose-50 text-rose-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-blue-50 text-blue-700',
};

function delta(current: number, previous: number): number | undefined {
  if (!previous) return undefined;
  return (current - previous) / previous;
}

export default function DashboardScreen() {
  const { transactions, products, inventory, stockMovements } = useData();
  const { filter, range } = useRangeFilter();
  const prev = previousPeriod(range);
  const sales = getSalesByRange(transactions, range);
  const prevSales = getSalesByRange(transactions, prev);
  const profit = getProfitSummary(transactions, products, expenses, range);
  const prevProfit = getProfitSummary(transactions, products, expenses, prev);
  const top = getTopProducts(transactions, products, range, 'sales', 5);
  const trending = getTrendingProducts(transactions, products, range, 5);
  const inv = getInventorySummary(inventory);
  const cat = getCategoryBreakdown(transactions, products, range);
  const pay = getPaymentBreakdown(transactions, range);
  const exceptions = getExceptions(transactions, inventory, stockMovements, range);
  const now = new Date();
  const week = { start: new Date(now.getTime() - 6 * DAY_MS), end: now, label: 'Last 7 days' };
  const daily = getDailySales(transactions, products, week);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`How is your coffee shop doing ${filter === 'all' ? 'overall' : range.label.toLowerCase()}?`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="slate">{range.label}</Badge>
            <Badge variant="brand">{daily.length} day chart</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Net Sales" count={sales.netSales} format={formatPeso} icon="💰" delta={delta(sales.netSales, prevSales.netSales)} />
        <StatCard label="Net Profit" count={profit.netProfit} format={formatPeso} icon="📈" delta={delta(profit.netProfit, prevProfit.netProfit)} accent="green" />
        <StatCard label="Transactions" count={sales.transactions} format={(n) => formatNumber(Math.round(n))} icon="🧾" delta={delta(sales.transactions, prevSales.transactions)} accent="blue" />
        <StatCard label="Profit Margin" count={profit.netMargin} format={formatPercent} icon="📊" delta={delta(profit.netMargin, prevProfit.netMargin)} accent="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <Card title="Sales Overview" subtitle="Daily net sales & transaction volume" className="lg:col-span-2">
          <SalesChart data={daily} />
        </Card>
        <Card title="Sales by Category" subtitle="Share of revenue by category">
          <Donut data={cat.map((c) => ({ name: c.category, value: c.sales }))} />
          <div className="mt-3 space-y-1.5">
            {cat.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <span className="text-stone-700">{c.category}</span>
                <span className="font-medium text-stone-800">{formatPercent(c.share, 0)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Payment Methods" subtitle="Cash, GCash & card share">
          <Donut
            data={pay.map((p) => ({ name: p.label, value: p.sales }))}
            colors={['#8FAF91', '#8B6F5A', '#D5A85C']}
          />
          <div className="mt-3 space-y-1.5">
            {pay.map((p) => (
              <div key={p.method} className="flex items-center justify-between text-xs">
                <span className="text-stone-700">{p.label}</span>
                <span className="font-medium text-stone-800">
                  {formatPeso(p.sales, { compact: true })} · {formatPercent(p.share, 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Top Selling Products" subtitle="Ranked by units sold" className="lg:col-span-2">
          <table className="tbl w-full table-fixed">
            <thead>
              <tr className="border-b border-stone-200">
                <th>#</th>
                <th>Product</th>
                <th>Sold</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {top.map((p, i) => (
                <tr key={p.productId}>
                  <td className="w-10 font-semibold text-stone-500">{i + 1}</td>
                  <td>
                    <span className="font-medium text-stone-800">{p.name}</span>
                    <span className="ml-2 text-xs text-stone-500">{p.category}</span>
                  </td>
                  <td className="font-medium">{p.sold}</td>
                  <td>{formatPeso(p.revenue)}</td>
                  <td className="text-emerald-600">{formatPeso(p.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Trending Products" subtitle="vs previous period">
          <div className="space-y-4">
            {trending.map((t) => (
              <div key={t.productId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-800">{t.name}</span>
                  <span className={`font-semibold ${t.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.changePercent >= 0 ? '+' : ''}
                    {Math.round(t.changePercent * 100)}%
                  </span>
                </div>
                <ProgressBar value={50 + Math.min(50, Math.abs(t.changePercent) * 100)} color={t.changePercent >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Inventory Status" subtitle={`${inv.total} items tracked · ${formatPeso(inv.inventoryValue, { compact: true })} value`}>
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-emerald-50 py-3">
              <p className="text-2xl font-bold text-emerald-700">{inv.healthy}</p>
              <p className="label text-emerald-600">Healthy</p>
            </div>
            <div className="rounded-lg bg-amber-50 py-3">
              <p className="text-2xl font-bold text-amber-700">{inv.low}</p>
              <p className="label text-amber-600">Low</p>
            </div>
            <div className="rounded-lg bg-rose-50 py-3">
              <p className="text-2xl font-bold text-rose-700">{inv.critical}</p>
              <p className="label text-rose-600">Critical</p>
            </div>
          </div>
          <div className="space-y-2">
            {inv.lowItems.slice(0, 5).map((it) => (
              <div key={it.item} className="flex items-center justify-between text-sm">
                <span className="text-stone-700">{it.item}</span>
                <span className={`pulse-once ${it.level === 'critical' ? 'font-semibold text-rose-600' : 'text-amber-600'}`}>
                  {it.current} {it.unit}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Profit Breakdown" subtitle="Revenue vs COGS vs Expenses">
          <div className="space-y-4">
            <ProfitRow label="Revenue" value={profit.revenue} accent="bg-stone-800" />
            <ProfitRow label="COGS" value={profit.cogs} accent="bg-brand-500" />
            <ProfitRow label="Operating Expenses" value={profit.operatingExpenses} accent="bg-amber-500" />
            <div className="border-t border-stone-100 pt-3">
              <ProfitRow label="Net Profit" value={profit.netProfit} accent="bg-emerald-500" bold />
            </div>
            <div className="flex justify-between text-xs text-stone-500">
              <span>Gross margin: <b className="text-stone-700">{formatPercent(profit.grossMargin)}</b></span>
              <span>Net margin: <b className="text-stone-700">{formatPercent(profit.netMargin)}</b></span>
            </div>
          </div>
        </Card>

        <Card title="⚠ Exceptions & Alerts" subtitle="Items that need attention">
          <div className="space-y-2.5">
            {exceptions.slice(0, 6).map((e: ExceptionItem) => (
              <div key={e.id} className="flex items-start gap-2.5">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY[e.severity]?.split(' ')[1]}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800">{e.title}</p>
                  <p className="text-xs text-stone-500">{e.detail}</p>
                </div>
              </div>
            ))}
            {exceptions.length === 0 && <p className="text-sm text-stone-500">No exceptions 🎉</p>}
          </div>
        </Card>
      </div>

      <Card title="Top Categories" subtitle="Category revenue as a share of total" className="mt-4">
        <div className="space-y-3">
          {cat.map((c) => (
            <div key={c.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-stone-700">{c.category}</span>
                <span className="font-medium text-stone-800">{formatPeso(c.sales, { compact: true })} · {formatPercent(c.share, 0)}</span>
              </div>
              <ProgressBar value={c.share * 100} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProfitRow({ label, value, accent, bold = false }: { label: string; value: number; accent: string; bold?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={bold ? 'font-semibold text-stone-900' : 'text-stone-700'}>{label}</span>
        <span className={bold ? 'font-bold text-stone-900' : 'font-medium text-stone-800'}>{formatPeso(value)}</span>
      </div>
      <ProgressBar value={value} color={accent} />
    </div>
  );
}
