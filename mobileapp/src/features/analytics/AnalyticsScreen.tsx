import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getPeakHours,
  getTopProducts,
  getTrendingProducts,
  type TopProductsSort,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import { useRangeFilter } from '../../data/RangeFilterContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import RangeFilterDropdown from '../../components/ui/RangeFilterDropdown';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import Table, { type Column } from '../../components/ui/Table';
import BarChart, { SparklineRow } from '../../components/charts/BarChart';
import Donut from '../../components/charts/Donut';
import { colors } from '../../theme';

const TABS = [
  { value: 'topselling', label: 'Top Selling' },
  { value: 'trending', label: 'Trending' },
  { value: 'peakhours', label: 'Peak Hours' },
  { value: 'categories', label: 'Categories' },
  { value: 'products', label: 'All Products' },
];

const SORTS: Array<{ value: TopProductsSort; label: string }> = [
  { value: 'sales', label: 'Best Sellers' },
  { value: 'revenue', label: 'Top Revenue' },
  { value: 'profit', label: 'Most Profitable' },
];

export default function AnalyticsScreen() {
  const { products, transactions } = useData();
  const { range } = useRangeFilter();
  const [tab, setTab] = useState('topselling');
  const [sortBy, setSortBy] = useState<TopProductsSort>('sales');
  const top = useMemo(() => getTopProducts(transactions, products, range, sortBy, 15), [transactions, products, range, sortBy]);
  const trending = useMemo(() => getTrendingProducts(transactions, products, range, 8), [transactions, products, range]);
  const peaks = useMemo(() => getPeakHours(transactions, range), [transactions, range]);
  const cat = useMemo(() => getCategoryBreakdown(transactions, products, range), [transactions, products, range]);

  const topCols: Column<(typeof top)[number]>[] = [
    { header: 'Rank', key: 'rank', width: 0.6, lines: 1, render: (r) => <Text style={styles.rank}>{top.indexOf(r) + 1}</Text> },
    { header: 'Product', key: 'name', width: 2.0, lines: 2, render: (r) => (
        <View>
          <Text style={styles.bold} numberOfLines={2}>{r.name}</Text>
          <Text style={styles.muted} numberOfLines={1}>{r.category}</Text>
        </View>
      ) },
    { header: 'Sold', key: 'sold', width: 0.9, lines: 1 },
    { header: 'Revenue', key: 'revenue', width: 1.2, lines: 1, render: (r) => formatPeso(r.revenue) },
    { header: 'Profit', key: 'profit', width: 1.2, lines: 1, render: (r) => <Text style={{ color: colors.good, fontWeight: '700' }}>{formatPeso(r.profit)}</Text> },
  ];

  const peaksTop = [...peaks].sort((a, b) => b.sales - a.sales).slice(0, 4);

  return (
    <Screen
      title="Analytics"
      subtitle={`Performance insights · ${range.label.toLowerCase()}`}
      sticky={
        <>
          <RangeFilterDropdown />
          <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
        </>
      }
    >
      {tab === 'topselling' && (
        <Card title={SORTS.find((s) => s.value === sortBy)?.label} subtitle="Toggle ranking">
          <View style={styles.sortRow}>
            {SORTS.map((s) => (
              <Badge key={s.value} variant={sortBy === s.value ? 'brand' : 'slate'}>
                <Text onPress={() => setSortBy(s.value)}>{s.label}</Text>
              </Badge>
            ))}
          </View>
          <Table columns={topCols} rows={top} rowKey={(r) => r.productId} />
        </Card>
      )}

      {tab === 'trending' && (
        <Card title="🔥 Trending" subtitle="Sales growth vs previous period">
          {trending.map((t) => (
            <SparklineRow
              key={t.productId}
              label={t.name}
              value={`${t.currentSales} sold`}
              pct={`${t.changePercent >= 0 ? '+' : ''}${Math.round(t.changePercent * 100)}%`}
              color={t.changePercent >= 0 ? colors.good : colors.critical}
            />
          ))}
        </Card>
      )}

      {tab === 'peakhours' && (
        <>
          <Card title="Peak Sales Hours" subtitle="Revenue by hour">
            <BarChart data={peaks.map((p) => ({ label: p.label, value: p.sales }))} />
          </Card>
          <Card title="Top Peaks">
            {peaksTop.map((p, i) => (
              <SparklineRow key={p.hour} label={`#${i + 1} · ${p.label}`} value={formatPeso(p.sales, { compact: true })} pct={`${p.transactions} orders`} color={colors.brand} />
            ))}
          </Card>
        </>
      )}

      {tab === 'categories' && (
        <Card title="Sales by Category">
          <View style={styles.center}>
            <Donut data={cat.map((c) => ({ name: c.category, value: c.sales }))} centerLabel="Cat" />
          </View>
          {cat.map((c) => (
            <SparklineRow key={c.category} label={c.category} value={formatPercent(c.share, 0)} pct={formatPeso(c.sales, { compact: true })} color={colors.brand} />
          ))}
        </Card>
      )}

      {tab === 'products' && (
        <Card title="All Products" subtitle={`Ranked by units sold · ${range.label}`}>
          <Table columns={topCols} rows={top} rowKey={(r) => r.productId} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rank: { fontSize: 13, fontWeight: '800', color: colors.onCardSub },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  sortRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  center: { alignItems: 'center' },
});
