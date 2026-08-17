import { useMemo, useState } from 'react';
import {
  formatDateTime,
  formatPeso,
  getDateRange,
  getStaffPerformance,
  staff,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import { useAuth } from '@/app/AuthContext';
import { useShopName } from '@/app/ShopNameContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';

const TABS = [
  { value: 'staff', label: 'Staff' },
  { value: 'audit', label: 'Audit Logs' },
  { value: 'settings', label: 'Settings' },
];

const ACTION_LABEL: Record<string, string> = {
  'transaction.completed': 'completed a transaction',
  'transaction.voided': 'voided a transaction',
  'transaction.refunded': 'refunded a transaction',
  'inventory.adjustment': 'adjusted inventory',
  'inventory.created': 'created a stock item',
  'inventory.updated': 'updated a stock item',
  'inventory.deleted': 'deleted a stock item',
  'discount.applied': 'applied a discount',
  'product.created': 'created a product',
  'product.updated': 'updated a product',
  'product.deleted': 'deleted a product',
  'staff.login': 'logged in',
};

const ACTION_VARIANT: Record<string, string> = {
  'transaction.completed': 'good',
  'transaction.voided': 'amber',
  'transaction.refunded': 'critical',
  'inventory.adjustment': 'blue',
  'inventory.created': 'good',
  'inventory.updated': 'blue',
  'inventory.deleted': 'critical',
  'discount.applied': 'slate',
  'product.created': 'good',
  'product.updated': 'blue',
  'product.deleted': 'critical',
  'staff.login': 'slate',
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
  const staffPerf = useMemo(() => getStaffPerformance(transactions, staff, range), [transactions, range]);
  const staffName = useMemo(() => new Map(staff.map((s) => [s.id, s.name])), []);
  const recentLogs = useMemo(() => [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 60), [auditLogs]);

  const saveProfile = () => {
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    const nextName = nameDraft.trim();
    const nextShopName = shopNameDraft.trim();
    const nextBusinessHours = businessHoursDraft.trim();
    updateUser(nextName);
    setShopName(nextShopName);
    setBusinessHours(nextBusinessHours);
    setConfirmOpen(false);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
  };

  const staffColumns: Column<(typeof staffPerf)[number]>[] = [
    { header: 'Name', key: 'name', render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-stone-200 text-xs font-bold text-stone-700">
            {r.name.charAt(0)}
          </span>
          <span className="font-medium text-stone-800">{r.name}</span>
        </div>
      ) },
    { header: 'Role', key: 'role', render: (r) => <Badge variant={r.role === 'cashier' ? 'slate' : 'brand'}>{r.role}</Badge> },
    { header: 'Transactions', key: 'transactions', className: 'text-right' },
    { header: 'Sales', key: 'sales', className: 'text-right', render: (r) => formatPeso(r.sales) },
    { header: 'Voids', key: 'voids', className: 'text-right', render: (r) => <span className={r.voids > 0 ? 'text-rose-600' : 'text-stone-500'}>{r.voids}</span> },
    { header: 'Discounts', key: 'discounts', className: 'text-right', render: (r) => formatPeso(r.discounts) },
  ];

  const logColumns: Column<(typeof recentLogs)[number]>[] = [
    { header: 'Time', key: 'timestamp', render: (r) => <span className="whitespace-nowrap text-stone-500">{formatDateTime(r.timestamp)}</span> },
    { header: 'Actor', key: 'actor', render: (r) => <span className="font-medium text-stone-800">{staffName.get(r.actorId) ?? r.actorId}</span> },
    { header: 'Action', key: 'action', render: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? 'slate'}>{ACTION_LABEL[r.action] ?? r.action}</Badge> },
    { header: 'Target', key: 'target', render: (r) => <span className="text-stone-700">{r.target}</span> },
    { header: 'Detail', key: 'detail', render: (r) => <span className="text-stone-500">{r.detail ?? '—'}</span> },
  ];

  return (
    <div>
      <PageHeader title="Management" subtitle="Staff, audit trail and shop settings" />
      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'staff' && (
        <div className="space-y-4">
          <Card title="Staff List" subtitle={`${staff.length} team members`}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: s.avatarColor }}>
                    {s.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-800">{s.name}</p>
                    <p className="text-xs text-stone-500">{s.role}</p>
                  </div>
                  <Badge variant="slate">PIN ••••</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Staff Performance" subtitle={range.label}>
            <Table columns={staffColumns} rows={staffPerf} rowKey={(r) => r.staffId} />
          </Card>
        </div>
      )}

      {tab === 'audit' && (
        <Card title="Audit Logs" subtitle="Immutable trail of system events">
          <Table columns={logColumns} rows={recentLogs} rowKey={(r) => r.id} />
        </Card>
      )}

      {tab === 'settings' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {user ? (
            <div className="relative">
              <Card title="Profile">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-200 font-bold text-stone-700">
                    {user.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-stone-800">{user.name}</p>
                    <p className="text-xs capitalize text-stone-500">{user.role}</p>
                  </div>
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Full Name</span>
                  <input
                    className="input w-full"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Enter your name"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Shop Name</span>
                  <input
                    className="input w-full"
                    value={shopNameDraft}
                    onChange={(e) => setShopNameDraft(e.target.value)}
                    placeholder="Enter shop name"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Business Hours</span>
                  <input
                    className="input w-full"
                    value={businessHoursDraft}
                    onChange={(e) => setBusinessHoursDraft(e.target.value)}
                    placeholder="e.g. 7:00 AM – 9:00 PM"
                  />
                </label>
                <button
                  className="btn btn-primary w-full"
                  onClick={saveProfile}
                  disabled={!nameDraft.trim() || !shopNameDraft.trim() || !businessHoursDraft.trim()}
                >
                  Save Profile
                </button>
              </div>
            </Card>
              {confirmOpen && (
                <div className="absolute inset-0 z-20 flex items-center justify-center" onClick={closeConfirm}>
                  <div className="w-full max-w-[280px] rounded-xl border border-stone-200 bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <p className="mb-3 text-sm font-semibold text-stone-800">Save Profile</p>
                    <div className="flex gap-2">
                      <button className="btn flex-1 bg-stone-100 text-stone-700 hover:bg-stone-200" onClick={closeConfirm}>
                        Cancel
                      </button>
                      <button className="btn btn-primary flex-1" onClick={confirmSave}>
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <Card title="Alert Thresholds">
            <div className="space-y-3">
              <Field label="Critical stock threshold" value="At or below critical level" />
              <Field label="Large discount alert" value="Discounts over 15%" />
              <Field label="Unusual sales drop" value="Below 50% of 7-day average" />
            </div>
          </Card>
          <Card title="Demo Data" subtitle="Changes are saved to this browser">
            <p className="mb-3 text-sm text-stone-500">
              Products, inventory, transactions and audit logs survive page refreshes. Reset restores the original sample data.
            </p>
            <button
              className="btn border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              onClick={() => {
                if (window.confirm('Reset all data to the original sample? This cannot be undone.')) resetData();
              }}
            >
              Reset demo data
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 pb-2 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-800">{value}</span>
    </div>
  );
}
