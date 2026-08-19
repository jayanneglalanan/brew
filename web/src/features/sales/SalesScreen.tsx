import { useMemo, useState } from 'react';
import {
  expenses,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getDailySalesShort,
  getPaymentBreakdown,
  getProfitSummary,
  getSalesByRange,
  staff,
  transactionNet,
  transactionSubtotal,
  transactionItemsCount,
  type PaymentBreakdown,
  type Staff,
  type Transaction,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import { useRangeFilter } from '@/app/RangeFilterContext';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';
import { Donut, SalesChart } from '@/components/charts';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'payments', label: 'Payment Methods' },
  { value: 'voids', label: 'Voids & Refunds' },
];

const PAYMENT_LABEL: Record<string, string> = { cash: 'Cash', gcash: 'GCash', card: 'Card' };
const PAYMENT_BADGE: Record<string, string> = { cash: 'green', gcash: 'blue', card: 'amber' };
const STATUS_BADGE: Record<string, string> = { completed: 'good', voided: 'amber', refunded: 'critical' };

export default function SalesScreen() {
  const { products, transactions } = useData();
  const { range } = useRangeFilter();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');

  const metrics = useMemo(() => ({
    sales: getSalesByRange(transactions, range),
    profit: getProfitSummary(transactions, products, expenses, range),
    cat: getCategoryBreakdown(transactions, products, range),
    pay: getPaymentBreakdown(transactions, range),
    daily: getDailySalesShort(transactions, range),
  }), [range, products, transactions]);

  const inRange = (t: typeof transactions[number]) => {
    const ts = new Date(t.timestamp).getTime();
    return ts >= range.start.getTime() && ts <= range.end.getTime();
  };
  const completed = transactions.filter((t) => t.status === 'completed' && inRange(t));
  const voids = transactions.filter((t) => t.status === 'voided' && inRange(t));
  const refunds = transactions.filter((t) => t.status === 'refunded' && inRange(t));

  const staffByName = new Map<string, string>(staff.map((s: Staff) => [s.id, s.name]));

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Revenue, transactions and payment analytics"
      />
      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Gross Sales" value={formatPeso(metrics.sales.grossSales)} icon="💵" />
            <StatCard label="Net Sales" value={formatPeso(metrics.sales.netSales)} icon="💰" />
            <StatCard label="Transactions" value={formatNumber(metrics.sales.transactions)} icon="🧾" accent="blue" />
            <StatCard label="Avg Order Value" value={formatPeso(metrics.sales.averageOrderValue)} icon="📏" accent="slate" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Discounts" value={formatPeso(metrics.sales.discounts)} icon="🏷️" accent="amber" />
            <StatCard label="Voided Sales" value={formatPeso(metrics.sales.voidedSales)} icon="🚫" accent="red" />
            <StatCard label="Refunds" value={formatPeso(metrics.sales.refunds)} icon="↩️" accent="red" />
            <StatCard label="Items Sold" value={formatNumber(metrics.sales.itemsSold)} icon="🛍️" accent="green" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card title="Sales Performance" subtitle={range.label} className="lg:col-span-2">
              <SalesChart data={metrics.daily} />
            </Card>
            <Card title="Payment Methods">
              <Donut data={metrics.pay.map((p: PaymentBreakdown) => ({ name: p.label, value: p.sales }))} colors={['#8FAF91', '#8B6F5A', '#D5A85C']} />
              <div className="mt-3 space-y-1.5">
                {metrics.pay.map((p: PaymentBreakdown) => (
                  <div key={p.method} className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">{p.label}</span>
                    <span className="font-medium text-stone-800">{formatPercent(p.share, 0)} · {formatPeso(p.sales, { compact: true })}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <Card
          title="Transaction History"
          subtitle={`${completed.length} completed transactions`}
          action={
            <input
              className="input w-56"
              placeholder="Search order #, cashier, payment…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
        >
          <TransactionsTable
            rows={completed.filter((t) => {
              const q = search.toLowerCase();
              if (!q) return true;
              return (
                t.orderNumber.toLowerCase().includes(q) ||
                (staffByName.get(t.cashierId) ?? '').toLowerCase().includes(q) ||
                t.paymentMethod.toLowerCase().includes(q)
              );
            })}
            staffByName={staffByName}
          />
        </Card>
      )}

      {tab === 'payments' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Sales by Payment Method">
            <Donut data={metrics.pay.map((p: PaymentBreakdown) => ({ name: p.label, value: p.sales }))} colors={['#8FAF91', '#8B6F5A', '#D5A85C']} />
          </Card>
          <Card title="Payment Breakdown">
            <Table<PaymentBreakdown>
              columns={[
                { header: 'Method', key: 'label', render: (r) => <Badge variant={PAYMENT_BADGE[r.method]}>{r.label}</Badge> },
                { header: 'Sales', key: 'sales', render: (r) => formatPeso(r.sales) },
                { header: 'Share', key: 'share', render: (r) => formatPercent(r.share) },
              ]}
              rows={metrics.pay}
              rowKey={(r) => r.method}
            />
            <p className="mt-4 text-xs text-stone-500">Breakdown includes completed transactions only.</p>
          </Card>
        </div>
      )}

      {tab === 'voids' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Voided Transactions" value={formatNumber(voids.length)} icon="🚫" accent="red" />
            <StatCard label="Voided Value" value={formatPeso(voids.reduce((s, t) => s + transactionSubtotal(t), 0))} icon="🚫" accent="red" />
            <StatCard label="Refunded Transactions" value={formatNumber(refunds.length)} icon="↩️" accent="amber" />
            <StatCard label="Refunded Value" value={formatPeso(refunds.reduce((s, t) => s + transactionNet(t), 0))} icon="↩️" accent="amber" />
          </div>
          <Card title="Voided & Refunded Transactions">
            <TransactionsTable rows={[...voids, ...refunds].sort((a, b) => b.timestamp.localeCompare(a.timestamp))} staffByName={staffByName} />
          </Card>
        </div>
      )}
    </div>
  );
}

