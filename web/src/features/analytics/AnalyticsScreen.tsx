import { useMemo, useState } from 'react';
import {
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getDateRange,
  getPeakHours,
  getTopProducts,
  getTrendingProducts,
  type TopProductsSort,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import Card from '@/components/ui/Card';
import Dropdown from '@/components/ui/Dropdown';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';
import { Donut, PeakBar, ProgressBar } from '@/components/charts';

const TABS = [
  { value: 'topselling', label: 'Top Selling' },
  { value: 'trending', label: 'Trending' },
  { value: 'peakhours', label: 'Peak Hours' },
  { value: 'categories', label: 'Category Performance' },
  { value: 'products', label: 'Product Performance' },
];

const SORT_OPTIONS: Array<{ value: TopProductsSort; label: string }> = [
  { value: 'sales', label: 'Best Sellers' },
  { value: 'revenue', label: 'Highest Revenue' },
  { value: 'profit', label: 'Most Profitable' },
];

export default function AnalyticsScreen() {
  const { products, transactions } = useData();
  const [tab, setTab] = useState('topselling');
  const [sortBy, setSortBy] = useState<TopProductsSort>('sales');
  const range = useMemo(() => getDateRange('month'), []);

  const top = useMemo(() => getTopProducts(transactions, products, range, sortBy, 15), [sortBy, range, transactions, products]);
  const trending = useMemo(() => getTrendingProducts(transactions, products, range, 8), [range, transactions, products]);
  const peaks = useMemo(() => getPeakHours(transactions, range), [range, transactions]);
  const cat = useMemo(() => getCategoryBreakdown(transactions, products, range), [range, transactions, products]);
  const all = useMemo(() => getTopProducts(transactions, products, range, 'sales', 100), [range, transactions, products]);

  const topColumns: Column<(typeof top)[number]>[] = [
    { header: 'Rank', key: 'rank', render: (_r, i) => <b className="text-stone-500">{i + 1}</b> },
    { header: 'Product', key: 'name', render: (r) => (
        <div>
          <span className="font-medium text-stone-800">{r.name}</span>
          <span className="ml-2 text-xs text-stone-500">{r.category}</span>
        </div>
      ) },
    { header: 'Sold', key: 'sold' },
    { header: 'Revenue', key: 'revenue', render: (r) => formatPeso(r.revenue) },
    { header: 'Profit', key: 'profit', render: (r) => <span className="font-medium text-emerald-600">{formatPeso(r.profit)}</span> },
    { header: 'Avg Margin', key: 'margin', render: (r) => formatPercent(r.profit / r.revenue) },
  ];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance insights for the current month" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'topselling' && (
          <Dropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} className="w-48" />
        )}
      </div>

      {tab === 'topselling' && (
        <Card title={`Top Products · ${SORT_OPTIONS.find((s) => s.value === sortBy)?.label}`} subtitle={range.label}>
          <Table columns={topColumns} rows={top} rowKey={(r) => r.productId} />
        </Card>
      )}

      {tab === 'trending' && (
        <Card title="🔥 Trending Products" subtitle="Sales growth vs the previous period">
          <div className="space-y-5">
            {trending.map((t, i) => {
              const growth = Math.abs(t.changePercent) * 100;
              return (
                <div key={t.productId} className="flex items-center gap-4">
                  <span className="w-6 text-sm font-bold text-stone-500">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-stone-800">{t.name}</span>
                      <span className={t.changePercent >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                        {t.changePercent >= 0 ? '+' : ''}{Math.round(growth)}%
                      </span>
                    </div>
                    <ProgressBar value={Math.min(100, growth)} color={t.changePercent >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} />
                    <p className="mt-1 text-xs text-stone-500">
                      {t.currentSales} sold this period vs {t.previousSales} before
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'peakhours' && (
        <Card title="Peak Sales Hours" subtitle={`Busiest hours by revenue · ${range.label}`}>
          <PeakBar data={peaks.map((p) => ({ label: p.label, sales: p.sales }))} />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...peaks].sort((a, b) => b.sales - a.sales).slice(0, 4).map((p, i) => (
              <div key={p.hour} className="rounded-lg bg-brand-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">#{i + 1} Peak</p>
                <p className="mt-0.5 text-sm font-bold text-stone-800">{p.label}</p>
                <p className="text-xs text-stone-500">{formatPeso(p.sales, { compact: true })} · {p.transactions} orders</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'categories' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Sales by Category">
            <Donut data={cat.map((c) => ({ name: c.category, value: c.sales }))} />
          </Card>
          <Card title="Category Performance">
            <div className="space-y-4">
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
      )}

      {tab === 'products' && (
        <Card title="Product Performance" subtitle="Every product ranked by units sold this month">
          <Table columns={topColumns} rows={all} rowKey={(r) => r.productId} />
        </Card>
      )}
    </div>
  );
}
