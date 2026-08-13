import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { useData } from '../../data/DataContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import Table, { type Column } from '../../components/ui/Table';
import { colors, gap } from '../../theme';

const TABS = [
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'profit', label: 'Profit' },
  { value: 'staff', label: 'Staff' },
];

export default function ReportsScreen() {
  const { products, inventory, transactions } = useData();
  const [tab, setTab] = useState('sales');
  const week = useMemo(() => getDateRange('week'), []);
  const month = useMemo(() => getDateRange('month'), []);
  const today = useMemo(() => getDateRange('today'), []);

  const periodRows = useMemo(
    () =>
      ([
        ['Today', today],
        ['This Week', week],
        ['This Month', month],
      ] as Array<[string, ReturnType<typeof getDateRange>]>).map(([label, r]) => {
        const s = getSalesByRange(transactions, r);
        const p = getProfitSummary(transactions, products, expenses, r);
        return { label, sales: s.netSales, tx: s.transactions, profit: p.netProfit };
      }),
    [today, week, month, transactions, products],
  );
  const daily = useMemo(() => getDailySalesShort(transactions, month), [transactions, month]);
  const inv = useMemo(() => getInventorySummary(inventory), [inventory]);
  const stockRows = useMemo(() => getStockStatusRows(inventory), [inventory]);
  const profit = useMemo(() => getProfitSummary(transactions, products, expenses, month), [transactions, products, month]);
  const staffRows = useMemo(() => getStaffPerformance(transactions, staff, month), [transactions, month]);

  const periodCols: Column<(typeof periodRows)[number]>[] = [
    { header: 'Period', key: 'label', render: (r) => <Text style={styles.bold}>{r.label}</Text> },
    { header: 'Net Sales', key: 'sales', align: 'right', render: (r) => formatPeso(r.sales) },
    { header: 'Tx', key: 'tx', align: 'right' },
    { header: 'Profit', key: 'profit', align: 'right', render: (r) => <Text style={{ color: colors.goodOn, fontWeight: '700' }}>{formatPeso(r.profit)}</Text> },
  ];
  const dailyCols: Column<(typeof daily)[number]>[] = [
    { header: 'Date', key: 'label' },
    { header: 'Sales', key: 'sales', align: 'right', render: (r) => formatPeso(r.sales) },
    { header: 'Tx', key: 'transactions', align: 'right' },
  ];
  const stockCols: Column<(typeof stockRows)[number]>[] = [
    { header: 'Item', key: 'name', render: (r) => <Text style={styles.bold}>{r.name}</Text> },
    { header: 'Stock', key: 'current', align: 'right', render: (r) => `${r.current} ${r.unit}` },
    { header: 'Status', key: 'status', render: (r) => <Badge variant={r.status}>{r.status}</Badge> },
  ];
  const staffCols: Column<(typeof staffRows)[number]>[] = [
    { header: 'Staff', key: 'name', render: (r) => <Text style={styles.bold}>{r.name}</Text> },
    { header: 'Tx', key: 'transactions', align: 'right' },
    { header: 'Sales', key: 'sales', align: 'right', render: (r) => formatPeso(r.sales) },
    { header: 'Voids', key: 'voids', align: 'right', render: (r) => <Text style={{ color: r.voids > 0 ? colors.criticalOn : colors.onCardSub }}>{r.voids}</Text> },
  ];

  return (
    <Screen
      title="Reports"
      subtitle="Consolidated business reports"
      sticky={<SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />}
    >
      {tab === 'sales' && (
        <>
          <Card title="Sales Summary" subtitle="Across periods">
            <Table columns={periodCols} rows={periodRows} rowKey={(r) => r.label} />
          </Card>
          <Card title="Daily Sales" subtitle="This month">
            <Table columns={dailyCols} rows={daily} rowKey={(r) => r.label} />
          </Card>
        </>
      )}

      {tab === 'inventory' && (
        <>
          <View style={styles.grid}>
            <Mini label="Items" value={formatNumber(inv.total)} />
            <Mini label="Healthy" value={formatNumber(inv.healthy)} tone={colors.goodOn} />
            <Mini label="Low" value={formatNumber(inv.low)} tone={colors.lowOn} />
            <Mini label="Critical" value={formatNumber(inv.critical)} tone={colors.criticalOn} />
          </View>
          <Card title="Current Inventory">
            <Table columns={stockCols} rows={stockRows} rowKey={(r) => r.itemId} />
          </Card>
        </>
      )}

      {tab === 'profit' && (
        <Card title="Profit Report" subtitle={month.label}>
          <Line label="Revenue" value={profit.revenue} />
          <Line label="COGS" value={profit.cogs} />
          <Line label="Gross Profit" value={profit.grossProfit} sub={`Gross margin ${formatPercent(profit.grossMargin)}`} />
          <Line label="Operating Expenses" value={profit.operatingExpenses} />
          <View style={styles.divider} />
          <Line label="Net Profit" value={profit.netProfit} bold sub={`Net margin ${formatPercent(profit.netMargin)}`} />
        </Card>
      )}

      {tab === 'staff' && (
        <Card title="Staff Performance" subtitle={month.label}>
          <Table columns={staffCols} rows={staffRows} rowKey={(r) => r.staffId} />
        </Card>
      )}
    </Screen>
  );
}

function Mini({ label, value, tone = colors.ink }: { label: string; value: string; tone?: string }) {
  return (
    <View style={[styles.mini, { width: '48%' }]}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={[styles.miniValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function Line({ label, value, bold, sub }: { label: string; value: number; bold?: boolean; sub?: string }) {
  return (
    <View style={styles.line}>
      <View style={{ flex: 1 }}>
        <Text style={bold ? styles.bold : styles.lineLabel}>{label}</Text>
        {sub ? <Text style={[styles.muted, { color: colors.goodOn }]}>{sub}</Text> : null}
      </View>
      <Text style={[styles.bold, bold && { color: colors.goodOn }]}>{formatPeso(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: gap.md },
  mini: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: gap.lg, alignItems: 'center', marginBottom: gap.md },
  miniLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', color: colors.sub },
  miniValue: { marginTop: 4, fontSize: 22, fontWeight: '800' },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  lineLabel: { fontSize: 14, color: colors.onCardSub },
  divider: { borderTopWidth: 1, borderTopColor: 'rgba(253,246,236,0.12)', marginVertical: gap.sm },
  bold: { fontSize: 14, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 11 },
});
