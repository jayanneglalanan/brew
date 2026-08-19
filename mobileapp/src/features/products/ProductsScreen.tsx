import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Coffee, FolderPlus } from 'lucide-react-native';
import {
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getDateRange,
  getTopProducts,
  margin,
  type Category,
  type CategoryName,
  type Product,
  type ProductStatus,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import { useAuth } from '../../data/AuthContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import Fab from '../../components/ui/Fab';
import FormField from '../../components/ui/FormField';
import AnimatedModal from '../../components/ui/AnimatedModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import Table, { type Column } from '../../components/ui/Table';
import { colors, gap, radius } from '../../theme';

const TABS = [
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'profitability', label: 'Profitability' },
];

const STATUS_VARIANT: Record<string, string> = { available: 'good', 'sold-out': 'critical', hidden: 'slate' };
const STATUS_LABEL: Record<string, string> = { available: 'Available', 'sold-out': 'Sold Out', hidden: 'Hidden' };

type Form = Omit<Product, 'id'>;

export default function ProductsScreen() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const tabs = isManager ? TABS.filter((t) => t.value !== 'profitability') : TABS;
  const { products, categories, transactions, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useData();
  const { toast } = useToast();
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>({ name: '', category: 'Coffee', price: 0, cost: 0, ingredients: [], status: 'available', image: '' });
  const [removingKeys, setRemovingKeys] = useState<ReadonlySet<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);

  const range = useMemo(() => getDateRange('week'), []);
  const top = useMemo(() => getTopProducts(transactions, products, range, 'sales', 100), [products, transactions, range]);
  const topById = useMemo(() => new Map(top.map((t) => [t.productId, t])), [top]);
  const cat = useMemo(() => getCategoryBreakdown(transactions, products, range), [products, transactions, range]);
  const catSales = useMemo(() => new Map(cat.map((c) => [c.category, c.sales])), [cat]);
  const categoryNames = categories.map((c) => c.name);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', icon: '' });
  const [catError, setCatError] = useState('');

  const productCols: Column<Product>[] = [
    { header: 'Product', key: 'name', width: 1.7, lines: 2, render: (r) => (
        <View>
          <Text style={[styles.bold, styles.textCenter]}>{r.name}</Text>
          <Text style={[styles.muted, styles.textCenter]} numberOfLines={1}>{r.category}</Text>
        </View>
      ) },
    { header: 'Price', key: 'price', width: 1.05, lines: 1, render: (r) => formatPeso(r.price) },
    { header: 'Cost', key: 'cost', width: 1.05, lines: 1, render: (r) => <Text style={styles.muted} numberOfLines={1}>{formatPeso(r.cost)}</Text> },
    ...(isManager
      ? []
      : ([
          { header: 'Profit', key: 'profit', width: 1.05, lines: 1, render: (r) => <Text style={{ color: colors.good, fontWeight: '700' }}>{formatPeso(r.price - r.cost)}</Text> },
          { header: 'Margin', key: 'margin', width: 1.05, lines: 1, render: (r) => formatPercent(margin(r.cost, r.price)) },
        ] as Column<Product>[])),
    { header: 'Status', key: 'status', width: 1.7, lines: 1, render: (r) => (
        <Pressable onPress={() => {
          updateProduct({ ...r, status: r.status === 'available' ? 'sold-out' : 'available' });
          toast(r.status === 'available' ? 'Marked as sold out' : 'Marked as available');
        }}>
          <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
        </Pressable>
      ) },
    { header: 'Actions', key: 'edit', width: 1.6, lines: 1, render: (r) => (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={() => openEdit(r)}><Badge variant="brand">Edit</Badge></Pressable>
          <Pressable onPress={() => confirmDelete(r)}><Badge variant="critical">Del</Badge></Pressable>
        </View>
      ) },
  ];

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: p.price, cost: p.cost, ingredients: p.ingredients, status: p.status, image: p.image ?? '' });
    setModalOpen(true);
  };
  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', category: 'Coffee', price: 0, cost: 0, ingredients: [], status: 'available', image: '' });
    setModalOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim(), image: (form.image ?? '').trim() || undefined };
    if (editing) updateProduct({ ...editing, ...payload });
    else addProduct(payload);
    setModalOpen(false);
    toast(editing ? 'Product updated' : 'Product added');
  };
  const confirmDelete = (p: Product) => setDeleteTarget(p);

  const openCategoryAdd = () => {
    setEditingCategory(null);
    setCatForm({ name: '', icon: '' });
    setCatError('');
    setCategoryModalOpen(true);
  };
  const openCategoryEdit = (c: Category) => {
    setEditingCategory(c);
    setCatForm({ name: c.name, icon: c.icon });
    setCatError('');
    setCategoryModalOpen(true);
  };
  const saveCategory = () => {
    if (!catForm.name.trim()) {
      setCatError('Category name is required.');
      return;
    }
    if (editingCategory) updateCategory({ ...editingCategory, name: catForm.name.trim(), icon: catForm.icon.trim() || editingCategory.icon });
    else addCategory(catForm.name.trim(), catForm.icon.trim());
    setCategoryModalOpen(false);
    toast(editingCategory ? 'Category updated' : 'Category added');
  };
  const handleDeleteCategory = (c: Category) => setDeleteCat(c);

  const profRows = products.map((p) => {
    const sold = topById.get(p.id)?.sold ?? 0;
    const profit = p.price - p.cost;
    const quadrant =
      sold >= 30 && profit >= 40
        ? { label: '⭐ Best', variant: 'good' }
        : sold >= 30
          ? { label: '⚠ Review', variant: 'amber' }
          : profit >= 40
            ? { label: '📈 Market', variant: 'blue' }
            : { label: '○ Watch', variant: 'slate' };
    return { ...p, sold, profit, quadrant };
  }).sort((a, b) => b.sold - a.sold);

  return (
    <Screen
      title="Products & Menu"
      subtitle={`${products.length} items · ${categories.length} categories`}
      sticky={
        <>
          <SegmentedTabs tabs={tabs} active={tab} onChange={setTab} />
        </>
      }
      floating={
        <Fab
          options={[
            { label: 'Add Product', icon: Coffee, onPress: openAdd },
            ...(tab === 'categories' ? [{ label: 'Add Category', icon: FolderPlus, onPress: openCategoryAdd }] : []),
          ]}
        />
      }
    >
      {tab === 'products' && (
        <Card title="Product List" subtitle="Tap status to toggle availability">
          <FormField label="" placeholder="Search products…" value={search} onChangeText={setSearch} />
          <Table columns={productCols} rows={filtered} rowKey={(r) => r.id} fadingKeys={removingKeys} />
        </Card>
      )}

      {tab === 'categories' && (
        <>
          <Card title="Categories" subtitle="Revenue share this week">
            {categories.map((c) => {
              const count = products.filter((p) => p.category === c.name).length;
              const revenue = catSales.get(c.name) ?? 0;
              return (
                <View key={c.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bold}>{c.icon} {c.name}</Text>
                    <Text style={styles.muted}>{count} items · {formatPeso(revenue, { compact: true })}</Text>
                  </View>
                  <Pressable onPress={() => openCategoryEdit(c)}><Badge variant="brand">Edit</Badge></Pressable>
                  <Pressable onPress={() => handleDeleteCategory(c)}><Badge variant="critical">Del</Badge></Pressable>
                </View>
              );
            })}
            {catError ? <Text style={{ color: colors.critical, fontSize: 12, marginTop: gap.sm }}>{catError}</Text> : null}
          </Card>
        </>
      )}

      {!isManager && tab === 'profitability' && (
        <Card title="Product Profitability" subtitle="⭐ Best · ⚠ Review · 📈 Market · ○ Watch">
          <Table
            columns={[
              { header: 'Product', key: 'name', width: 1.6, lines: 2, render: (r) => <Text style={[styles.bold, styles.textCenter]}>{r.name}</Text> },
              { header: 'Price', key: 'price', width: 0.9, lines: 1, render: (r) => formatPeso(r.price) },
              { header: 'Cost', key: 'cost', width: 0.9, lines: 1, render: (r) => <Text style={styles.muted} numberOfLines={1}>{formatPeso(r.cost)}</Text> },
              { header: 'Profit', key: 'profit', width: 0.9, lines: 1, render: (r) => <Text style={{ color: colors.good, fontWeight: '700' }} numberOfLines={1}>{formatPeso(r.profit)}</Text> },
              { header: 'Margin', key: 'margin', width: 0.9, lines: 1, render: (r) => formatPercent(margin(r.cost, r.price)) },
              { header: 'Sold (wk)', key: 'sold', width: 0.9, lines: 1 },
              { header: 'Quadrant', key: 'quadrant', width: 1.2, lines: 1, render: (r) => <Badge variant={r.quadrant.variant}>{r.quadrant.label}</Badge> },
            ]}
            rows={profRows}
            rowKey={(r) => r.id}
          />
        </Card>
      )}

      <AnimatedModal visible={modalOpen} onClose={() => setModalOpen(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>{editing ? `Edit ${editing.name}` : 'Add Product'}</Text>
          <FormField label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="e.g. Iced Vanilla Latte" />
          <Text style={styles.miniLabel}>Category</Text>
          <View style={styles.chipRow}>
            {categoryNames.map((c) => (
              <Pressable key={c} onPress={() => setForm({ ...form, category: c as CategoryName })} style={[styles.chip, form.category === c && styles.chipActive]}>
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="Price (₱)" keyboardType="numeric" value={form.price ? String(form.price) : ''} onChangeText={(v) => setForm({ ...form, price: Number(v) })} />
            </View>
            <View style={{ flex: 1, marginLeft: gap.md }}>
              <FormField label="Cost (₱)" keyboardType="numeric" value={form.cost ? String(form.cost) : ''} onChangeText={(v) => setForm({ ...form, cost: Number(v) })} />
            </View>
          </View>
          <Text style={styles.miniLabel}>Availability</Text>
          <View style={styles.chipRow}>
            {(['available', 'sold-out', 'hidden'] as ProductStatus[]).map((s) => (
              <Pressable key={s} onPress={() => setForm({ ...form, status: s })} style={[styles.chip, form.status === s && styles.chipActive]}>
                <Text style={[styles.chipText, form.status === s && styles.chipTextActive]}>{STATUS_LABEL[s]}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={save} disabled={!form.name.trim()}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>
      </AnimatedModal>

      <AnimatedModal visible={categoryModalOpen} onClose={() => setCategoryModalOpen(false)}>
        <Text style={styles.modalTitle}>{editingCategory ? `Edit ${editingCategory.name}` : 'Add Category'}</Text>
        <FormField label="Category Name" value={catForm.name} onChangeText={(name) => setCatForm({ ...catForm, name })} placeholder="e.g. Merch" />
        <FormField label="Icon (emoji)" value={catForm.icon} onChangeText={(icon) => setCatForm({ ...catForm, icon })} placeholder="e.g. 🛍️" />
        {catError ? <Text style={{ color: colors.critical, fontSize: 12 }}>{catError}</Text> : null}
        <View style={styles.modalActions}>
          <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setCategoryModalOpen(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={saveCategory}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </AnimatedModal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete product"
        message={deleteTarget ? `Remove "${deleteTarget.name}" from the menu?` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setRemovingKeys((prev) => new Set(prev).add(deleteTarget.id));
          setTimeout(() => {
            deleteProduct(deleteTarget.id);
            setRemovingKeys((prev) => {
              const next = new Set(prev);
              next.delete(deleteTarget.id);
              return next;
            });
            setDeleteTarget(null);
            toast('Product deleted');
          }, 200);
        }}
      />

      <ConfirmDialog
        visible={!!deleteCat}
        title="Delete category"
        message={deleteCat ? `Remove "${deleteCat.name}"?` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleteCat(null)}
        onConfirm={() => {
          if (!deleteCat) return;
          const ok = deleteCategory(deleteCat.id);
          if (!ok) setCatError(`Cannot delete "${deleteCat.name}" — it still has products assigned to it.`);
          else toast('Category deleted');
          setDeleteCat(null);
        }}
      />

    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: gap.sm },
  textCenter: { textAlign: 'center' },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  modalWrap: { flex: 1, backgroundColor: 'rgba(61,48,42,0.4)', justifyContent: 'center', padding: gap.lg },
  modalScroll: { flexGrow: 0 },
  modal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: gap.lg },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.onCard, marginBottom: gap.md },
  miniLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.onCardSub, marginBottom: 6, marginTop: gap.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: gap.md },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.sub },
  chipTextActive: { color: '#fff' },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: gap.sm, marginBottom: gap.sm },
  hint: { fontSize: 13, color: colors.onCardSub, marginBottom: gap.md },
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