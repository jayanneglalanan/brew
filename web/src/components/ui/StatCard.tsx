import { signed } from 'mock-data';

interface StatCardProps {
  label: string;
  value: string;
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

export default function StatCard({ label, value, icon, delta, deltaLabel, accent = 'brand' }: StatCardProps) {
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="label">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-bold text-stone-900">{value}</p>
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
