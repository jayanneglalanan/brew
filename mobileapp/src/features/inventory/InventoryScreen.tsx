import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  formatDateTime,
  formatNumber,
  formatPeso,
  getDateRange,
  getInventorySummary,
  getStockMovement,
  getStockStatusRows,
  getWastage,
  type StockMovementEntry,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import FormField from '../../components/ui/FormField';
import Table, { type Column } from '../../components/ui/Table';
import { colors, gap, radius } from '../../theme';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'items', label: 'Stock Items' },
  { value: 'movement', label: 'Movement' },
  { value: 'low', label: 'Low Stock' },
  { value: 'wastage', label: 'Wastage' },
];

const STATUS_VARIANT: Record<string, string> = { good: 'good', low: 'low', critical: 'critical' };
const TYPE_LABEL: Record<string, string> = { purchase: 'Purchase', wastage: 'Wastage', damaged: 'Damaged', adjustment: 'Adjustment' };
const MOVEMENT_TYPES: StockMovementEntry['type'][] = ['purchase', 'wastage', 'damaged', 'adjustment'];

export default function InventoryScreen() {
  const { inventory, products, transactions, stockMovements, recordMovement } = useData();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mvType, setMvType] = useState<StockMovementEntry['type']>('wastage');
  const [mvItem, setMvItem] = useState('');
  const [mvQty, setMvQty] = useState('1');
  const [mvNote, setMvNote] = useState('');

  const range = useMemo(() => getDateRange('week'), []);

  const summary = useMemo(() => getInventorySummary(inventory), [inventory]);
  const statusRows = useMemo(() => getStockStatusRows(inventory), [inventory]);
  const movement = useMemo(
    () => getStockMovement(inventory, products, transactions, stockMovements, range),
    [inventory, products, transactions, stockMovements, range],
  );
  const wastage = useMemo(() => getWastage(stockMovements, inventory, range), [stockMovements, inventory, range]);
  const lowRows = useMemo(() => statusRows.filter((r) => r.status !== 'good'), [statusRows]);
  const filteredItems = statusRows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const itemCols: Column<(typeof statusRows)[number]>[] = [
    { header: 'Item', key: 'name', width: 2.0, lines: 2, render: (r) => <Text style={styles.bold} numberOfLines={2}>{r.name}</Text> },
    { header: 'Stock', key: 'current', width: 1.0, lines: 1, render: (r) => (
        <Text style={[styles.bold, { color: r.status === 'critical' ? colors.critical : r.status === 'low' ? colors.low : colors.good }]} numberOfLines={1}>
          {r.current} {r.unit}
        </Text>
      ) },
    { header: 'Reorder', key: 'reorderLevel', width: 1.0, lines: 1 },
    { header: 'Status', key: 'status', width: 1.2, lines: 1, render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge> },
  ];

  const movementCols: Column<(typeof movement)[number]>[] = [
    { header: 'Item', key: 'name', width: 1.3, lines: 2, render: (r) => <Text style={styles.bold} numberOfLines={2}>{r.name}</Text> },
    { header: 'Purchases', key: 'purchases', width: 1.6, lines: 1, render: (r) => <Text style={{ color: colors.good }} numberOfLines={1}>+{formatNumber(r.purchases)}</Text> },
    { header: 'Sold', key: 'salesConsumption', width: 0.9, lines: 1, render: (r) => `-${formatNumber(r.salesConsumption)}` },
    { header: 'Waste', key: 'wastage', width: 1.0, lines: 1, render: (r) => <Text style={{ color: colors.low }} numberOfLines={1}>-{formatNumber(r.wastage)}</Text> },
    { header: 'Current', key: 'currentStock', width: 1.3, lines: 1, render: (r) => <Text style={styles.bold} numberOfLines={1}>{r.currentStock} {r.unit}</Text> },
  ];

  const wasteCols: Column<(typeof wastage)[number]>[] = [
    { header: 'Item', key: 'item', width: 1.6, lines: 2, render: (r) => <Text style={styles.bold} numberOfLines={2}>{r.item}</Text> },
    { header: 'Type', key: 'type', width: 0.9, lines: 1, render: (r) => <Badge variant={r.type === 'damaged' ? 'critical' : 'low'}>{r.type}</Badge> },
    { header: 'Qty', key: 'qty', width: 0.9, lines: 1, render: (r) => <Text style={{ color: colors.critical }} numberOfLines={1}>-{r.qty} {r.unit}</Text> },
    { header: 'Date', key: 'timestamp', width: 1.4, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{formatDateTime(r.timestamp)}</Text> },
  ];

  const saveMovement = () => {
    const item = inventory.find((i) => i.id === mvItem);
    const qty = Number(mvQty);
    if (!item || !qty || qty <= 0) return;
    recordMovement({ type: mvType, itemId: item.id, qty: mvType === 'adjustment' ? qty : mvType === 'purchase' ? qty : -qty, note: mvNote || TYPE_LABEL[mvType] });
    setModalOpen(false);
    setMvNote('');
    setMvQty('1');
  };

  return (
    <Screen
      title="Inventory"
      subtitle={`${summary.total} items · ${formatPeso(summary.inventoryValue, { compact: true })} value`}
      sticky={
        <>
          <Pressable style={styles.addBtn} onPress={() => setModalOpen(true)}>
            <Text style={styles.addBtnText}>+ Record Movement</Text>
          </Pressable>
          <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
        </>
      }
    >
      {tab === 'overview' && (
        <>
          <View style={styles.grid}>
            <StatCard label="Total Items" value={formatNumber(summary.total)} icon="📦" accent="slate" style={styles.half} />
            <StatCard label="Healthy" value={formatNumber(summary.healthy)} icon="🟢" accent="green" style={styles.half} />
            <StatCard label="Low Stock" value={formatNumber(summary.low)} icon="🟡" accent="amber" style={styles.half} />
            <StatCard label="Critical" value={formatNumber(summary.critical)} icon="🔴" accent="red" style={styles.half} />
          </View>
          <Card title="Inventory Status" subtitle="All items">
            <Table columns={itemCols} rows={statusRows} rowKey={(r) => r.itemId} />
          </Card>
        </>
      )}

      {tab === 'items' && (
        <Card title="All Stock Items">
          <TextInput style={styles.search} placeholder="Search stock items…" placeholderTextColor={colors.sub} value={search} onChangeText={setSearch} />
          <Table columns={itemCols} rows={filteredItems} rowKey={(r) => r.itemId} />
        </Card>
      )}

      {tab === 'movement' && (
        <Card title="Stock Movement" subtitle={range.label}>
          <Table columns={movementCols} rows={movement} rowKey={(r) => r.itemId} />
        </Card>
      )}

      {tab === 'low' && (
        <Card title="Low & Critical" subtitle={`${lowRows.length} items need attention`}>
          {lowRows.length === 0 ? (
            <Text style={styles.muted}>All stock levels are healthy 🎉</Text>
          ) : (
            <Table columns={itemCols} rows={lowRows} rowKey={(r) => r.itemId} />
          )}
        </Card>
      )}

      {tab === 'wastage' && (
        <Card title="Wastage & Damaged" subtitle={range.label}>
          <Table columns={wasteCols} rows={wastage} rowKey={(r) => r.id} />
        </Card>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Record Stock Movement</Text>
            <Text style={styles.miniLabel}>Movement Type</Text>
            <View style={styles.chipRow}>
              {MOVEMENT_TYPES.map((t) => (
                <Pressable key={t} onPress={() => setMvType(t)} style={[styles.chip, mvType === t && styles.chipActive]}>
                  <Text style={[styles.chipText, mvType === t && styles.chipTextActive]}>{TYPE_LABEL[t]}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.miniLabel}>Item</Text>
            <View style={styles.chipRow}>
              {inventory.map((i) => (
                <Pressable key={i.id} onPress={() => setMvItem(i.id)} style={[styles.chip, mvItem === i.id && styles.chipActive]}>
                  <Text style={[styles.chipText, mvItem === i.id && styles.chipTextActive]}>{i.name}</Text>
                </Pressable>
              ))}
            </View>
            <FormField label="Quantity" keyboardType="numeric" value={mvQty} onChangeText={setMvQty} />
            <FormField label="Note" value={mvNote} onChangeText={setMvNote} placeholder="e.g. Expired stock" />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={saveMovement} disabled={!mvItem || !Number(mvQty)}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginBottom: gap.lg },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '48%' },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  search: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: gap.md },
  modalWrap: { flex: 1, backgroundColor: 'rgba(61,48,42,0.4)', justifyContent: 'center', padding: gap.lg },
  modal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: gap.lg },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.onCard, marginBottom: gap.md },
  miniLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.onCardSub, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: gap.md },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.sub },
  chipTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: gap.sm, marginTop: gap.sm },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F4EDE3' },
  cancelText: { color: colors.sub, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.brand },
  saveText: { color: '#fff', fontWeight: '700' },
});
