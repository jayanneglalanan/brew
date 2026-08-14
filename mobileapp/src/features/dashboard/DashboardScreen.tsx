import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  DAY_MS,
  expenses,
  formatNumber,
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getDailySales,
  getExceptions,
  getInventorySummary,
  getPaymentBreakdown,
  getProfitSummary,
  getSalesByRange,
  getTopProducts,
  getTrendingProducts,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import BarChart, { SparklineRow } from '../../components/charts/BarChart';
import Donut from '../../components/charts/Donut';
import { colors, gap } from '../../theme';

export default function DashboardScreen() {
  const { products, inventory, stockMovements, transactions } = useData();
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => ({ start: (() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; })(), end: now, label: 'Today' }), [now]);
  const week = useMemo(() => ({ start: new Date(now.getTime() - 6 * DAY_MS), end: now, label: 'Last 7 days' }), [now]);

  const sales = useMemo(() => getSalesByRange(transactions, today), [transactions, today]);
  const profit = useMemo(() => getProfitSummary(transactions, products, expenses, today), [transactions, products, today]);
  const top = useMemo(() => getTopProducts(transactions, products, today, 'sales', 5), [transactions, products, today]);
  const trending = useMemo(() => getTrendingProducts(transactions, products, today, 5), [transactions, products, today]);
  const inv = useMemo(() => getInventorySummary(inventory), [inventory]);
  const cat = useMemo(() => getCategoryBreakdown(transactions, products, today), [transactions, products, today]);
  const pay = useMemo(() => getPaymentBreakdown(transactions, today), [transactions, today]);
  const exceptions = useMemo(() => getExceptions(transactions, inventory, stockMovements, today), [transactions, inventory, stockMovements, today]);
  const daily = useMemo(() => getDailySales(transactions, products, week), [transactions, products, week]);

  return (
    <Screen title="Dashboard" subtitle="How is the coffee shop doing today?">
      <View style={styles.grid}>
        <StatCard label="Net Sales" value={formatPeso(sales.netSales)} icon="💰" style={styles.half} />
        <StatCard label="Net Profit" value={formatPeso(profit.netProfit)} icon="📈" accent="green" style={styles.half} />
        <StatCard label="Transactions" value={formatNumber(sales.transactions)} icon="🧾" accent="blue" style={styles.half} />
        <StatCard label="Margin" value={formatPercent(profit.netMargin)} icon="📊" accent="amber" style={styles.half} />
      </View>

      <Card title="Sales Overview" subtitle="Last 7 days net sales">
        <BarChart data={daily.map((d) => ({ label: d.label, value: d.sales }))} />
      </Card>

      <View style={styles.grid}>
        <Card title="Top Products" subtitle="Today" style={styles.half}>
          {top.map((p, i) => (
            <View key={p.productId} style={styles.row}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Text style={styles.rowLabel} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.rowValue}>{formatPeso(p.revenue, { compact: true })}</Text>
            </View>
          ))}
        </Card>
        <Card title="Inventory" subtitle={`${inv.low} low · ${inv.critical} critical`} style={styles.half}>
          <View style={styles.invRow}>
            <Badge variant="good">🟢 {inv.healthy}</Badge>
            <Badge variant="low">🟡 {inv.low}</Badge>
            <Badge variant="critical">🔴 {inv.critical}</Badge>
          </View>
          {inv.lowItems.slice(0, 4).map((it) => (
            <Text key={it.item} style={[styles.rowLabel, { marginTop: gap.sm }]}>
              {it.item} · <Text style={{ color: it.level === 'critical' ? colors.critical : colors.low, fontWeight: '700' }}>{it.current} {it.unit}</Text>
            </Text>
          ))}
        </Card>
      </View>

      <Card title="Category vs Payment Share" subtitle="Today">
        <View style={styles.grid}>
          <View style={[styles.half, styles.center]}>
            <Donut data={cat.map((c) => ({ name: c.category, value: c.sales }))} centerLabel="Cat" />
            {cat.slice(0, 3).map((c) => (
              <SparklineRow key={c.category} label={c.category} value={formatPercent(c.share, 0)} pct="" />
            ))}
          </View>
          <View style={[styles.half, styles.center]}>
            <Donut data={pay.map((p) => ({ name: p.label, value: p.sales }))} centerLabel="Pay" colors={['#9CC0A0', '#8B6F5A', '#E3C285']} />
            {pay.map((p) => (
              <SparklineRow key={p.method} label={p.label} value={formatPercent(p.share, 0)} pct="" />
            ))}
          </View>
        </View>
      </Card>

      <Card title="🔥 Trending" subtitle="vs previous period">
        {trending.map((t) => (
          <SparklineRow
            key={t.productId}
            label={t.name}
            value={t.currentSales + ' sold'}
            pct={`${t.changePercent >= 0 ? '+' : ''}${Math.round(t.changePercent * 100)}%`}
            color={t.changePercent >= 0 ? colors.good : colors.critical}
          />
        ))}
      </Card>

      <Card title="⚠ Exceptions" subtitle="Needs attention">
        {exceptions.slice(0, 6).map((e) => (
          <View key={e.id} style={styles.row}>
            <Badge variant={e.severity === 'critical' ? 'critical' : e.severity === 'warning' ? 'low' : 'blue'}>
              {e.severity === 'critical' ? 'CRIT' : e.severity === 'warning' ? 'WARN' : 'INFO'}
            </Badge>
            <View style={{ flex: 1, marginLeft: gap.sm }}>
              <Text style={styles.rowLabel}>{e.title}</Text>
              <Text style={styles.rowSub}>{e.detail}</Text>
            </View>
          </View>
        ))}
        {exceptions.length === 0 && <Text style={styles.rowSub}>No exceptions 🎉</Text>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '48%' },
  center: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: gap.sm },
  rank: { width: 18, fontSize: 12, fontWeight: '800', color: colors.onCardSub },
  rowLabel: { fontSize: 13, fontWeight: '600', color: colors.onCard, flex: 1 },
  rowSub: { fontSize: 11, color: colors.onCardSub },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.onCard, marginLeft: gap.sm },
  invRow: { flexDirection: 'row', gap: gap.xs, flexWrap: 'wrap' },
});
