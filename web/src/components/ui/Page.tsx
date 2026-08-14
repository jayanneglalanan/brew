import type { ReactNode } from 'react';

interface TabsProps {
  tabs: Array<{ value: string; label: string }>;
  active: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-200 bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            active === t.value ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-stone-100">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-stone-300">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
