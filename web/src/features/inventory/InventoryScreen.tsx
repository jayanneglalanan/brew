import { useMemo, useState } from 'react';
import {
  formatDateTime,
  formatNumber,
  formatPeso,
  getDateRange,
  getInventorySummary,
  getStockMovement,
  getStockStatusRows,
  getWastage,
  type RangeFilter,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'items', label: 'Stock Items' },
  { value: 'movement', label: 'Stock Movement' },
  { value: 'low', label: 'Low Stock' },
  { value: 'wastage', label: 'Wastage' },
];

const STATUS_VARIANT: Record<string, string> = { good: 'good', low: 'low', critical: 'critical' };
const STATUS_LABEL: Record<string, string> = { good: '🟢 Good', low: '🟡 Low', critical: '🔴 Critical' };
const TYPE_LABEL: Record<string, string> = { purchase: 'Purchase', wastage: 'Wastage', damaged: 'Damaged', adjustment: 'Adjustment' };

function statusColor(status: string) {
  if (status === 'critical') return 'text-rose-600';
  if (status === 'low') return 'text-amber-600';
  return 'text-emerald-600';
}

export default function InventoryScreen() {
  const { inventory, products, transactions, stockMovements, recordMovement } = useData();
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState<RangeFilter>('week');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mvType, setMvType] = useState<'purchase' | 'wastage' | 'damaged' | 'adjustment'>('wastage');
  const [mvItem, setMvItem] = useState('');
  const [mvQty, setMvQty] = useState(1);
  const [mvNote, setMvNote] = useState('');

  const range = getDateRange(filter);

  const summary = useMemo(() => getInventorySummary(inventory), [inventory]);
  const statusRows = useMemo(() => getStockStatusRows(inventory), [inventory]);
  const movement = useMemo(
    () => getStockMovement(inventory, products, transactions, stockMovements, range),
    [inventory, products, transactions, stockMovements, range],
  );
  const wastage = useMemo(() => getWastage(stockMovements, inventory, range), [stockMovements, inventory, range]);
  const lowRows = statusRows.filter((r) => r.status !== 'good');
  const filteredItems = statusRows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const itemColumns: Column<(typeof statusRows)[number]>[] = [
    { header: 'Ingredient', key: 'name', render: (r) => <span className="font-medium text-stone-800">{r.name}</span> },
    { header: 'Current', key: 'current', className: 'text-right', render: (r) => <b className={statusColor(r.status)}>{r.current}</b> },
    { header: 'Unit', key: 'unit' },
    { header: 'Reorder Level', key: 'reorderLevel', className: 'text-right' },
    { header: 'Status', key: 'status', render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
  ];

  const movementColumns: Column<(typeof movement)[number]>[] = [
    { header: 'Item', key: 'name', render: (r) => <span className="font-medium text-stone-800">{r.name}</span> },
    { header: 'Purchases', key: 'purchases', className: 'text-right', render: (r) => <span className="text-emerald-600">+{formatNumber(r.purchases)}</span> },
    { header: 'Sales Consumption', key: 'salesConsumption', className: 'text-right', render: (r) => `-${formatNumber(r.salesConsumption)}` },
    { header: 'Wastage', key: 'wastage', className: 'text-right', render: (r) => <span className="text-amber-600">-{formatNumber(r.wastage)}</span> },
    { header: 'Damaged', key: 'damaged', className: 'text-right', render: (r) => <span className="text-rose-600">-{formatNumber(r.damaged)}</span> },
    { header: 'Adjustments', key: 'adjustments', className: 'text-right', render: (r) => <span className="text-blue-600">{r.adjustments > 0 ? '+' : ''}{r.adjustments}</span> },
    { header: 'Current Stock', key: 'currentStock', className: 'text-right', render: (r) => <b>{r.currentStock} {r.unit}</b> },
  ];

  const wasteColumns: Column<(typeof wastage)[number]>[] = [
    { header: 'Item', key: 'item', render: (r) => <span className="font-medium text-stone-800">{r.item}</span> },
    { header: 'Type', key: 'type', render: (r) => <Badge variant={r.type === 'damaged' ? 'critical' : 'low'}>{TYPE_LABEL[r.type]}</Badge> },
    { header: 'Qty', key: 'qty', className: 'text-right', render: (r) => <b className="text-rose-600">-{r.qty} {r.unit}</b> },
    { header: 'Note', key: 'note' },
    { header: 'Date', key: 'timestamp', render: (r) => formatDateTime(r.timestamp) },
  ];

  const saveMovement = () => {
    const item = inventory.find((i) => i.id === mvItem);
    if (!item || !mvQty || mvQty <= 0) return;
    const qty = mvType === 'adjustment' ? mvQty : mvType === 'purchase' ? mvQty : -mvQty;
    recordMovement({ type: mvType, itemId: item.id, qty, note: mvNote || `${TYPE_LABEL[mvType]} entry` });
    setModalOpen(false);
    setMvNote('');
    setMvQty(1);
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${summary.total} items · ${formatPeso(summary.inventoryValue, { compact: true })} stock value`}
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Record Movement</button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="flex items-center gap-2">
          {tab === 'items' && (
            <input className="input w-56" placeholder="Search stock items…" value={search} onChange={(e) => setSearch(e.target.value)} />
          )}
          {tab !== 'items' && (
            <select value={filter} onChange={(e) => setFilter(e.target.value as RangeFilter)} className="input">
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          )}
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total Items" value={formatNumber(summary.total)} icon="📦" accent="slate" />
            <StatCard label="Healthy Stock" value={formatNumber(summary.healthy)} icon="🟢" accent="green" />
            <StatCard label="Low Stock" value={formatNumber(summary.low)} icon="🟡" accent="amber" />
            <StatCard label="Critical Stock" value={formatNumber(summary.critical)} icon="🔴" accent="red" />
            <StatCard label="Inventory Value" value={formatPeso(summary.inventoryValue, { compact: true })} icon="💵" />
          </div>
          <Card title="Inventory Status" subtitle="Items at or below their reorder level need attention" className="mt-4">
            <Table columns={itemColumns} rows={statusRows} rowKey={(r) => r.itemId} />
          </Card>
        </>
      )}

      {tab === 'items' && (
        <Card title="All Stock Items">
          <Table columns={itemColumns} rows={filteredItems} rowKey={(r) => r.itemId} />
        </Card>
      )}

      {tab === 'movement' && (
        <Card title="Stock Movement" subtitle={range.label}>
          <Table columns={movementColumns} rows={movement} rowKey={(r) => r.itemId} />
        </Card>
      )}

      {tab === 'low' && (
        <Card title="Low & Critical Stock" subtitle={`${lowRows.length} items need attention`}>
          {lowRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">All stock levels are healthy 🎉</p>
          ) : (
            <Table columns={itemColumns} rows={lowRows} rowKey={(r) => r.itemId} />
          )}
        </Card>
      )}

      {tab === 'wastage' && (
        <Card title="Wastage & Damaged Items" subtitle={range.label}>
          <Table columns={wasteColumns} rows={wastage} rowKey={(r) => r.id} />
        </Card>
      )}

      <Modal open={modalOpen} title="Record Stock Movement" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label mb-1 block">Movement Type</label>
            <div className="flex flex-wrap gap-1.5">
              {(['purchase', 'wastage', 'damaged', 'adjustment'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMvType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    mvType === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label mb-1 block">Item</label>
            <select className="input w-full" value={mvItem} onChange={(e) => setMvItem(e.target.value)}>
              <option value="">Select ingredient…</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>{i.name} · {i.currentStock} {i.unit} in stock</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1 block">
              Quantity ({mvType === 'adjustment' ? 'signed: +add / −remove' : mvType === 'purchase' ? 'added' : 'removed'})
            </label>
            <input type="number" className="input w-full" value={mvQty || ''} onChange={(e) => setMvQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="label mb-1 block">Note</label>
            <input className="input w-full" value={mvNote} onChange={(e) => setMvNote(e.target.value)} placeholder="e.g. Expired stock" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveMovement} disabled={!mvItem || !mvQty}>Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
