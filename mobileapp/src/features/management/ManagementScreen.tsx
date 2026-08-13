import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
  { value: 'settings', label: 'Settings' },
];

const ACTION_LABEL: Record<string, string> = {
  'transaction.completed': 'completed transaction',
  'transaction.voided': 'voided transaction',
  'transaction.refunded': 'refunded transaction',
  'inventory.adjustment': 'adjusted inventory',
  'discount.applied': 'applied discount',
  'product.created': 'created product',
  'product.updated': 'updated product',
  'staff.login': 'logged in',
};

const ACTION_VARIANT: Record<string, string> = {
  'transaction.completed': 'good', 'transaction.voided': 'low', 'transaction.refunded': 'critical',
  'inventory.adjustment': 'blue', 'discount.applied': 'slate', 'product.created': 'good', 'product.updated': 'blue', 'staff.login': 'slate',
};

export default function ManagementScreen() {
  const { transactions, auditLogs, resetData } = useData();
  const [tab, setTab] = useState('staff');
  const range = useMemo(() => getDateRange('week'), []);
  const perf = useMemo(() => getStaffPerformance(transactions, staff, range), [transactions, range]);
  const nameById = useMemo(() => new Map(staff.map((s) => [s.id, s.name])), []);
  const logs = useMemo(() => [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 40), [auditLogs]);

  const staffCols: Column<(typeof perf)[number]>[] = [
    { header: 'Staff', key: 'name', render: (r) => <Text style={styles.bold}>{r.name}</Text> },
    { header: 'Role', key: 'role', render: (r) => <Badge variant={r.role === 'cashier' ? 'slate' : 'brand'}>{r.role}</Badge> },
    { header: 'Tx', key: 'transactions', align: 'right' },
    { header: 'Sales', key: 'sales', align: 'right', render: (r) => formatPeso(r.sales) },
    { header: 'Voids', key: 'voids', align: 'right', render: (r) => <Text style={{ color: r.voids > 0 ? colors.criticalOn : colors.onCardSub }}>{r.voids}</Text> },
  ];

  const logCols: Column<(typeof logs)[number]>[] = [
    { header: 'Time', key: 'timestamp', render: (r) => <Text style={styles.muted}>{formatDateTime(r.timestamp)}</Text> },
    { header: 'Actor', key: 'actor', render: (r) => <Text style={styles.bold}>{nameById.get(r.actorId) ?? r.actorId}</Text> },
    { header: 'Action', key: 'action', render: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? 'slate'}>{ACTION_LABEL[r.action] ?? r.action}</Badge> },
    { header: 'Target', key: 'target', render: (r) => <Text style={styles.muted}>{r.target}</Text> },
  ];

  return (
    <Screen
      title="Management"
      subtitle="Staff, audit trail and settings"
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

      {tab === 'settings' && (
        <>
          <Card title="Shop Profile">
            <Setting label="Shop Name" value="KapeFlow Coffee" />
            <Setting label="Currency" value="₱ Philippine Peso" />
            <Setting label="Business Hours" value="7:00 AM – 9:00 PM" />
          </Card>
          <Card title="Alert Thresholds">
            <Setting label="Low stock" value="At or below reorder level" />
            <Setting label="Critical stock" value="At or below critical level" />
            <Setting label="Large discount" value="Over 15%" />
            <Setting label="Sales drop alert" value="Below 50% of 7-day avg" />
          </Card>
          <Card title="Demo Data" subtitle="Changes persist across app restarts">
            <Text style={styles.muted}>Products, inventory, transactions and audit logs are saved on this device.</Text>
            <Pressable
              style={styles.resetBtn}
              onPress={() =>
                Alert.alert('Reset demo data', 'Restore the original sample data? This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: () => resetData() },
                ])
              }
            >
              <Text style={styles.resetText}>Reset demo data</Text>
            </Pressable>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.bold}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: gap.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  resetBtn: { marginTop: gap.md, borderWidth: 1, borderColor: '#E3C0BA', backgroundColor: '#F1DCD8', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  resetText: { fontSize: 13, fontWeight: '700', color: colors.critical },
});
