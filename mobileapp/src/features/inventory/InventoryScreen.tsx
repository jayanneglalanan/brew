import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { History, PackagePlus } from 'lucide-react-native';
import {
  formatDateTime,
  formatNumber,
  formatPeso,
  getInventorySummary,
  getStockStatusRows,
  getWastage,
  type InventoryItem,
  type StockMovementEntry,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import { useRangeFilter } from '../../data/RangeFilterContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import RangeFilterDropdown from '../../components/ui/RangeFilterDropdown';
import Fab from '../../components/ui/Fab';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import FormField from '../../components/ui/FormField';
import Table, { type Column } from '../../components/ui/Table';
import { colors, gap, radius } from '../../theme';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'items', label: 'Stock Items' },
  { value: 'history', label: 'History' },
  { value: 'low', label: 'Low Stock' },
  { value: 'wastage', label: 'Wastage' },
];

const STATUS_VARIANT: Record<string, string> = { good: 'good', low: 'low', critical: 'critical' };
const TYPE_LABEL: Record<string, string> = { purchase: 'Purchase', sale: 'Sale', wastage: 'Wastage', damaged: 'Damaged', adjustment: 'Adjustment' };
const MOVEMENT_TYPES: StockMovementEntry['type'][] = ['wastage', 'damaged'];
const UNITS = ['kg', 'g', 'L', 'mL', 'pcs', 'ct', 'pack'];

const EMPTY_FORM = {
  name: '',
  unit: 'kg',
  currentStock: '',
  reorderLevel: '',
  criticalLevel: '',
  costPerUnit: '',
  category: '',
  supplier: '',
  expirationDate: '',
};

function statusFor(item: InventoryItem): 'good' | 'low' | 'critical' {
  return item.currentStock <= item.criticalLevel ? 'critical' : item.currentStock <= item.reorderLevel ? 'low' : 'good';
}

