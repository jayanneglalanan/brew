import { useEffect, useRef, useState } from 'react';
import { signed } from 'mock-data';

interface StatCardProps {
  label: string;
  value?: string;
  count?: number;
  format?: (n: number) => string;
  icon?: string;
  delta?: number;
  deltaLabel?: string;
  accent?: string;
}

const ACCENTS: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  slate: 'bg-stone-100 text-stone-700',
};

function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

export default function StatCard({ label, value, count, format, icon, delta, deltaLabel, accent = 'brand' }: StatCardProps) {
  const animated = useCountUp(count ?? 0);
  const display =
    count !== undefined ? (format ? format(animated) : Math.round(animated).toLocaleString()) : (value ?? '');

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="label">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-bold text-stone-900">{display}</p>
          {delta !== undefined && (
            <p className={`mt-1 text-xs font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {signed(delta)} {deltaLabel ?? 'vs prev period'}
            </p>
          )}
        </div>
        {icon && (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg ${ACCENTS[accent] ?? ACCENTS.brand}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
