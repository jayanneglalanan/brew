import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  expenses,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getDailySalesShort,
  getDateRange,
  getPaymentBreakdown,
  getProfitSummary,
  getSalesByRange,
  staff,
  transactionItemsCount,
  transactionNet,
  transactionSubtotal,
  type RangeFilter,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import Table, { type Column } from '../../components/ui/Table';
import BarChart from '../../components/charts/BarChart';
import Donut from '../../components/charts/Donut';
import { colors, gap } from '../../theme';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'payments', label: 'Payments' },
  { value: 'voids', label: 'Voids & Refunds' },
];

const FILTERS: Array<{ value: RangeFilter; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

const PAYMENT_LABEL: Record<string, string> = { cash: 'Cash', gcash: 'GCash', card: 'Card' };
const PAYMENT_VARIANT: Record<string, string> = { cash: 'good', gcash: 'blue', card: 'low' };

export default function SalesScreen() {
  const { products, transactions } = useData();
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState<RangeFilter>('today');
  const [search, setSearch] = useState('');
  const range = getDateRange(filter);

  const metrics = useMemo(() => ({
    sales: getSalesByRange(transactions, range),
    profit: getProfitSummary(transactions, products, expenses, range),
    cat: getCategoryBreakdown(transactions, products, range),
    pay: getPaymentBreakdown(transactions, range),
    daily: getDailySalesShort(transactions, range),
  }), [range, products, transactions]);

  const staffName = useMemo(() => new Map(staff.map((s) => [s.id, s.name])), []);
  const inRange = (t: (typeof transactions)[number]) => {
    const ts = new Date(t.timestamp).getTime();
    return ts >= range.start.getTime() && ts <= range.end.getTime();
  };
  const completed = useMemo(() => transactions.filter((t) => t.status === 'completed' && inRange(t)), [range]);
  const voids = useMemo(() => transactions.filter((t) => t.status === 'voided' && inRange(t)), [range]);
  const refunds = useMemo(() => transactions.filter((t) => t.status === 'refunded' && inRange(t)), [range]);

  const txColumns: Column<(typeof completed)[number]>[] = [
    { header: 'Order', key: 'orderNumber', width: 1.1, lines: 2, render: (r) => <Text style={styles.bold}>{r.orderNumber}</Text> },
    { header: 'Time', key: 'time', width: 1.4, lines: 2, render: (r) => <Text style={styles.muted}>{formatDateTime(r.timestamp)}</Text> },
    { header: 'Cashier', key: 'cashier', width: 1.1, lines: 2, render: (r) => staffName.get(r.cashierId) ?? '-' },
    { header: 'Items', key: 'items', width: 0.7, lines: 1, render: (r) => transactionItemsCount(r) },
    { header: 'Pay', key: 'pay', width: 0.9, lines: 1, render: (r) => <Badge variant={PAYMENT_VARIANT[r.paymentMethod]}>{PAYMENT_LABEL[r.paymentMethod]}</Badge> },
    { header: 'Total', key: 'total', width: 1.0, lines: 1, render: (r) => <Text style={styles.bold}>{formatPeso(transactionNet(r))}</Text> },
    { header: 'Status', key: 'status', width: 1.0, lines: 1, render: (r) => <Badge variant={r.status === 'completed' ? 'good' : r.status === 'voided' ? 'low' : 'critical'}>{r.status}</Badge> },
  ];

  return (
    <Screen
      title="Sales"
      subtitle={range.label}
      sticky={
        <>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <Badge key={f.value} variant={filter === f.value ? 'brand' : 'slate'}>
                <Text onPress={() => setFilter(f.value)}>{f.label}</Text>
              </Badge>
            ))}
          </View>
          <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
        </>
      }
    >
      {tab === 'overview' && (
        <>
          <View style={styles.grid}>
            <StatCard label="Gross Sales" value={formatPeso(metrics.sales.grossSales)} icon="💵" style={styles.half} />
            <StatCard label="Net Sales" value={formatPeso(metrics.sales.netSales)} icon="💰" style={styles.half} />
            <StatCard label="Transactions" value={formatNumber(metrics.sales.transactions)} icon="🧾" accent="blue" style={styles.half} />
            <StatCard label="Avg Order" value={formatPeso(metrics.sales.averageOrderValue)} icon="📏" accent="slate" style={styles.half} />
            <StatCard label="Discounts" value={formatPeso(metrics.sales.discounts)} icon="🏷️" accent="amber" style={styles.half} />
            <StatCard label="Voids + Refunds" value={formatPeso(metrics.sales.voidedSales + metrics.sales.refunds)} icon="🚫" accent="red" style={styles.half} />
          </View>
          <Card title="Sales Performance" subtitle={range.label}>
            <BarChart data={metrics.daily.map((d) => ({ label: d.label, value: d.sales }))} />
          </Card>
          <Card title="Sales by Category" subtitle="Share of revenue">
            <View style={styles.center}>
              <Donut data={metrics.cat.map((c) => ({ name: c.category, value: c.sales }))} centerLabel="Cat" />
            </View>
            {metrics.cat.map((c) => (
              <Row key={c.category} label={c.category} value={`${formatPercent(c.share, 0)} · ${formatPeso(c.sales, { compact: true })}`} />
            ))}
          </Card>
        </>
      )}

      {tab === 'transactions' && (
        <Card title="Transaction History" subtitle={`${completed.length} completed`}>
          <TextInput style={styles.search} placeholder="Search order, cashier, payment…" placeholderTextColor={colors.sub} value={search} onChangeText={setSearch} />
          <Table
            columns={txColumns}
            rows={completed.filter((t) => {
              const q = search.toLowerCase();
              if (!q) return true;
              return (
                t.orderNumber.toLowerCase().includes(q) ||
                (staffName.get(t.cashierId) ?? '').toLowerCase().includes(q) ||
                t.paymentMethod.toLowerCase().includes(q)
              );
            })}
            rowKey={(r) => r.id}
          />
        </Card>
      )}

      {tab === 'payments' && (
        <Card title="Payment Methods">
          <View style={styles.center}>
            <Donut data={metrics.pay.map((p) => ({ name: p.label, value: p.sales }))} centerLabel="Pay" colors={['#9CC0A0', '#8B6F5A', '#E3C285']} />
          </View>
          {metrics.pay.map((p) => (
            <Row key={p.method} label={p.label} value={`${formatPercent(p.share, 0)} · ${formatPeso(p.sales)}`} />
          ))}
        </Card>
      )}

      {tab === 'voids' && (
        <>
          <View style={styles.grid}>
            <StatCard label="Voided" value={formatNumber(voids.length)} icon="🚫" accent="red" style={styles.half} />
            <StatCard label="Voided Value" value={formatPeso(voids.reduce((s, t) => s + transactionSubtotal(t), 0))} icon="🚫" accent="red" style={styles.half} />
            <StatCard label="Refunds" value={formatNumber(refunds.length)} icon="↩️" accent="amber" style={styles.half} />
            <StatCard label="Refund Value" value={formatPeso(refunds.reduce((s, t) => s + transactionNet(t), 0))} icon="↩️" accent="amber" style={styles.half} />
          </View>
          <Card title="Voided & Refunded">
            <Table columns={txColumns} rows={[...voids, ...refunds].sort((a, b) => b.timestamp.localeCompare(a.timestamp))} rowKey={(r) => r.id} />
          </Card>
        </>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '48%' },
  center: { alignItems: 'center' },
  filterRow: { flexDirection: 'row', gap: gap.xs, marginBottom: gap.md },
  search: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: colors.onCardSub, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
});
