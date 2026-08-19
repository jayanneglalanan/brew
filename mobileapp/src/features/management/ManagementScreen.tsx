import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  formatDateTime,
  formatPeso,
  getDateRange,
  getStaffPerformance,
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
  { value: 'staff', label: 'Staff' },
  { value: 'audit', label: 'Audit Logs' },
];

const ACTION_LABEL: Record<string, string> = {
  'transaction.completed': 'completed transaction',
  'transaction.voided': 'voided transaction',
  'transaction.refunded': 'refunded transaction',
  'inventory.adjustment': 'adjusted inventory',
  'inventory.created': 'created stock item',
  'inventory.updated': 'updated stock item',
  'inventory.deleted': 'deleted stock item',
  'discount.applied': 'applied discount',
  'product.created': 'created product',
  'product.updated': 'updated product',
  'product.deleted': 'deleted product',
  'staff.login': 'logged in',
};

const ACTION_VARIANT: Record<string, string> = {
  'transaction.completed': 'good', 'transaction.voided': 'low', 'transaction.refunded': 'critical',
  'inventory.adjustment': 'blue', 'inventory.created': 'good', 'inventory.updated': 'blue', 'inventory.deleted': 'critical',
  'discount.applied': 'slate', 'product.created': 'good', 'product.updated': 'blue', 'product.deleted': 'critical', 'staff.login': 'slate',
};

export default function ManagementScreen() {
  const { transactions, auditLogs } = useData();
  const [tab, setTab] = useState('staff');
  const range = useMemo(() => getDateRange('week'), []);
  const perf = useMemo(() => getStaffPerformance(transactions, staff, range), [transactions, range]);
  const nameById = useMemo(() => new Map(staff.map((s) => [s.id, s.name])), []);
  const logs = useMemo(() => [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 40), [auditLogs]);

  const staffCols: Column<(typeof perf)[number]>[] = [
    { header: 'Name', key: 'name', width: 1.5, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{r.name}</Text> },
    { header: 'Role', key: 'role', width: 1.0, lines: 1, render: (r) => <Badge variant={r.role === 'cashier' ? 'slate' : 'brand'}>{r.role}</Badge> },
    { header: 'Transactions', key: 'transactions', width: 1.0, lines: 1 },
    { header: 'Sales', key: 'sales', width: 1.2, lines: 1, render: (r) => formatPeso(r.sales) },
    { header: 'Voids', key: 'voids', width: 0.9, lines: 1, render: (r) => <Text style={{ color: r.voids > 0 ? colors.critical : colors.sub }}>{r.voids}</Text> },
    { header: 'Discounts', key: 'discounts', width: 1.1, lines: 1, render: (r) => formatPeso(r.discounts) },
  ];

  const logCols: Column<(typeof logs)[number]>[] = [
    { header: 'Time', key: 'timestamp', width: 1.4, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{formatDateTime(r.timestamp)}</Text> },
    { header: 'Actor', key: 'actor', width: 1.1, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]} numberOfLines={2}>{nameById.get(r.actorId) ?? r.actorId}</Text> },
    { header: 'Action', key: 'action', width: 1.3, lines: 1, render: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? 'slate'}>{ACTION_LABEL[r.action] ?? r.action}</Badge> },
    { header: 'Target', key: 'target', width: 1.5, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{r.target}</Text> },
    { header: 'Detail', key: 'detail', width: 1.5, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{r.detail ?? '—'}</Text> },
  ];

  return (
    <Screen
      title="Management"
      subtitle="Staff and audit trail"
      sticky={<SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />}
    >
      {tab === 'staff' && (
        <>
          <Card title="Team">
            {staff.map((s) => (
              <View key={s.id} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: s.avatarColor }]}>
                  <Text style={styles.avatarText}>{s.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bold}>{s.name}</Text>
                  <Text style={styles.muted}>{s.role}</Text>
                </View>
                <Badge variant="slate">PIN ••••</Badge>
              </View>
            ))}
          </Card>
          <Card title="Staff Performance" subtitle={range.label}>
            <Table columns={staffCols} rows={perf} rowKey={(r) => r.staffId} />
          </Card>
        </>
      )}

      {tab === 'audit' && (
        <Card title="Audit Logs" subtitle="Immutable trail of events">
          <Table columns={logCols} rows={logs} rowKey={(r) => r.id} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: gap.sm },
  center: { textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
});
