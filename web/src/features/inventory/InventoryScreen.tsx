import { useMemo, useState } from 'react';
import {
  formatDateTime,
  formatNumber,
  formatPeso,
  getDateRange,
  getInventorySummary,
  getStockStatusRows,
  getWastage,
  type InventoryItem,
  type RangeFilter,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import { useAuth } from '@/app/AuthContext';
import { useRangeFilter } from '@/app/RangeFilterContext';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';
import { Eye, Package, Pencil, Plus, Trash2 } from 'lucide-react';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'items', label: 'Stock Items' },
  { value: 'history', label: 'Movement History' },
  { value: 'low', label: 'Low Stock' },
  { value: 'wastage', label: 'Wastage' },
];

const STATUS_VARIANT: Record<string, string> = { good: 'good', low: 'low', critical: 'critical' };
const STATUS_LABEL: Record<string, string> = { good: '🟢 Good', low: '🟡 Low', critical: '🔴 Critical' };
const TYPE_LABEL: Record<string, string> = { purchase: 'Purchase', sale: 'Sale', wastage: 'Wastage', damaged: 'Damaged', adjustment: 'Adjustment' };
const TYPE_VARIANT: Record<string, string> = { purchase: 'good', sale: 'blue', wastage: 'low', damaged: 'critical', adjustment: 'slate' };
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: '',
  unit: 'kg',
  currentStock: 0,
  reorderLevel: 0,
  criticalLevel: 0,
  costPerUnit: 0,
  category: '',
  supplier: '',
  expirationDate: '',
};

function statusColor(status: string) {
  if (status === 'critical') return 'text-rose-600';
  if (status === 'low') return 'text-amber-600';
  return 'text-emerald-600';
}

