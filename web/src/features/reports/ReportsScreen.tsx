import { useMemo, useState } from 'react';
import {
  formatNumber,
  formatPercent,
  formatPeso,
  getDateRange,
  getDailySalesShort,
  getInventorySummary,
  getProfitSummary,
  getSalesByRange,
  getStaffPerformance,
  getStockStatusRows,
  expenses,
  staff,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';

const TABS = [
  { value: 'sales', label: 'Sales Report' },
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'profit', label: 'Profit Report' },
  { value: 'staff', label: 'Staff Report' },
];

interface PeriodRow {
  period: string;
  sales: number;
  transactions: number;
  profit: number;
}

export default function ReportsScreen() {
  const { products, transactions, inventory } = useData();
  const [tab, setTab] = useState('sales');
  const week = useMemo(() => getDateRange('week'), []);
  const month = useMemo(() => getDateRange('month'), []);
  const today = useMemo(() => getDateRange('today'), []);

  const periodRows: PeriodRow[] = useMemo(
    () =>
      (
        [
          ['Today', today],
          ['This Week', week],
          ['This Month', month],
        ] as Array<[string, ReturnType<typeof getDateRange>]>
      ).map(([label, range]) => {
        const s = getSalesByRange(transactions, range);
        const p = getProfitSummary(transactions, products, expenses, range);
        return { period: label, sales: s.netSales, transactions: s.transactions, profit: p.netProfit };
      }),
    [today, week, month, transactions, products],
  );

  const dailyRows = useMemo(() => getDailySalesShort(transactions, month), [month, transactions]);
  const invSummary = useMemo(() => getInventorySummary(inventory), [inventory]);
  const stockRows = useMemo(() => getStockStatusRows(inventory), [inventory]);
  const staffRows = useMemo(() => getStaffPerformance(transactions, staff, month), [month, transactions]);
  const profit = useMemo(() => getProfitSummary(transactions, products, expenses, month), [month, transactions, products]);

  const periodColumns: Column<PeriodRow>[] = [
    { header: 'Period', key: 'period', render: (r) => <b className="text-stone-100">{r.period}</b> },
    { header: 'Net Sales', key: 'sales', className: 'text-right', render: (r) => formatPeso(r.sales) },
    { header: 'Transactions', key: 'transactions', className: 'text-right' },
    { header: 'Net Profit', key: 'profit', className: 'text-right', render: (r) => <b className="text-emerald-300">{formatPeso(r.profit)}</b> },
  ];

  const dailyColumns: Column<(typeof dailyRows)[number]>[] = [
    { header: 'Date', key: 'label' },
    { header: 'Sales', key: 'sales', className: 'text-right', render: (r) => formatPeso(r.sales) },
    { header: 'Transactions', key: 'transactions', className: 'text-right' },
  ];

  const staffColumns: Column<(typeof staffRows)[number]>[] = [
    { header: 'Staff', key: 'name', render: (r) => <span className="font-medium text-stone-100">{r.name}</span> },
    { header: 'Role', key: 'role', render: (r) => <Badge variant={r.role === 'cashier' ? 'slate' : 'brand'}>{r.role}</Badge> },
    { header: 'Transactions', key: 'transactions', className: 'text-right' },
    { header: 'Sales', key: 'sales', className: 'text-right', render: (r) => formatPeso(r.sales) },
    { header: 'Voids', key: 'voids', className: 'text-right', render: (r) => <span className={r.voids > 0 ? 'text-rose-300' : 'text-stone-300'}>{r.voids}</span> },
    { header: 'Discounts', key: 'discounts', className: 'text-right', render: (r) => formatPeso(r.discounts) },
  ];

  const stockColumns: Column<(typeof stockRows)[number]>[] = [
    { header: 'Item', key: 'name', render: (r) => <span className="font-medium text-stone-100">{r.name}</span> },
    { header: 'Current', key: 'current', className: 'text-right', render: (r) => <b>{r.current} {r.unit}</b> },
    { header: 'Reorder Level', key: 'reorderLevel', className: 'text-right' },
    { header: 'Status', key: 'status', render: (r) => <Badge variant={r.status}>{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Consolidated business reports" />
      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'sales' && (
        <div className="space-y-4">
          <Card title="Sales Summary" subtitle="Net sales, volume and profit across periods">
            <Table columns={periodColumns} rows={periodRows} rowKey={(r) => r.period} />
          </Card>
          <Card title="Daily Sales — This Month" subtitle="Month-to-date breakdown">
            <Table columns={dailyColumns} rows={dailyRows} rowKey={(r) => r.label} />
          </Card>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Mini label="Total Items" value={formatNumber(invSummary.total)} />
            <Mini label="Healthy" value={formatNumber(invSummary.healthy)} tone="text-emerald-300" />
            <Mini label="Low" value={formatNumber(invSummary.low)} tone="text-amber-300" />
            <Mini label="Critical" value={formatNumber(invSummary.critical)} tone="text-rose-300" />
          </div>
          <Card title="Current Inventory" subtitle="All stock items and their status">
            <Table columns={stockColumns} rows={stockRows} rowKey={(r) => r.itemId} />
          </Card>
        </div>
      )}

      {tab === 'profit' && (
        <Card title="Profit Report" subtitle={month.label}>
          <div className="max-w-lg space-y-3">
            <ProfitLine label="Revenue" value={profit.revenue} />
            <ProfitLine label="COGS" value={profit.cogs} />
            <ProfitLine label="Gross Profit" value={profit.grossProfit} sub={`Gross margin ${formatPercent(profit.grossMargin)}`} />
            <ProfitLine label="Operating Expenses" value={profit.operatingExpenses} />
            <div className="border-t border-stone-100 pt-3">
              <ProfitLine label="Net Profit" value={profit.netProfit} bold sub={`Net margin ${formatPercent(profit.netMargin)}`} />
            </div>
          </div>
        </Card>
      )}

      {tab === 'staff' && (
        <Card title="Staff Performance" subtitle={`Ranked by sales · ${month.label}`}>
          <Table columns={staffColumns} rows={staffRows} rowKey={(r) => r.staffId} />
        </Card>
      )}
    </div>
  );
}

function Mini({ label, value, tone = 'text-stone-50' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card card-pad text-center">
      <p className="label">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function ProfitLine({ label, value, bold, sub }: { label: string; value: number; bold?: boolean; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm ${bold ? 'font-semibold text-stone-50' : 'text-stone-200'}`}>{label}</p>
        {sub && <p className="text-xs text-emerald-300">{sub}</p>}
      </div>
      <p className={`text-sm ${bold ? 'font-bold text-emerald-300' : 'font-medium text-stone-100'}`}>{formatPeso(value)}</p>
    </div>
  );
}
