import { useMemo, useState } from 'react';
import {
  formatDateTime,
  formatPercent,
  formatPeso,
  getDateRange,
  getProfitSummary,
  getSalesByRange,
  expenses,
  type RangeFilter,
  type ExpenseCategory,
  type Expense,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import { PageHeader } from '@/components/ui/Page';
import { ProgressBar } from '@/components/charts';

const CATEGORY_LABEL: Record<string, string> = {
  rent: 'Rent',
  utilities: 'Utilities',
  supplies: 'Supplies',
  payroll: 'Payroll',
  maintenance: 'Maintenance',
  marketing: 'Marketing',
  other: 'Other',
};

const CATEGORY_COLOR: Record<string, string> = {
  rent: 'bg-rose-400',
  utilities: 'bg-amber-400',
  supplies: 'bg-blue-400',
  payroll: 'bg-emerald-400',
  maintenance: 'bg-purple-400',
  marketing: 'bg-pink-400',
  other: 'bg-stone-400',
};

export default function ProfitScreen() {
  const { products, transactions } = useData();
  const [filter, setFilter] = useState<RangeFilter>('month');
  const range = getDateRange(filter);

  const profit = useMemo(() => getProfitSummary(transactions, products, expenses, range), [range, products, transactions]);
  const sales = useMemo(() => getSalesByRange(transactions, range), [range, transactions]);
  const expByCat = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      const ts = new Date(e.timestamp).getTime();
      if (ts >= range.start.getTime() && ts <= range.end.getTime()) {
        map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
      }
    }
    return map;
  }, [range]);
  const expRows = [...expByCat.entries()].map(([cat, amount]) => ({
    cat,
    label: CATEGORY_LABEL[cat] ?? cat,
    amount,
    share: profit.operatingExpenses ? amount / profit.operatingExpenses : 0,
  }));

  return (
    <div>
      <PageHeader
        title="Profit & Expenses"
        subtitle="Revenue minus the cost of goods sold and operating expenses"
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value as RangeFilter)} className="input">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gross Revenue" value={formatPeso(profit.revenue)} icon="💰" />
        <StatCard label="Gross Profit" value={formatPeso(profit.grossProfit)} icon="📈" accent="green" />
        <StatCard label="Operating Expenses" value={formatPeso(profit.operatingExpenses)} icon="🧾" accent="amber" />
        <StatCard label="Net Profit" value={formatPeso(profit.netProfit)} icon="💵" accent="brand" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Income Statement" subtitle={range.label} className="lg:col-span-2">
          <IncomeRow label="Revenue" value={profit.revenue} />
          <IncomeRow label="Cost of Goods Sold (COGS)" value={profit.cogs} muted />
          <div className="border-t border-stone-100 pt-3">
            <IncomeRow label="Gross Profit" value={profit.grossProfit} bold />
            <p className="text-right text-xs text-emerald-300">Gross margin {formatPercent(profit.grossMargin)}</p>
          </div>
          <div className="border-t border-stone-100 pt-3">
            <IncomeRow label="Operating Expenses" value={profit.operatingExpenses} muted />
          </div>
          <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-3">
            <IncomeRow label="Net Profit" value={profit.netProfit} bold accent />
            <p className="text-right text-xs text-emerald-700">Net margin {formatPercent(profit.netMargin)}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <MiniStat label="Avg Net Margin / Order" value={formatPercent(sales.netSales ? profit.netProfit / sales.transactions / (sales.netSales / sales.transactions) : 0)} />
            <MiniStat label="Gross Profit / Order" value={formatPeso(sales.transactions ? profit.grossProfit / sales.transactions : 0)} />
          </div>
        </Card>

        <Card title="Expenses by Category">
          <div className="space-y-4">
            {expRows.map((r) => (
              <div key={r.cat}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-stone-200">{r.label}</span>
                  <span className="font-medium text-stone-100">{formatPeso(r.amount, { compact: true })}</span>
                </div>
                <ProgressBar value={r.share * 100} color={CATEGORY_COLOR[r.cat]} />
              </div>
            ))}
            {expRows.length === 0 && <p className="text-sm text-stone-300">No expenses in this period.</p>}
          </div>
        </Card>
      </div>

      <Card title="Expense Details" subtitle={range.label} className="mt-4">
        <Table<Expense>
          columns={[
            { header: 'Expense', key: 'name', render: (r) => <span className="font-medium text-stone-100">{r.name}</span> },
            { header: 'Category', key: 'category', render: (r) => <Badge variant="slate">{CATEGORY_LABEL[r.category] ?? r.category}</Badge> },
            { header: 'Amount', key: 'amount', className: 'text-right', render: (r) => <b>{formatPeso(r.amount)}</b> },
            { header: 'Recurring', key: 'recurring', render: (r) => (r.recurring ? <Badge variant="blue">recurring</Badge> : <span className="text-stone-300">—</span>) },
            { header: 'Date', key: 'timestamp', render: (r) => formatDateTime(r.timestamp) },
          ]}
          rows={expenses.filter((e: Expense) => {
            const ts = new Date(e.timestamp).getTime();
            return ts >= range.start.getTime() && ts <= range.end.getTime();
          })}
          rowKey={(r) => r.id}
        />
      </Card>
    </div>
  );
}

function IncomeRow({ label, value, muted, bold, accent }: { label: string; value: number; muted?: boolean; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={bold ? 'text-sm font-semibold text-stone-50' : 'text-sm text-stone-200'}>{label}</span>
      <span className={`text-sm ${accent ? 'font-bold text-emerald-700' : bold ? 'font-semibold text-stone-50' : muted ? 'text-stone-300' : 'font-medium text-stone-100'}`}>
        {formatPeso(value)}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="label">{label}</p>
      <p className="mt-1 text-lg font-bold text-stone-900">{value}</p>
    </div>
  );
}
