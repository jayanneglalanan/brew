import type { ReactNode } from 'react';

const VARIANTS: Record<string, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  low: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  slate: 'bg-stone-100 text-stone-600 border-stone-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function Badge({ children, variant = 'slate', className = '' }: { children: ReactNode; variant?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${VARIANTS[variant] ?? VARIANTS.slate} ${className}`}>
      {children}
    </span>
  );
}