export default function InventoryScreen() {
  const {
    inventory,
    stockMovements,
    recordMovement,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = useData();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mvType, setMvType] = useState<StockMovementEntry['type']>('wastage');
  const [mvItem, setMvItem] = useState('');
  const [mvQty, setMvQty] = useState('1');
  const [mvNote, setMvNote] = useState('');

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState(EMPTY_FORM);

  const { range } = useRangeFilter();

  const summary = useMemo(() => getInventorySummary(inventory), [inventory]);
  const statusRows = useMemo(() => getStockStatusRows(inventory), [inventory]);
  const wastage = useMemo(() => getWastage(stockMovements, inventory, range), [stockMovements, inventory, range]);
  const lowRows = useMemo(() => statusRows.filter((r) => r.status !== 'good'), [statusRows]);
  const filteredItems = inventory.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const history = useMemo(
    () => [...stockMovements].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [stockMovements],
  );
  const nameById = useMemo(() => new Map(inventory.map((i) => [i.id, i.name])), [inventory]);

  const itemCols: Column<InventoryItem>[] = [
    { header: 'Stock Item', key: 'name', width: 1.5, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{r.name}</Text> },
    { header: 'Category', key: 'category', width: 1.2, lines: 2, render: (r) => <Text style={[styles.muted, styles.center]} numberOfLines={2}>{r.category || '—'}</Text> },
    { header: 'Current', key: 'current', width: 1.1, lines: 1, render: (r) => (
        <Text style={[styles.bold, { color: statusFor(r) === 'critical' ? colors.critical : statusFor(r) === 'low' ? colors.low : colors.good }]} numberOfLines={1}>
          {formatNumber(r.currentStock)} {r.unit}
        </Text>
      ) },
    { header: 'Status', key: 'status', width: 1.1, lines: 1, render: (r) => <Badge variant={STATUS_VARIANT[statusFor(r)]}>{statusFor(r)}</Badge> },
    { header: 'Actions', key: 'actions', width: 1.4, lines: 1, render: (r) => (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={() => openItemEdit(r)}><Badge variant="brand">Edit</Badge></Pressable>
          <Pressable onPress={() => confirmDelete(r)}><Badge variant="critical">Del</Badge></Pressable>
        </View>
      ) },
  ];

  const statusCols: Column<(typeof statusRows)[number]>[] = [
    { header: 'Ingredient', key: 'name', width: 2.0, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{r.name}</Text> },
    { header: 'Current', key: 'current', width: 1.0, lines: 1, render: (r) => (
        <Text style={[styles.bold, { color: r.status === 'critical' ? colors.critical : r.status === 'low' ? colors.low : colors.good }]} numberOfLines={1}>
          {r.current} {r.unit}
        </Text>
      ) },
    { header: 'Unit', key: 'unit', width: 0.7, lines: 1 },
    { header: 'Status', key: 'status', width: 1.2, lines: 1, render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge> },
  ];

  const historyCols: Column<(typeof history)[number]>[] = [
    { header: 'Timestamp', key: 'timestamp', width: 1.4, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{formatDateTime(r.timestamp)}</Text> },
    { header: 'Item', key: 'itemId', width: 1.3, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{nameById.get(r.itemId) ?? r.itemId}</Text> },
    { header: 'Type', key: 'type', width: 1.0, lines: 1, render: (r) => <Badge variant={r.type === 'damaged' ? 'critical' : r.type === 'wastage' ? 'low' : r.type === 'purchase' ? 'good' : 'brand'}>{TYPE_LABEL[r.type]}</Badge> },
    { header: 'Qty', key: 'qty', width: 0.9, lines: 1, render: (r) => (
        <Text style={{ color: typeof r.qty === 'number' ? (r.qty < 0 ? colors.critical : colors.good) : colors.sub, fontWeight: '700' }} numberOfLines={1}>
          {typeof r.qty === 'number' ? `${r.qty > 0 ? '+' : ''}${formatNumber(r.qty)}` : r.qty}
        </Text>
      ) },
    { header: 'Note', key: 'note', width: 1.4, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{r.note ?? '—'}</Text> },
  ];

  const wasteCols: Column<(typeof wastage)[number]>[] = [
    { header: 'Item', key: 'item', width: 1.5, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{r.item}</Text> },
    { header: 'Type', key: 'type', width: 0.9, lines: 1, render: (r) => <Badge variant={r.type === 'damaged' ? 'critical' : 'low'}>{r.type}</Badge> },
    { header: 'Qty', key: 'qty', width: 0.9, lines: 1, render: (r) => <Text style={{ color: colors.critical }} numberOfLines={1}>{typeof r.qty === 'number' ? `-${formatNumber(r.qty)} ${r.unit}` : r.qty}</Text> },
    { header: 'Note', key: 'note', width: 1.3, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{r.note ?? '—'}</Text> },
    { header: 'Date', key: 'timestamp', width: 1.3, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{formatDateTime(r.timestamp)}</Text> },
  ];

  const saveMovement = () => {
    const item = inventory.find((i) => i.name.trim().toLowerCase() === mvItem.trim().toLowerCase());
    const raw = mvQty.trim();
    if (!item || !raw) return;
    const n = Number(raw);
    recordMovement({ type: mvType, itemId: item.id, qty: Number.isFinite(n) ? -Math.abs(n) : raw, note: mvNote || TYPE_LABEL[mvType] });
    setModalOpen(false);
    setMvNote('');
    setMvQty('1');
  };

  const openItemAdd = () => {
    setEditingItem(null);
    setItemForm(EMPTY_FORM);
    setItemModalOpen(true);
  };
  const openItemEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      unit: item.unit,
      currentStock: String(item.currentStock),
      reorderLevel: String(item.reorderLevel),
      criticalLevel: String(item.criticalLevel),
      costPerUnit: String(item.costPerUnit),
      category: item.category,
      supplier: item.supplier ?? '',
      expirationDate: item.expirationDate ?? '',
    });
    setItemModalOpen(true);
  };
  const saveItem = () => {
    if (!itemForm.name.trim()) return;
    const payload = {
      name: itemForm.name.trim(),
      unit: itemForm.unit,
      currentStock: Number(itemForm.currentStock) || 0,
      reorderLevel: Number(itemForm.reorderLevel) || 0,
      criticalLevel: Number(itemForm.criticalLevel) || 0,
      costPerUnit: Number(itemForm.costPerUnit) || 0,
      category: itemForm.category.trim(),
      supplier: itemForm.supplier.trim() || undefined,
      expirationDate: itemForm.expirationDate.trim() || undefined,
    };
    if (editingItem) updateInventoryItem({ ...editingItem, ...payload });
    else addInventoryItem(payload);
    setItemModalOpen(false);
  };
  const confirmDelete = (item: InventoryItem) => {
    Alert.alert('Delete stock item', `Remove "${item.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteInventoryItem(item.id) },
    ]);
  };

  return (
    <Screen
      title="Inventory"
      subtitle={`${summary.total} items · ${formatPeso(summary.inventoryValue, { compact: true })} value`}
      sticky={
        <>
          {tab === 'wastage' && <RangeFilterDropdown />}
          <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
        </>
      }
      floating={
        <Fab
          options={[
            { label: 'Record Movement', icon: History, onPress: () => setModalOpen(true) },
            { label: 'Add Stock Item', icon: PackagePlus, onPress: openItemAdd },
          ]}
        />
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
            <Table columns={statusCols} rows={statusRows} rowKey={(r) => r.itemId} />
          </Card>
        </>
      )}

      {tab === 'items' && (
        <Card title="All Stock Items">
          <TextInput style={styles.search} placeholder="Search stock items…" placeholderTextColor={colors.sub} value={search} onChangeText={setSearch} />
          <Table columns={itemCols} rows={filteredItems} rowKey={(r) => r.id} />
        </Card>
      )}

      {tab === 'history' && (
        <Card title="Movement History" subtitle="Every movement with a timestamp">
          <Table columns={historyCols} rows={history} rowKey={(r) => r.id} />
        </Card>
      )}

      {tab === 'low' && (
        <Card title="Low & Critical" subtitle={`${lowRows.length} items need attention`}>
          {lowRows.length === 0 ? (
            <Text style={styles.muted}>All stock levels are healthy 🎉</Text>
          ) : (
            <Table columns={statusCols} rows={lowRows} rowKey={(r) => r.itemId} />
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
            <FormField label="Item" value={mvItem} onChangeText={setMvItem} placeholder="Type item name…" />
            <FormField label="Quantity" keyboardType="default" value={mvQty} onChangeText={setMvQty} />
            <FormField label="Note" value={mvNote} onChangeText={setMvNote} placeholder="e.g. Expired stock" />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={saveMovement} disabled={!mvItem || !mvQty.trim()}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={itemModalOpen} animationType="slide" transparent onRequestClose={() => setItemModalOpen(false)}>
        <View style={styles.modalWrap}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{editingItem ? `Edit ${editingItem.name}` : 'Add Stock Item'}</Text>
              <FormField label="Stock Item Name" value={itemForm.name} onChangeText={(name) => setItemForm({ ...itemForm, name })} placeholder="e.g. Almond Milk" />
              <Text style={styles.miniLabel}>Unit of Measurement</Text>
              <View style={styles.chipRow}>
                {UNITS.map((u) => (
                  <Pressable key={u} onPress={() => setItemForm({ ...itemForm, unit: u })} style={[styles.chip, itemForm.unit === u && styles.chipActive]}>
                    <Text style={[styles.chipText, itemForm.unit === u && styles.chipTextActive]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
              <FormField label="Category" value={itemForm.category} onChangeText={(category) => setItemForm({ ...itemForm, category })} placeholder="e.g. Beverage" />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <FormField label="Current Qty" keyboardType="numeric" value={itemForm.currentStock} onChangeText={(currentStock) => setItemForm({ ...itemForm, currentStock })} />
                </View>
              </View>
              <View style={styles.modalActions}>
                <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setItemModalOpen(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={saveItem} disabled={!itemForm.name.trim()}>
                  <Text style={styles.saveText}>Save</Text>
                </Pressable>
              </View>
              {editingItem ? (
                <Pressable onPress={() => { setItemModalOpen(false); confirmDelete(editingItem); }}>
                  <Text style={styles.deleteText}>Delete stock item</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '48%' },
  center: { textAlign: 'center' },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  search: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: gap.md },
  modalWrap: { flex: 1, backgroundColor: 'rgba(61,48,42,0.4)', justifyContent: 'center', padding: gap.lg },
  modalScroll: { flexGrow: 0 },
  modal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: gap.lg },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.onCard, marginBottom: gap.md },
  miniLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.onCardSub, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: gap.md },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.sub },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  detailText: { fontSize: 13, color: colors.onCardSub, marginTop: 8 },
  detailStrong: { color: colors.onCard, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: gap.sm, marginTop: gap.md },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F4EDE3' },
  cancelText: { color: colors.sub, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.brand },
  saveText: { color: '#fff', fontWeight: '700' },
  deleteText: { color: colors.critical, textAlign: 'center', marginTop: gap.md, fontWeight: '600', fontSize: 13 },
});