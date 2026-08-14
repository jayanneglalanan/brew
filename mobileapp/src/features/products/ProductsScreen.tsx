import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  categories,
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getDateRange,
  getTopProducts,
  margin,
  type CategoryName,
  type Product,
} from 'mock-data';
import { useData } from '../../data/DataContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import FormField from '../../components/ui/FormField';
import Table, { type Column } from '../../components/ui/Table';
import { colors, gap, radius } from '../../theme';

const TABS = [
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'cost', label: 'Cost' },
  { value: 'profitability', label: 'Profitability' },
];

const STATUS_VARIANT: Record<string, string> = { available: 'good', 'sold-out': 'critical', hidden: 'slate' };
const CATEGORY_NAMES: CategoryName[] = ['Coffee', 'Non-Coffee', 'Tea', 'Pastries', 'Desserts', 'Snacks', 'Add-ons'];

type Form = Omit<Product, 'id'>;

export default function ProductsScreen() {
  const { products, transactions, addProduct, updateProduct, deleteProduct } = useData();
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>({ name: '', category: 'Coffee', price: 0, cost: 0, ingredients: [], status: 'available' });

  const range = useMemo(() => getDateRange('week'), []);
  const top = useMemo(() => getTopProducts(transactions, products, range, 'sales', 100), [products, transactions, range]);
  const topById = useMemo(() => new Map(top.map((t) => [t.productId, t])), [top]);
  const cat = useMemo(() => getCategoryBreakdown(transactions, products, range), [products, transactions, range]);
  const catSales = useMemo(() => new Map(cat.map((c) => [c.category, c.sales])), [cat]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const productCols: Column<Product>[] = [
    { header: 'Product', key: 'name', render: (r) => (
        <View>
          <Text style={styles.bold}>{r.name}</Text>
          <Text style={styles.muted}>{r.category}</Text>
        </View>
      ) },
    { header: 'Price', key: 'price', align: 'right', render: (r) => formatPeso(r.price) },
    { header: 'Profit', key: 'profit', align: 'right', render: (r) => <Text style={{ color: colors.good, fontWeight: '700' }}>{formatPeso(r.price - r.cost)}</Text> },
    { header: 'Status', key: 'status', render: (r) => (
        <Pressable onPress={() => updateProduct({ ...r, status: r.status === 'available' ? 'sold-out' : 'available' })}>
          <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
        </Pressable>
      ) },
    { header: '', key: 'edit', render: (r) => (
        <Pressable onPress={() => openEdit(r)}>
          <Badge variant="brand">Edit</Badge>
        </Pressable>
      ) },
  ];

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: p.price, cost: p.cost, ingredients: p.ingredients, status: p.status });
    setModalOpen(true);
  };
  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', category: 'Coffee', price: 0, cost: 0, ingredients: [], status: 'available' });
    setModalOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing) updateProduct({ ...editing, ...form });
    else addProduct({ ...form, ingredients: [] });
    setModalOpen(false);
  };
  const confirmDelete = (p: Product) => {
    Alert.alert('Delete product', `Remove "${p.name}" from the menu?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(p.id) },
    ]);
  };

  const costRows = products.flatMap((p) =>
    p.ingredients.map((ing) => ({
      id: `${p.id}-${ing.ingredientId}`,
      product: p.name,
      ingredient: ing.ingredientId,
      qty: `${ing.qty}`,
    })),
  );

  const profRows = products.map((p) => {
    const sold = topById.get(p.id)?.sold ?? 0;
    const profit = p.price - p.cost;
    return { ...p, sold, profit };
  }).sort((a, b) => b.sold - a.sold);

  return (
    <Screen
      title="Products & Menu"
      subtitle={`${products.length} items · ${categories.length} categories`}
      sticky={
        <>
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Add Product</Text>
          </Pressable>
          <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
        </>
      }
    >
      {tab === 'products' && (
        <Card title="Product List" subtitle="Tap status to toggle availability">
          <FormField label="" placeholder="Search products…" value={search} onChangeText={setSearch} />
          <Table columns={productCols} rows={filtered} rowKey={(r) => r.id} />
        </Card>
      )}

      {tab === 'categories' && (
        <Card title="Categories" subtitle="Revenue share this week">
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.name).length;
            const revenue = catSales.get(c.name) ?? 0;
            return (
              <View key={c.id} style={styles.row}>
                <Text style={styles.bold}>{c.icon} {c.name}</Text>
                <Text style={styles.muted}>{count} items</Text>
                <Text style={styles.bold}>{formatPeso(revenue, { compact: true })}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {tab === 'cost' && (
        <Card title="Product Cost Breakdown" subtitle="Ingredient cost per serving">
          <Table
            columns={[
              { header: 'Product', key: 'product', render: (r) => <Text style={styles.bold}>{r.product}</Text> },
              { header: 'Ingredient', key: 'ingredient', render: (r) => <Text style={styles.muted}>{r.ingredient}</Text> },
              { header: 'Per Serve', key: 'qty', align: 'right', render: (r) => <Text style={styles.muted}>{r.qty}</Text> },
            ]}
            rows={costRows}
            rowKey={(r) => r.id}
          />
        </Card>
      )}

      {tab === 'profitability' && (
        <Card title="Product Profitability" subtitle="⭐ Best · ⚠ Review · 📈 Market · ○ Watch">
          <Table
            columns={[
              { header: 'Product', key: 'name', render: (r) => <Text style={styles.bold}>{r.name}</Text> },
              { header: 'Profit', key: 'profit', align: 'right', render: (r) => <Text style={{ color: colors.good, fontWeight: '700' }}>{formatPeso(r.profit)}</Text> },
              { header: 'Margin', key: 'margin', align: 'right', render: (r) => formatPercent(margin(r.cost, r.price)) },
              { header: 'Sold (wk)', key: 'sold', align: 'right' },
            ]}
            rows={profRows}
            rowKey={(r) => r.id}
          />
        </Card>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? `Edit ${editing.name}` : 'Add Product'}</Text>
            <FormField label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="e.g. Iced Vanilla Latte" />
            <Text style={styles.miniLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORY_NAMES.map((c) => (
                <Pressable key={c} onPress={() => setForm({ ...form, category: c })} style={[styles.chip, form.category === c && styles.chipActive]}>
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
            {form.price > 0 ? (
              <Text style={styles.hint}>
                Profit <Text style={{ color: colors.good, fontWeight: '700' }}>{formatPeso(form.price - form.cost)}</Text> · Margin{' '}
                <Text style={{ fontWeight: '700' }}>{formatPercent(margin(form.cost, form.price))}</Text>
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={save} disabled={!form.name.trim()}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
            {editing ? (
              <Pressable onPress={() => { setModalOpen(false); confirmDelete(editing); }}>
                <Text style={styles.deleteText}>Delete product</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginBottom: gap.lg },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: gap.sm },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  modalWrap: { flex: 1, backgroundColor: 'rgba(61,48,42,0.4)', justifyContent: 'center', padding: gap.lg },
  modal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: gap.lg },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.onCard, marginBottom: gap.md },
  miniLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.onCardSub, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: gap.md },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.sub },
  chipTextActive: { color: '#fff' },
  hint: { fontSize: 13, color: colors.onCardSub, marginBottom: gap.md },
  modalActions: { flexDirection: 'row', gap: gap.sm, marginTop: gap.sm },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F4EDE3' },
  cancelText: { color: colors.sub, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.brand },
  saveText: { color: '#fff', fontWeight: '700' },
  deleteText: { color: colors.critical, textAlign: 'center', marginTop: gap.md, fontWeight: '600', fontSize: 13 },
});