function ActionButtons({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={onView} title="View">
        <Eye size={14} />
      </button>
      <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={onEdit} title="Edit">
        <Pencil size={14} />
      </button>
      <button className="btn btn-ghost !px-2 !py-1 text-xs text-rose-600 hover:bg-rose-50" onClick={onDelete} title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
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
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const shared = useRangeFilter();
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState<RangeFilter>('week');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [mvType, setMvType] = useState<'wastage' | 'damaged'>('wastage');
  const [mvItem, setMvItem] = useState('');
  const [mvQty, setMvQty] = useState('1');
  const [mvNote, setMvNote] = useState('');

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState(EMPTY_FORM);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const range = isManager ? getDateRange(filter) : shared.range;

  const summary = useMemo(() => getInventorySummary(inventory), [inventory]);
  const statusRows = useMemo(() => getStockStatusRows(inventory), [inventory]);
  const wastage = useMemo(() => getWastage(stockMovements, inventory, range), [stockMovements, inventory, range]);
  const lowRows = statusRows.filter((r) => r.status !== 'good');

  const filteredItems = inventory.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const itemsPageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const visibleItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const nameById = useMemo(() => new Map(inventory.map((i) => [i.id, i.name])), [inventory]);
  const [historyPage, setHistoryPage] = useState(1);
  const history = useMemo(
    () => [...stockMovements].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [stockMovements],
  );
  const historyPageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const visibleHistory = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const itemColumns: Column<InventoryItem>[] = [
    { header: 'Stock Item', key: 'name', render: (r) => (
        <div>
          <span className="font-medium text-stone-800">{r.name}</span>
          <p className="text-xs text-stone-500">{r.id}</p>
        </div>
      ) },
    { header: 'Category', key: 'category', render: (r) => <span className="text-stone-700">{r.category || '—'}</span> },
    { header: 'Current', key: 'currentStock', className: 'text-right', render: (r) => (
        <b className={statusColor(r.currentStock <= r.criticalLevel ? 'critical' : r.currentStock <= r.reorderLevel ? 'low' : 'good')}>
          {formatNumber(r.currentStock)} {r.unit}
        </b>
      ) },
    { header: 'Status', key: 'status', render: (r) => {
        const status = r.currentStock <= r.criticalLevel ? 'critical' : r.currentStock <= r.reorderLevel ? 'low' : 'good';
        return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
      } },
    { header: 'Actions', key: 'actions', render: (r) => (
        <ActionButtons onView={() => setViewItem(r)} onEdit={() => openItemEdit(r)} onDelete={() => setDeleteTarget(r)} />
      ) },
  ];

  const statusColumns: Column<(typeof statusRows)[number]>[] = [
    { header: 'Ingredient', key: 'name', render: (r) => <span className="font-medium text-stone-800">{r.name}</span> },
    { header: 'Current', key: 'current', className: 'text-right', render: (r) => <b className={statusColor(r.status)}>{r.current}</b> },
    { header: 'Unit', key: 'unit' },
    { header: 'Status', key: 'status', render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
  ];

  const historyColumns: Column<(typeof history)[number]>[] = [
    { header: 'Timestamp', key: 'timestamp', render: (r) => <span className="whitespace-nowrap text-stone-500">{formatDateTime(r.timestamp)}</span> },
    { header: 'Item', key: 'itemId', render: (r) => <span className="font-medium text-stone-800">{nameById.get(r.itemId) ?? r.itemId}</span> },
    { header: 'Type', key: 'type', render: (r) => <Badge variant={TYPE_VARIANT[r.type]}>{TYPE_LABEL[r.type]}</Badge> },
    { header: 'Qty', key: 'qty', className: 'text-right', render: (r) =>
        typeof r.qty === 'number' ? (
          <span className={r.qty < 0 ? 'text-rose-600' : 'text-emerald-600'}>{r.qty > 0 ? '+' : ''}{formatNumber(r.qty)}</span>
        ) : (
          <span className="text-stone-600">{r.qty}</span>
        ),
      },
    { header: 'Note', key: 'note', render: (r) => <span className="text-stone-500">{r.note ?? '—'}</span> },
  ];

  const wasteColumns: Column<(typeof wastage)[number]>[] = [
    { header: 'Item', key: 'item', render: (r) => <span className="font-medium text-stone-800">{r.item}</span> },
    { header: 'Type', key: 'type', render: (r) => <Badge variant={r.type === 'damaged' ? 'critical' : 'low'}>{TYPE_LABEL[r.type]}</Badge> },
    { header: 'Qty', key: 'qty', className: 'text-right', render: (r) => (
        <b className="text-rose-600">{typeof r.qty === 'number' ? `-${formatNumber(r.qty)} ${r.unit}` : r.qty}</b>
      ) },
    { header: 'Note', key: 'note' },
    { header: 'Date', key: 'timestamp', render: (r) => formatDateTime(r.timestamp) },
  ];

  const saveMovement = () => {
    const item = inventory.find((i) => i.name.trim().toLowerCase() === mvItem.trim().toLowerCase());
    const raw = mvQty.trim();
    if (!item || !raw) return;
    const n = Number(raw);
    const qty = Number.isFinite(n) ? -Math.abs(n) : raw;
    recordMovement({ type: mvType, itemId: item.id, qty, note: mvNote || `${TYPE_LABEL[mvType]} entry` });
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
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      criticalLevel: item.criticalLevel,
      costPerUnit: item.costPerUnit,
      category: item.category,
      supplier: item.supplier ?? '',
      expirationDate: item.expirationDate ?? '',
    });
    setItemModalOpen(true);
  };
  const saveItem = () => {
    if (!itemForm.name.trim()) return;
    const payload = {
      ...itemForm,
      name: itemForm.name.trim(),
      supplier: itemForm.supplier.trim() || undefined,
      expirationDate: itemForm.expirationDate.trim() || undefined,
    };
    if (editingItem) updateInventoryItem({ ...editingItem, ...payload });
    else addInventoryItem(payload);
    setItemModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${summary.total} items · ${formatPeso(summary.inventoryValue, { compact: true })} stock value`}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setModalOpen(true)}><Package size={15} /> Record Movement</button>
            <button className="btn btn-primary" onClick={openItemAdd}><Plus size={15} /> Add Stock Item</button>
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="flex items-center gap-2">
          {tab === 'items' && (
            <input className="input w-56" placeholder="Search stock items…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          )}
          {isManager && (tab === 'wastage') && (
            <select value={filter} onChange={(e) => setFilter(e.target.value as RangeFilter)} className="input">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
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
          <Card title="Inventory Status" subtitle="Stock health across all items" className="mt-4">
            <Table columns={statusColumns} rows={statusRows} rowKey={(r) => r.itemId} />
          </Card>
        </>
      )}

      {tab === 'items' && (
        <Card title="All Stock Items">
          <Table columns={itemColumns} rows={visibleItems} rowKey={(r) => r.id} />
          <Pagination page={page} totalPages={itemsPageCount} totalItems={filteredItems.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </Card>
      )}

      {tab === 'history' && (
        <Card title="Movement History" subtitle="Every stock movement with a timestamp">
          <Table columns={historyColumns} rows={visibleHistory} rowKey={(r) => r.id} />
          <Pagination page={historyPage} totalPages={historyPageCount} totalItems={history.length} pageSize={PAGE_SIZE} onChange={setHistoryPage} />
        </Card>
      )}

      {tab === 'low' && (
        <Card title="Low & Critical Stock" subtitle={`${lowRows.length} items need attention`}>
          {lowRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">All stock levels are healthy 🎉</p>
          ) : (
            <Table columns={statusColumns} rows={lowRows} rowKey={(r) => r.itemId} />
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
              {(['wastage', 'damaged'] as const).map((t) => (
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
            <input className="input w-full" value={mvItem} onChange={(e) => setMvItem(e.target.value)} placeholder="Type item name…" />
          </div>
          <div>
            <label className="label mb-1 block">Quantity (removed)</label>
            <input type="text" className="input w-full" value={mvQty} onChange={(e) => setMvQty(e.target.value)} />
          </div>
          <div>
            <label className="label mb-1 block">Note</label>
            <input className="input w-full" value={mvNote} onChange={(e) => setMvNote(e.target.value)} placeholder="e.g. Expired stock" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveMovement} disabled={!mvItem || !mvQty.trim()}>Save</button>
          </div>
        </div>
      </Modal>

      <Modal open={itemModalOpen} title={editingItem ? `Edit ${editingItem.name}` : 'Add Stock Item'} onClose={() => setItemModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label mb-1 block">Stock Item Name</label>
            <input className="input w-full" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. Almond Milk" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 block">Unit of Measurement</label>
              <select className="input w-full" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}>
                {['kg', 'g', 'L', 'mL', 'pcs', 'ct', 'pack'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-1 block">Category</label>
              <input className="input w-full" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="e.g. Beverage" />
            </div>
          </div>
          <div>
            <label className="label mb-1 block">Current Quantity</label>
            <input type="number" className="input w-full" value={itemForm.currentStock || ''} onChange={(e) => setItemForm({ ...itemForm, currentStock: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost" onClick={() => setItemModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveItem} disabled={!itemForm.name.trim()}>Save</button>
          </div>
        </div>
      </Modal>

      <Modal open={viewItem !== null} title={viewItem?.name ?? ''} onClose={() => setViewItem(null)}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <DetailRow label="ID" value={viewItem.id} />
            <DetailRow label="Category" value={viewItem.category || '—'} />
            <DetailRow label="Current Stock" value={`${formatNumber(viewItem.currentStock)} ${viewItem.unit}`} />
            <DetailRow
              label="Status"
              value={(() => {
                const s = viewItem.currentStock <= viewItem.criticalLevel ? 'critical' : viewItem.currentStock <= viewItem.reorderLevel ? 'low' : 'good';
                return STATUS_LABEL[s];
              })()}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete stock item"
        message={`Remove "${deleteTarget?.name}" from inventory? This cannot be undone.`}
        onConfirm={() => {
          if (deleteTarget) deleteInventoryItem(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-800">{value}</span>
    </div>
  );
}