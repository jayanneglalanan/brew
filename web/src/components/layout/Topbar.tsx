import { useState } from 'react';
import { formatDateTime } from 'mock-data';
import { useRangeFilter } from '@/app/RangeFilterContext';
import { useAuth } from '@/app/AuthContext';
import { useShopName } from '@/app/ShopNameContext';

const FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
  { value: 'all', label: 'All Time' },
] as const;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function Topbar() {
  const { user } = useAuth();
  const { shopName } = useShopName();
  const isManager = user?.role === 'manager';
  const { filter, setFilter } = useRangeFilter();
  const today = new Date();
  const defaultStart = new Date(today.getTime() - 6 * 86400000);
  const [start, setStart] = useState(iso(defaultStart));
  const [end, setEnd] = useState(iso(today));

  const applyCustom = (s: string, e: string) => {
    const startD = parseIso(s);
    const endD = parseIso(e);
    if (startD.getTime() <= endD.getTime()) {
      setFilter('custom', { start: startD, end: endD, label: `${s} → ${e}` });
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6">
      <div className="flex items-center gap-3 text-sm text-stone-500">
        <span className="font-medium text-stone-900">☕ {shopName}</span>
        <span className="text-stone-300">|</span>
        <span>{formatDateTime(new Date().toISOString())}</span>
      </div>
      <div className="flex items-center gap-2">
        {!isManager && (
          <>
        {filter === 'custom' && (
          <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1">
            <input type="date" value={start} onChange={(e) => { setStart(e.target.value); applyCustom(e.target.value, end); }} className="input !px-2 !py-1 text-xs" />
            <span className="text-xs text-stone-400">→</span>
            <input type="date" value={end} onChange={(e) => { setEnd(e.target.value); applyCustom(start, e.target.value); }} className="input !px-2 !py-1 text-xs" />
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                if (f.value === 'custom') applyCustom(start, end);
                else setFilter(f.value);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-600 hover:bg-white hover:text-stone-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
          </>
        )}
      </div>
    </header>
  );
}
