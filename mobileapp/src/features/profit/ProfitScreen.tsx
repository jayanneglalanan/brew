import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  formatPercent,
  formatPeso,
  getDateRange,
  getProfitSummary,
  expenses,
  type RangeFilter,
  type ExpenseCategory,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { colors, gap } from '../../theme';

const CATEGORY_LABEL: Record<string, string> = {
  rent: 'Rent', utilities: 'Utilities', supplies: 'Supplies', payroll: 'Payroll',
  maintenance: 'Maintenance', marketing: 'Marketing', other: 'Other',
};

export default function ProfitScreen() {
  const { products, transactions } = useData();
  const [filter, setFilter] = useState<RangeFilter>('month');
  const range = getDateRange(filter);
  const profit = useMemo(() => getProfitSummary(transactions, products, expenses, range), [transactions, products, range]);

  const expByCat = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      const ts = new Date(e.timestamp).getTime();
      if (ts >= range.start.getTime() && ts <= range.end.getTime()) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return map;
  }, [range]);

  const expenseRows = expenses.filter((e) => {
    const ts = new Date(e.timestamp).getTime();
    return ts >= range.start.getTime() && ts <= range.end.getTime();
  });

  return (
    <Screen
      title="Profit & Expenses"
      subtitle={range.label}
      sticky={
        <View style={styles.filterRow}>
          {(['week', 'month', 'all'] as RangeFilter[]).map((f) => (
            <Badge key={f} variant={filter === f ? 'brand' : 'slate'}>
              <Text onPress={() => setFilter(f)}>{f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}</Text>
            </Badge>
          ))}
        </View>
      }
    >
      <View style={styles.grid}>
        <StatCard label="Revenue" value={formatPeso(profit.revenue)} icon="💰" style={styles.half} />
        <StatCard label="Gross Profit" value={formatPeso(profit.grossProfit)} icon="📈" accent="green" style={styles.half} />
        <StatCard label="Op Expenses" value={formatPeso(profit.operatingExpenses)} icon="🧾" accent="amber" style={styles.half} />
        <StatCard label="Net Profit" value={formatPeso(profit.netProfit)} icon="💵" style={styles.half} />
      </View>

      <Card title="Income Statement">
        <Line label="Revenue" value={profit.revenue} />
        <Line label="Cost of Goods Sold" value={profit.cogs} />
        <View style={styles.divider} />
        <Line label="Gross Profit" value={profit.grossProfit} bold sub={`Gross margin ${formatPercent(profit.grossMargin)}`} />
        <View style={styles.divider} />
        <Line label="Operating Expenses" value={profit.operatingExpenses} />
        <View style={styles.highlight}>
          <Line label="Net Profit" value={profit.netProfit} bold sub={`Net margin ${formatPercent(profit.netMargin)}`} />
        </View>
      </Card>

      <Card title="Expenses by Category">
        {[...expByCat.entries()].map(([cat, amount]) => (
          <View key={cat} style={styles.row}>
            <Text style={styles.bold}>{CATEGORY_LABEL[cat] ?? cat}</Text>
            <Text style={styles.muted}>{formatPercent(profit.operatingExpenses ? amount / profit.operatingExpenses : 0, 0)} of opex</Text>
            <Text style={styles.bold}>{formatPeso(amount)}</Text>
          </View>
        ))}
      </Card>

      <Card title="Expense Details">
        {expenseRows.map((e) => (
          <View key={e.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bold}>{e.name}</Text>
              <Text style={styles.muted}>{CATEGORY_LABEL[e.category] ?? e.category}</Text>
            </View>
            <Text style={styles.bold}>{formatPeso(e.amount)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function Line({ label, value, bold, sub }: { label: string; value: number; bold?: boolean; sub?: string }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={bold ? styles.bold : styles.lineLabel}>{label}</Text>
        {sub ? <Text style={[styles.muted, { color: colors.goodOn }]}>{sub}</Text> : null}
      </View>
      <Text style={[styles.bold, bold && { color: colors.goodOn }]}>{formatPeso(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '48%' },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: gap.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: gap.sm },
  lineLabel: { fontSize: 14, color: colors.onCardSub },
  divider: { borderTopWidth: 1, borderTopColor: colors.line, marginVertical: gap.xs },
  highlight: { backgroundColor: colors.goodSoft, borderRadius: 12, padding: gap.md, marginTop: gap.sm },
  bold: { fontSize: 14, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
});