interface TxRow {
  orderNumber: string;
  timestamp: string;
  cashierName: string;
  itemsCount: number;
  paymentMethod: string;
  discount: number;
  total: number;
  status: string;
}

function TransactionsTable({ rows, staffByName }: { rows: Transaction[]; staffByName: Map<string, string> }) {
  const data: TxRow[] = rows.map((t) => ({
    orderNumber: t.orderNumber,
    timestamp: t.timestamp,
    cashierName: staffByName.get(t.cashierId) ?? '-',
    itemsCount: transactionItemsCount(t),
    paymentMethod: t.paymentMethod,
    discount: t.discount,
    total: transactionNet(t),
    status: t.status,
  }));
  const columns: Column<TxRow>[] = [
    { header: 'Order #', key: 'orderNumber', render: (r) => <span className="font-medium text-stone-800">{r.orderNumber}</span> },
    { header: 'Time', key: 'timestamp', render: (r) => formatDateTime(r.timestamp) },
    { header: 'Cashier', key: 'cashierName' },
    { header: 'Items', key: 'itemsCount' },
    { header: 'Payment', key: 'paymentMethod', render: (r) => <Badge variant={PAYMENT_BADGE[r.paymentMethod]}>{PAYMENT_LABEL[r.paymentMethod]}</Badge> },
    { header: 'Discount', key: 'discount', render: (r) => (r.discount > 0 ? `-${formatPeso(r.discount)}` : '—') },
    { header: 'Total', key: 'total', render: (r) => <span className="font-semibold">{formatPeso(r.total)}</span> },
    { header: 'Status', key: 'status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge> },
  ];
  return <Table columns={columns} rows={data} rowKey={(r) => r.orderNumber} />;
}
