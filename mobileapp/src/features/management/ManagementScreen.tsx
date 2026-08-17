import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatDateTime,
  formatPeso,
  getDateRange,
  getStaffPerformance,
  staff,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import { useAuth } from '../../data/AuthContext';
import { useShopName } from '../../data/ShopNameContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import FormField from '../../components/ui/FormField';
import Table, { type Column } from '../../components/ui/Table';
import { colors, gap, radius } from '../../theme';

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
  const { transactions, auditLogs, resetData } = useData();
  const { user, updateUser } = useAuth();
  const { shopName, setShopName, businessHours, setBusinessHours } = useShopName();
  const [tab, setTab] = useState('staff');
  const [nameDraft, setNameDraft] = useState(user?.name ?? '');
  const [shopNameDraft, setShopNameDraft] = useState(shopName);
  const [businessHoursDraft, setBusinessHoursDraft] = useState(businessHours);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const range = useMemo(() => getDateRange('week'), []);
  const perf = useMemo(() => getStaffPerformance(transactions, staff, range), [transactions, range]);
  const nameById = useMemo(() => new Map(staff.map((s) => [s.id, s.name])), []);
  const logs = useMemo(() => [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 40), [auditLogs]);

  useEffect(() => {
    setNameDraft(user?.name ?? '');
  }, [user]);

  useEffect(() => {
    setShopNameDraft(shopName);
  }, [shopName]);

  useEffect(() => {
    setBusinessHoursDraft(businessHours);
  }, [businessHours]);

  const saveProfile = () => {
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    const nextName = nameDraft.trim();
    const nextShopName = shopNameDraft.trim();
    const nextBusinessHours = businessHoursDraft.trim();
    const tasks = [updateUser(nextName), setShopName(nextShopName), setBusinessHours(nextBusinessHours)];
    Promise.all(tasks).then(() => {
      setConfirmOpen(false);
    });
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
  };

  const staffCols: Column<(typeof perf)[number]>[] = [
    { header: 'Staff', key: 'name', width: 1.5, lines: 2, render: (r) => <Text style={styles.bold}>{r.name}</Text> },
    { header: 'Role', key: 'role', width: 1.0, lines: 1, render: (r) => <Badge variant={r.role === 'cashier' ? 'slate' : 'brand'}>{r.role}</Badge> },
    { header: 'Tx', key: 'transactions', width: 0.8, lines: 1 },
    { header: 'Sales', key: 'sales', width: 1.2, lines: 1, render: (r) => formatPeso(r.sales) },
    { header: 'Voids', key: 'voids', width: 0.9, lines: 1, render: (r) => <Text style={{ color: r.voids > 0 ? colors.critical : colors.sub }}>{r.voids}</Text> },
  ];

  const logCols: Column<(typeof logs)[number]>[] = [
    { header: 'Time', key: 'timestamp', width: 1.4, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{formatDateTime(r.timestamp)}</Text> },
    { header: 'Actor', key: 'actor', width: 1.0, lines: 2, render: (r) => <Text style={styles.bold} numberOfLines={2}>{nameById.get(r.actorId) ?? r.actorId}</Text> },
    { header: 'Action', key: 'action', width: 1.3, lines: 1, render: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? 'slate'}>{ACTION_LABEL[r.action] ?? r.action}</Badge> },
    { header: 'Target', key: 'target', width: 1.5, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{r.target}</Text> },
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
          <Card title="Profile" style={styles.profileCard}>
            {user ? (
              <>
                <View style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: '#8B5E3C' }]}>
                    <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bold}>{user.name}</Text>
                    <Text style={styles.muted}>{user.role}</Text>
                  </View>
                </View>
                <FormField label="Full Name" value={nameDraft} onChangeText={setNameDraft} placeholder="Enter your name" autoCapitalize="words" />
                <FormField label="Shop Name" value={shopNameDraft} onChangeText={setShopNameDraft} placeholder="Enter shop name" autoCapitalize="words" />
                <FormField label="Business Hours" value={businessHoursDraft} onChangeText={setBusinessHoursDraft} placeholder="e.g. 7:00 AM – 9:00 PM" autoCapitalize="words" />
                <Pressable style={styles.saveBtn} onPress={saveProfile} disabled={!nameDraft.trim() || !shopNameDraft.trim() || !businessHoursDraft.trim()}>
                  <Text style={styles.saveText}>Save Profile</Text>
                </Pressable>
              </>
            ) : null}
          </Card>
          <Card title="Alert Thresholds">
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

      <Modal visible={confirmOpen} animationType="fade" transparent onRequestClose={closeConfirm}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Save Profile</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={closeConfirm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={confirmSave}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  profileCard: { width: '92%', alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: gap.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  resetBtn: { marginTop: gap.md, borderWidth: 1, borderColor: '#E3C0BA', backgroundColor: '#F1DCD8', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  resetText: { fontSize: 13, fontWeight: '700', color: colors.critical },
  saveBtn: { marginTop: gap.sm, backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 12, alignItems: 'center', width: '100%' },
  saveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(61,48,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: gap.lg },
  modal: { backgroundColor: colors.card, borderRadius: radius.md, padding: gap.md, width: '78%', maxWidth: 300, alignSelf: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '800', color: colors.onCard, marginBottom: gap.sm },
  modalActions: { flexDirection: 'row', gap: gap.sm },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F4EDE3' },
  cancelText: { color: colors.sub, fontWeight: '700' },
});
