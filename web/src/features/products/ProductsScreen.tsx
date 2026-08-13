import { useMemo, useState } from 'react';
import {
  formatPercent,
  formatPeso,
  getCategoryBreakdown,
  getDateRange,
  getTopProducts,
  inventory,
  margin,
  type CategoryName,
  type Product,
  type ProductStatus,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';
import { ProgressBar } from '@/components/charts';

const TABS = [
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'cost', label: 'Product Cost' },
  { value: 'profitability', label: 'Profitability' },
];

const STATUS_VARIANT: Record<string, string> = { available: 'good', 'sold-out': 'critical', hidden: 'slate' };
const STATUS_LABEL: Record<string, string> = { available: 'Available', 'sold-out': 'Sold Out', hidden: 'Hidden' };
const CATEGORY_NAMES = ['Coffee', 'Non-Coffee', 'Tea', 'Pastries', 'Desserts', 'Snacks', 'Add-ons'];

const nameOf = new Map(inventory.map((i) => [i.id, { name: i.name, unit: i.unit }]));
const EMPTY_FORM: Omit<Product, 'id'> = { name: '', category: 'Coffee', price: 0, cost: 0, ingredients: [], status: 'available' };

export default function ProductsScreen() {
  const { products, categories, transactions, addProduct, updateProduct, deleteProduct } = useData();
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY_FORM);

  const range = useMemo(() => getDateRange('week'), []);
  const top = useMemo(() => getTopProducts(transactions, products, range, 'sales', 100), [range, products, transactions]);
  const topById = useMemo(() => new Map(top.map((t) => [t.productId, t])), [top]);
  const catBreakdown = useMemo(() => getCategoryBreakdown(transactions, products, range), [range, products, transactions]);
  const catSales = useMemo(() => new Map(catBreakdown.map((c) => [c.category, c.sales])), [catBreakdown]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const productColumns: Column<Product>[] = [
    { header: 'Product', key: 'name', render: (r) => (
        <div>
          <span className="font-medium text-stone-100">{r.name}</span>
          <p className="text-xs text-stone-300">{r.id}</p>
        </div>
      ) },
    { header: 'Category', key: 'category', render: (r) => <span className="text-stone-200">{r.category}</span> },
    { header: 'Price', key: 'price', className: 'text-right', render: (r) => formatPeso(r.price) },
    { header: 'Cost', key: 'cost', className: 'text-right', render: (r) => <span className="text-stone-300">{formatPeso(r.cost)}</span> },
    { header: 'Profit', key: 'profit', className: 'text-right', render: (r) => <span className="font-medium text-emerald-300">{formatPeso(r.price - r.cost)}</span> },
    { header: 'Margin', key: 'margin', className: 'text-right', render: (r) => <b>{formatPercent(margin(r.cost, r.price))}</b> },
    { header: 'Status', key: 'status', render: (r) => (
        <button onClick={() => updateProduct({ ...r, status: r.status === 'available' ? 'sold-out' : 'available' })} title="Toggle availability">
          <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
        </button>
      ) },
    { header: 'Actions', key: 'actions', render: (r) => (
        <div className="flex gap-1">
          <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => openEdit(r)}>Edit</button>
          <button className="btn btn-ghost !px-2 !py-1 text-xs text-rose-300 hover:bg-rose-50" onClick={() => deleteProduct(r.id)}>Del</button>
        </div>
      ) },
  ];

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: p.price, cost: p.cost, ingredients: p.ingredients, status: p.status });
    setModalOpen(true);
  };
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing) updateProduct({ ...editing, ...form });
    else addProduct({ ...form, ingredients: [] });
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

  const costRows = products.flatMap((p) =>
    p.ingredients.map((ing) => {
      const info = nameOf.get(ing.ingredientId);
      const item = inventory.find((i) => i.id === ing.ingredientId);
      return {
        id: `${p.id}-${ing.ingredientId}`,
        product: p.name,
        ingredient: info?.name ?? ing.ingredientId,
        qty: ing.qty,
        unit: info?.unit ?? '',
        unitCost: item?.costPerUnit ?? 0,
        cost: (item?.costPerUnit ?? 0) * ing.qty,
      };
    }),
  );

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
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        }
      />
      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'products' && (
        <Card title="Product List" subtitle="Click a status badge to toggle availability"
          action={<input className="input w-56" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />}>
          <Table columns={productColumns} rows={filtered} rowKey={(r) => r.id} />
        </Card>
      )}

      {tab === 'categories' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Categories" subtitle="Products per category">
            <Table
              columns={[
                { header: 'Category', key: 'name', render: (r) => <span className="font-medium text-stone-100">{r.icon} {r.name}</span> },
                { header: 'Products', key: 'count', className: 'text-right' },
                { header: 'Revenue (wk)', key: 'revenue', className: 'text-right', render: (r) => formatPeso(r.revenue, { compact: true }) },
                { header: 'Share', key: 'share', className: 'text-right', render: (r) => formatPercent(r.share, 0) },
                { header: 'Best Seller', key: 'best', render: (r) => <span className="text-stone-200">{r.best?.name ?? '—'}</span> },
              ]}
              rows={categoryRows}
              rowKey={(r) => r.id}
            />
          </Card>
          <Card title="Category Revenue Share" subtitle="This week">
            <div className="space-y-4">
              {catBreakdown.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-stone-200">{c.category}</span>
                    <span className="font-medium text-stone-100">{formatPercent(c.share, 0)}</span>
                  </div>
                  <ProgressBar value={c.share * 100} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'cost' && (
        <Card title="Product Cost Breakdown" subtitle="Ingredient-level production cost per serving">
          <Table
            columns={[
              { header: 'Product', key: 'product', render: (r) => <span className="font-medium text-stone-100">{r.product}</span> },
              { header: 'Ingredient', key: 'ingredient' },
              { header: 'Qty / Serve', key: 'qty', className: 'text-right', render: (r) => `${r.qty} ${r.unit}` },
              { header: 'Unit Cost', key: 'unitCost', className: 'text-right', render: (r) => formatPeso(r.unitCost) },
              { header: 'Cost / Serve', key: 'cost', className: 'text-right', render: (r) => <b>{formatPeso(r.cost)}</b> },
            ]}
            rows={costRows}
            rowKey={(r) => r.id}
          />
        </Card>
      )}

      {tab === 'profitability' && (
        <div className="space-y-4">
          <Card title="Product Profitability" subtitle="High-selling + high-profit are best products; high-selling + low-profit need pricing review">
            <Table
              columns={[
                { header: 'Product', key: 'name', render: (r) => <span className="font-medium text-stone-100">{r.name}</span> },
                { header: 'Price', key: 'price', className: 'text-right', render: (r) => formatPeso(r.price) },
                { header: 'Cost', key: 'cost', className: 'text-right', render: (r) => <span className="text-stone-300">{formatPeso(r.cost)}</span> },
                { header: 'Profit', key: 'profit', className: 'text-right', render: (r) => <span className="font-medium text-emerald-300">{formatPeso(r.profit)}</span> },
                { header: 'Margin', key: 'margin', className: 'text-right', render: (r) => <b>{formatPercent(margin(r.cost, r.price))}</b> },
                { header: 'Sold (wk)', key: 'sold', className: 'text-right' },
                { header: 'Quadrant', key: 'quadrant', render: (r) => <Badge variant={r.quadrant.variant}>{r.quadrant.label}</Badge> },
              ]}
              rows={profitabilityRows}
              rowKey={(r) => r.id}
            />
          </Card>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Legend icon="⭐" label="Best" detail="High sales + high profit" tone="text-emerald-300" />
            <Legend icon="⚠️" label="Review" detail="High sales, low profit" tone="text-amber-300" />
            <Legend icon="📈" label="Market" detail="Low sales, high profit" tone="text-blue-300" />
            <Legend icon="○" label="Watch" detail="Low sales + low profit" tone="text-stone-300" />
          </div>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? `Edit ${editing.name}` : 'Add Product'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <Field label="Name">
            <input className="input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Iced Vanilla Latte" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className="input w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CategoryName })}>
                {CATEGORY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
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
          {form.price > 0 && (
            <p className="text-xs text-stone-500">
              Profit <b className="text-emerald-600">{formatPeso(form.price - form.cost)}</b> · Margin{' '}
              <b>{formatPercent(margin(form.cost, form.price))}</b>
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>Save</button>
          </div>
        </div>
      </Modal>
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
      <p className="text-xs text-stone-300">{detail}</p>
    </div>
  );
}
