import { useMemo, useState } from 'react';
import {
  formatDateTime,
  formatPeso,
  getDateRange,
  getStaffPerformance,
  staff,
} from 'mock-data';
import { useData } from '@/app/DataContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table, { type Column } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Page';

const TABS = [
  { value: 'staff', label: 'Staff' },
  { value: 'audit', label: 'Audit Logs' },
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
  const { transactions, auditLogs } = useData();
  const [tab, setTab] = useState('staff');
  const range = useMemo(() => getDateRange('week'), []);
  const staffPerf = useMemo(() => getStaffPerformance(transactions, staff, range), [transactions, range]);
  const staffName = useMemo(() => new Map(staff.map((s) => [s.id, s.name])), []);
  const recentLogs = useMemo(() => [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 60), [auditLogs]);

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
    { header: 'Transactions', key: 'transactions' },
    { header: 'Sales', key: 'sales', render: (r) => formatPeso(r.sales) },
    { header: 'Voids', key: 'voids', render: (r) => <span className={r.voids > 0 ? 'text-rose-600' : 'text-stone-500'}>{r.voids}</span> },
    { header: 'Discounts', key: 'discounts', render: (r) => formatPeso(r.discounts) },
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
      <PageHeader title="Management" subtitle="Staff and audit trail" />
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
    </div>
  );
}
