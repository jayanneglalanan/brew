import { useMemo, useState } from 'react';
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
import { useData } from '@/app/DataContext';
import { useAuth } from '@/app/AuthContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';
import { ProgressBar } from '@/components/charts';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const TABS = [
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'profitability', label: 'Profitability' },
];

const STATUS_VARIANT: Record<string, string> = { available: 'good', 'sold-out': 'critical', hidden: 'slate' };
const STATUS_LABEL: Record<string, string> = { available: 'Available', 'sold-out': 'Sold Out', hidden: 'Hidden' };

const EMPTY_FORM: Omit<Product, 'id'> = { name: '', category: 'Coffee', price: 0, cost: 0, ingredients: [], status: 'available', image: '' };

export default function ProductsScreen() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const tabs = isManager ? TABS.filter((t) => t.value !== 'profitability') : TABS;
  const { products, categories, transactions, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useData();
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', icon: '' });
  const [catError, setCatError] = useState('');

  const range = useMemo(() => getDateRange('week'), []);
  const top = useMemo(() => getTopProducts(transactions, products, range, 'sales', 100), [range, products, transactions]);
  const topById = useMemo(() => new Map(top.map((t) => [t.productId, t])), [top]);
  const catBreakdown = useMemo(() => getCategoryBreakdown(transactions, products, range), [range, products, transactions]);
  const catSales = useMemo(() => new Map(catBreakdown.map((c) => [c.category, c.sales])), [catBreakdown]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const productColumns: Column<Product>[] = [
    { header: 'Product', key: 'name', className: 'allow-wrap', render: (r) => <span className="font-medium text-stone-800">{r.name}</span> },
    { header: 'Category', key: 'category', render: (r) => <span className="text-stone-700">{r.category}</span> },
    { header: 'Price', key: 'price', render: (r) => formatPeso(r.price) },
    { header: 'Cost', key: 'cost', render: (r) => <span className="text-stone-500">{formatPeso(r.cost)}</span> },
    ...(isManager
      ? []
      : ([
          { header: 'Profit', key: 'profit', render: (r) => <span className="font-medium text-emerald-600">{formatPeso(r.price - r.cost)}</span> },
          { header: 'Margin', key: 'margin', render: (r) => <b>{formatPercent(margin(r.cost, r.price))}</b> },
        ] as Column<Product>[])),
    { header: 'Status', key: 'status', render: (r) => (
        <button onClick={() => updateProduct({ ...r, status: r.status === 'available' ? 'sold-out' : 'available' })} title="Toggle availability">
          <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
        </button>
      ) },
    { header: 'Actions', key: 'actions', render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => openEdit(r)} title="Edit"><Pencil size={14} /></button>
          <button className="btn btn-ghost !px-2 !py-1 text-xs text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(r)} title="Delete"><Trash2 size={14} /></button>
        </div>
      ) },
  ];

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: p.price, cost: p.cost, ingredients: p.ingredients, status: p.status, image: p.image ?? '' });
    setModalOpen(true);
  };
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim(), image: form.image?.trim() || undefined };
    if (editing) updateProduct({ ...editing, ...payload });
    else addProduct(payload);
    setModalOpen(false);
  };

  const categoryRows = categories.map((c) => {
    const cats = products.filter((p) => p.category === c.name);
    const revenue = catSales.get(c.name) ?? 0;
    return {
      id: c.id,
      icon: c.icon,
      name: c.name,
      count: cats.length,
      revenue,
      share: catBreakdown.reduce((s, b) => s + b.sales, 0) ? revenue / catBreakdown.reduce((s, b) => s + b.sales, 0) : 0,
      best: [...cats].sort((a, b) => (topById.get(b.id)?.sold ?? 0) - (topById.get(a.id)?.sold ?? 0))[0],
    };
  });

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
  };
  const handleDeleteCategory = (c: Category) => {
    const ok = deleteCategory(c.id);
    if (!ok) setCatError(`Cannot delete "${c.name}" — it still has products assigned to it.`);
  };

  const profitabilityRows = products.map((p) => {
    const perf = topById.get(p.id);
    const profit = p.price - p.cost;
    const sold = perf?.sold ?? 0;
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
    <div>
      <PageHeader
        title="Products & Menu"
        subtitle={`${products.length} menu items · ${categories.length} categories`}
        action={
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Product</button>
        }
      />
      <div className="mb-5">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'products' && (
        <Card title="Product List" subtitle="Click a status badge to toggle availability"
          action={<input className="input w-56" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />}>
          <Table columns={productColumns} rows={filtered} rowKey={(r) => r.id} />
        </Card>
      )}

      {tab === 'categories' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Categories" subtitle="Manage product categories"
            action={
              <button className="btn btn-primary !px-2.5 !py-1.5 text-xs" onClick={openCategoryAdd}><Plus size={14} /> Add Category</button>
            }>
            <div className="space-y-2">
              {categoryRows.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-2.5">
                  <span className="text-lg">{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-800">{r.name}</p>
                    <p className="text-xs text-stone-500">{r.count} products · {formatPeso(r.revenue, { compact: true })} this week</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => openCategoryEdit(categories.find((c) => c.id === r.id)!)} title="Edit"><Pencil size={13} /></button>
                    <button className="btn btn-ghost !px-2 !py-1 text-xs text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteCategory(categories.find((c) => c.id === r.id)!)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {catError && <p className="text-xs font-medium text-rose-600">{catError}</p>}
            </div>
          </Card>
          <Card title="Category Revenue Share" subtitle="This week">
            <div className="space-y-4">
              {catBreakdown.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-stone-700">{c.category}</span>
                    <span className="font-medium text-stone-800">{formatPercent(c.share, 0)}</span>
                  </div>
                  <ProgressBar value={c.share * 100} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {!isManager && tab === 'profitability' && (
        <div className="space-y-4">
          <Card title="Product Profitability" subtitle="High-selling + high-profit are best products; high-selling + low-profit need pricing review">
            <Table
              columns={[
                { header: 'Product', key: 'name', className: 'allow-wrap', render: (r) => <span className="font-medium text-stone-800">{r.name}</span> },
                { header: 'Price', key: 'price', render: (r) => formatPeso(r.price) },
                { header: 'Cost', key: 'cost', render: (r) => <span className="text-stone-500">{formatPeso(r.cost)}</span> },
                { header: 'Profit', key: 'profit', render: (r) => <span className="font-medium text-emerald-600">{formatPeso(r.profit)}</span> },
                { header: 'Margin', key: 'margin', render: (r) => <b>{formatPercent(margin(r.cost, r.price))}</b> },
                { header: 'Sold (wk)', key: 'sold' },
                { header: 'Quadrant', key: 'quadrant', render: (r) => <Badge variant={r.quadrant.variant}>{r.quadrant.label}</Badge> },
              ]}
              rows={profitabilityRows}
              rowKey={(r) => r.id}
            />
          </Card>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Legend icon="⭐" label="Best" detail="High sales + high profit" tone="text-emerald-600" />
            <Legend icon="⚠️" label="Review" detail="High sales, low profit" tone="text-amber-600" />
            <Legend icon="📈" label="Market" detail="Low sales, high profit" tone="text-blue-600" />
            <Legend icon="○" label="Watch" detail="Low sales + low profit" tone="text-stone-500" />
          </div>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? `Edit ${editing.name}` : 'Add Product'} onClose={() => setModalOpen(false)} width="max-w-2xl">
        <div className="space-y-4">
          <Field label="Product Name">
            <input className="input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Iced Vanilla Latte" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className="input w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CategoryName })}>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Availability">
              <select className="input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}>
                <option value="available">Available</option>
                <option value="sold-out">Sold Out</option>
                <option value="hidden">Hidden</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling Price (₱)">
              <input type="number" className="input w-full" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </Field>
            <Field label="Production Cost (₱)">
              <input type="number" className="input w-full" value={form.cost || ''} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>Save</button>
          </div>
        </div>
      </Modal>

      <Modal open={categoryModalOpen} title={editingCategory ? `Edit ${editingCategory.name}` : 'Add Category'} onClose={() => setCategoryModalOpen(false)} width="max-w-sm">
        <div className="space-y-4">
          <Field label="Category Name">
            <input className="input w-full" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Merch" />
          </Field>
          <Field label="Icon (emoji)">
            <input className="input w-full" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="e.g. 🛍️" />
          </Field>
          {catError && <p className="text-xs font-medium text-rose-600">{catError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost" onClick={() => setCategoryModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveCategory} disabled={!catForm.name.trim()}>Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product"
        message={`Remove "${deleteTarget?.name}" from the menu? This cannot be undone.`}
        onConfirm={() => {
          if (deleteTarget) deleteProduct(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function Legend({ icon, label, detail, tone }: { icon: string; label: string; detail: string; tone: string }) {
  return (
    <div className="card card-pad">
      <p className="text-lg">{icon}</p>
      <p className={`mt-1 text-sm font-semibold ${tone}`}>{label}</p>
      <p className="text-xs text-stone-500">{detail}</p>
    </div>
  );
}