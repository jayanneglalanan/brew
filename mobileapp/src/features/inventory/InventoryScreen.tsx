import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { History, PackagePlus } from 'lucide-react-native';
import {
  formatDateTime,
  formatNumber,
  formatPeso,
  getInventorySummary,
  getStockStatusRows,
  getWastage,
  type Expense,
  type ExpenseCategory,
  type InventoryItem,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import { useRangeFilter } from '../../data/RangeFilterContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Pulse from '../../components/ui/Pulse';
import AnimatedModal from '../../components/ui/AnimatedModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
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
  { value: 'expenses', label: 'Expenses' },
];

const STATUS_VARIANT: Record<string, string> = { good: 'good', low: 'low', critical: 'critical' };
const TYPE_LABEL: Record<string, string> = { purchase: 'Purchase', sale: 'Sale', wastage: 'Wastage', damaged: 'Damaged', adjustment: 'Adjustment' };
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['rent', 'utilities', 'supplies', 'payroll', 'maintenance', 'marketing', 'other'];
const EXPENSE_CATEGORY_LABEL: Record<string, string> = { rent: 'Rent', utilities: 'Utilities', supplies: 'Supplies', payroll: 'Payroll', maintenance: 'Maintenance', marketing: 'Marketing', other: 'Other' };
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
    expenses,
    recordMovement,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useData();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mvType, setMvType] = useState<'wastage' | 'damaged' | 'expense'>('wastage');
  const [mvItem, setMvItem] = useState('');
  const [mvQty, setMvQty] = useState('1');
  const [mvNote, setMvNote] = useState('');

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState(EMPTY_FORM);
  const [removingKeys, setRemovingKeys] = useState<ReadonlySet<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const [expForm, setExpForm] = useState({ name: '', amount: '', category: 'supplies' as ExpenseCategory, description: '', receiptImage: '' });
  const [expenseEditTarget, setExpenseEditTarget] = useState<Expense | null>(null);
  const [expenseDeleteTarget, setExpenseDeleteTarget] = useState<Expense | null>(null);
  const [expenseEditOpen, setExpenseEditOpen] = useState(false);
  const [receiptViewTarget, setReceiptViewTarget] = useState<string | null>(null);

  const { range } = useRangeFilter();

  const summary = useMemo(() => getInventorySummary(inventory), [inventory]);
  const statusRows = useMemo(() => getStockStatusRows(inventory), [inventory]);
  const wastage = useMemo(() => getWastage(stockMovements, inventory, range), [stockMovements, inventory, range]);
  const lowRows = useMemo(() => statusRows.filter((r) => r.status !== 'good'), [statusRows]);
  const filteredItems = inventory.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const nameById = useMemo(() => new Map(inventory.map((i) => [i.id, i.name])), [inventory]);
  type HistoryRow = {
    id: string;
    timestamp: string;
    itemName: string;
    type: string;
    qty: number | string;
    note: string | undefined;
  };

  const history = useMemo(() => {
    const mvRows: HistoryRow[] = stockMovements.map((m) => ({
      id: m.id,
      timestamp: m.timestamp,
      itemName: nameById.get(m.itemId) ?? m.itemId,
      type: m.type,
      qty: m.qty,
      note: m.note,
    }));
    const expRows: HistoryRow[] = expenses.map((e) => ({
      id: `exp-hist-${e.id}`,
      timestamp: e.timestamp,
      itemName: e.name,
      type: 'expense',
      qty: e.amount,
      note: e.description ?? EXPENSE_CATEGORY_LABEL[e.category] ?? e.category,
    }));
    return [...mvRows, ...expRows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [stockMovements, expenses, nameById]);

  const itemCols: Column<InventoryItem>[] = [
    { header: 'Stock Item', key: 'name', width: 1.5, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{r.name}</Text> },
    { header: 'Category', key: 'category', width: 1.2, lines: 2, render: (r) => <Text style={[styles.muted, styles.center]} numberOfLines={2}>{r.category || '—'}</Text> },
    { header: 'Current', key: 'current', width: 1.1, lines: 1, render: (r) => (
        <Text style={[styles.bold, { color: statusFor(r) === 'critical' ? colors.critical : statusFor(r) === 'low' ? colors.low : colors.good }]} numberOfLines={1}>
          {formatNumber(r.currentStock)} {r.unit}
        </Text>
      ) },
    { header: 'Status', key: 'status', width: 1.1, lines: 1, render: (r) => {
        const st = statusFor(r);
        const badge = <Badge variant={STATUS_VARIANT[st]}>{st}</Badge>;
        return st === 'good' ? badge : <Pulse>{badge}</Pulse>;
      } },
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
    { header: 'Status', key: 'status', width: 1.2, lines: 1, render: (r) => {
        const badge = <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>;
        return r.status === 'good' ? badge : <Pulse>{badge}</Pulse>;
      } },
  ];

  const historyCols: Column<HistoryRow>[] = [
    { header: 'Timestamp', key: 'timestamp', width: 1.4, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{formatDateTime(r.timestamp)}</Text> },
    { header: 'Item', key: 'itemName', width: 1.3, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{r.itemName}</Text> },
    { header: 'Type', key: 'type', width: 1.0, lines: 1, render: (r) => {
        const variant = r.type === 'expense' ? 'amber' : r.type === 'damaged' ? 'critical' : r.type === 'wastage' ? 'low' : r.type === 'purchase' ? 'good' : 'brand';
        return <Badge variant={variant}>{r.type === 'expense' ? 'Expense' : TYPE_LABEL[r.type]}</Badge>;
      } },
    { header: 'Qty / Amount', key: 'qty', width: 0.9, lines: 1, render: (r) => {
        if (r.type === 'expense') return <Text style={{ color: colors.critical, fontWeight: '700' }} numberOfLines={1}>{formatPeso(typeof r.qty === 'number' ? r.qty : 0)}</Text>;
        return (
          <Text style={{ color: typeof r.qty === 'number' ? (r.qty < 0 ? colors.critical : colors.good) : colors.sub, fontWeight: '700' }} numberOfLines={1}>
            {typeof r.qty === 'number' ? `${r.qty > 0 ? '+' : ''}${formatNumber(r.qty)}` : r.qty}
          </Text>
        );
      } },
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
    if (mvType === 'expense') {
      if (!expForm.name.trim() || !expForm.amount.trim()) return;
      const amount = Number(expForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) return;
      addExpense({
        name: expForm.name.trim(),
        amount,
        category: expForm.category,
        description: expForm.description.trim() || undefined,
        receiptImage: expForm.receiptImage || undefined,
        timestamp: new Date().toISOString(),
      });
      toast(`${expForm.name.trim()} expense recorded`);
      setModalOpen(false);
      setExpForm({ name: '', amount: '', category: 'supplies', description: '', receiptImage: '' });
      return;
    }
    const item = inventory.find((i) => i.name.trim().toLowerCase() === mvItem.trim().toLowerCase());
    const raw = mvQty.trim();
    if (!item || !raw) return;
    const n = Number(raw);
    recordMovement({ type: mvType, itemId: item.id, qty: Number.isFinite(n) ? -Math.abs(n) : raw, note: mvNote || TYPE_LABEL[mvType] });
    setModalOpen(false);
    setMvNote('');
    setMvQty('1');
    toast(`${TYPE_LABEL[mvType]} recorded`);
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
    toast(editingItem ? 'Stock item updated' : 'Stock item added');
  };
  const confirmDelete = (item: InventoryItem) => setDeleteTarget(item);

  const expenseCols: Column<Expense>[] = [
    { header: 'Expense', key: 'name', width: 1.5, lines: 2, render: (r) => <Text style={[styles.bold, styles.center]}>{r.name}</Text> },
    { header: 'Category', key: 'category', width: 1.1, lines: 1, render: (r) => <Badge variant="slate">{EXPENSE_CATEGORY_LABEL[r.category] ?? r.category}</Badge> },
    { header: 'Amount', key: 'amount', width: 1.1, lines: 1, render: (r) => <Text style={{ color: colors.critical, fontWeight: '700' }} numberOfLines={1}>{formatPeso(r.amount)}</Text> },
    { header: 'Date', key: 'timestamp', width: 1.2, lines: 2, render: (r) => <Text style={styles.muted} numberOfLines={2}>{formatDateTime(r.timestamp)}</Text> },
    { header: 'Receipt', key: 'receiptImage', width: 0.9, lines: 1, render: (r) => r.receiptImage ? (
        <Pressable onPress={() => setReceiptViewTarget(r.receiptImage!)}><Badge variant="good">View</Badge></Pressable>
      ) : <Text style={[styles.muted, { textAlign: 'center' }]}>—</Text> },
    { header: 'Actions', key: 'actions', width: 1.2, lines: 1, render: (r) => (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={() => openExpenseEdit(r)}><Badge variant="brand">Edit</Badge></Pressable>
          <Pressable onPress={() => setExpenseDeleteTarget(r)}><Badge variant="critical">Del</Badge></Pressable>
        </View>
      ) },
  ];

  const openExpenseEdit = (expense: Expense) => {
    setExpenseEditTarget(expense);
    setExpForm({
      name: expense.name,
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description ?? '',
      receiptImage: expense.receiptImage ?? '',
    });
    setExpenseEditOpen(true);
  };

  const saveExpenseEdit = () => {
    if (!expenseEditTarget || !expForm.name.trim() || !expForm.amount.trim()) return;
    const amount = Number(expForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    updateExpense({
      ...expenseEditTarget,
      name: expForm.name.trim(),
      amount,
      category: expForm.category,
      description: expForm.description.trim() || undefined,
      receiptImage: expForm.receiptImage || undefined,
    });
    toast(`${expForm.name.trim()} expense updated`);
    setExpenseEditOpen(false);
    setExpenseEditTarget(null);
    setExpForm({ name: '', amount: '', category: 'supplies', description: '', receiptImage: '' });
  };

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.base64) {
      setExpForm((prev) => ({ ...prev, receiptImage: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` }));
    } else if (asset.uri) {
      setExpForm((prev) => ({ ...prev, receiptImage: asset.uri }));
    }
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
          <Table columns={itemCols} rows={filteredItems} rowKey={(r) => r.id} fadingKeys={removingKeys} />
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

      {tab === 'expenses' && (
        <Card title="All Expenses" subtitle="Recorded inventory-related expenses">
          <Table columns={expenseCols} rows={[...expenses].sort((a, b) => b.timestamp.localeCompare(a.timestamp))} rowKey={(r) => r.id} />
        </Card>
      )}

      <AnimatedModal visible={modalOpen} onClose={() => setModalOpen(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>Record Stock Movement</Text>
          <Text style={styles.miniLabel}>Movement Type</Text>
          <View style={styles.chipRow}>
            {(['wastage', 'damaged', 'expense'] as const).map((t) => (
              <Pressable key={t} onPress={() => setMvType(t)} style={[styles.chip, mvType === t && styles.chipActive]}>
                <Text style={[styles.chipText, mvType === t && styles.chipTextActive]}>{t === 'expense' ? 'Expenses' : TYPE_LABEL[t]}</Text>
              </Pressable>
            ))}
          </View>

          {mvType === 'expense' ? (
            <>
              <FormField label="Expense Name" value={expForm.name} onChangeText={(v) => setExpForm({ ...expForm, name: v })} placeholder="e.g. Coffee Bean Restock" />
              <FormField label="Amount (₱)" keyboardType="numeric" value={expForm.amount} onChangeText={(v) => setExpForm({ ...expForm, amount: v })} placeholder="0.00" />
              <Text style={styles.miniLabel}>Category</Text>
              <View style={styles.chipRow}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <Pressable key={c} onPress={() => setExpForm({ ...expForm, category: c })} style={[styles.chip, expForm.category === c && styles.chipActive]}>
                    <Text style={[styles.chipText, expForm.category === c && styles.chipTextActive]}>{EXPENSE_CATEGORY_LABEL[c]}</Text>
                  </Pressable>
                ))}
              </View>
              <FormField label="Description / Notes" value={expForm.description} onChangeText={(v) => setExpForm({ ...expForm, description: v })} placeholder="Optional details" />
              <Text style={styles.miniLabel}>Receipt Photo (optional)</Text>
              {expForm.receiptImage ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: gap.md }}>
                  <Badge variant="good">Receipt attached</Badge>
                  <Pressable onPress={() => setExpForm({ ...expForm, receiptImage: '' })}>
                    <Text style={{ color: colors.critical, fontSize: 12, fontWeight: '600' }}>Remove</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={[styles.chip, { marginBottom: gap.md }]} onPress={pickReceipt}>
                  <Text style={styles.chipText}>📷 Choose photo…</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <FormField label="Item" value={mvItem} onChangeText={setMvItem} placeholder="Type item name…" />
              <FormField label="Quantity" keyboardType="default" value={mvQty} onChangeText={setMvQty} />
              <FormField label="Note" value={mvNote} onChangeText={setMvNote} placeholder="e.g. Expired stock" />
            </>
          )}

          <View style={styles.modalActions}>
            <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, styles.saveBtn]}
              onPress={saveMovement}
              disabled={mvType === 'expense' ? (!expForm.name.trim() || !expForm.amount.trim()) : (!mvItem || !mvQty.trim())}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>
      </AnimatedModal>

      <AnimatedModal visible={itemModalOpen} onClose={() => setItemModalOpen(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
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
        </ScrollView>
      </AnimatedModal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete stock item"
        message={deleteTarget ? `Remove "${deleteTarget.name}" from inventory?` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setRemovingKeys((prev) => new Set(prev).add(deleteTarget.id));
          setTimeout(() => {
            deleteInventoryItem(deleteTarget.id);
            setRemovingKeys((prev) => {
              const next = new Set(prev);
              next.delete(deleteTarget.id);
              return next;
            });
            setDeleteTarget(null);
            toast('Stock item deleted');
          }, 200);
        }}
      />

      <AnimatedModal visible={expenseEditOpen} onClose={() => { setExpenseEditOpen(false); setExpenseEditTarget(null); }}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>{expenseEditTarget ? `Edit ${expenseEditTarget.name}` : 'Add Expense'}</Text>
          <FormField label="Expense Name" value={expForm.name} onChangeText={(v) => setExpForm({ ...expForm, name: v })} placeholder="e.g. Coffee Bean Restock" />
          <FormField label="Amount (₱)" keyboardType="numeric" value={expForm.amount} onChangeText={(v) => setExpForm({ ...expForm, amount: v })} placeholder="0.00" />
          <Text style={styles.miniLabel}>Category</Text>
          <View style={styles.chipRow}>
            {EXPENSE_CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setExpForm({ ...expForm, category: c })} style={[styles.chip, expForm.category === c && styles.chipActive]}>
                <Text style={[styles.chipText, expForm.category === c && styles.chipTextActive]}>{EXPENSE_CATEGORY_LABEL[c]}</Text>
              </Pressable>
            ))}
          </View>
          <FormField label="Description / Notes" value={expForm.description} onChangeText={(v) => setExpForm({ ...expForm, description: v })} placeholder="Optional details" />
          <Text style={styles.miniLabel}>Receipt Photo (optional)</Text>
          {expForm.receiptImage ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: gap.md }}>
              <Badge variant="good">Receipt attached</Badge>
              <Pressable onPress={() => setExpForm({ ...expForm, receiptImage: '' })}>
                <Text style={{ color: colors.critical, fontSize: 12, fontWeight: '600' }}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={[styles.chip, { marginBottom: gap.md }]} onPress={pickReceipt}>
              <Text style={styles.chipText}>📷 Choose photo…</Text>
            </Pressable>
          )}
          <View style={styles.modalActions}>
            <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setExpenseEditOpen(false); setExpenseEditTarget(null); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={saveExpenseEdit} disabled={!expForm.name.trim() || !expForm.amount.trim()}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>
      </AnimatedModal>

      <ConfirmDialog
        visible={!!expenseDeleteTarget}
        title="Delete expense"
        message={expenseDeleteTarget ? `Remove "${expenseDeleteTarget.name}" from expenses?` : ''}
        onCancel={() => setExpenseDeleteTarget(null)}
        onConfirm={() => {
          if (!expenseDeleteTarget) return;
          deleteExpense(expenseDeleteTarget.id);
          setExpenseDeleteTarget(null);
          toast('Expense deleted');
        }}
      />

      <AnimatedModal visible={!!receiptViewTarget} onClose={() => setReceiptViewTarget(null)}>
        <Text style={styles.modalTitle}>Receipt</Text>
        {receiptViewTarget && (
          <Image source={{ uri: receiptViewTarget }} style={{ width: '100%', height: 300, borderRadius: radius.md, resizeMode: 'contain' }} />
        )}
        <View style={styles.modalActions}>
          <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setReceiptViewTarget(null)}>
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        </View>
      </AnimatedModal>
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