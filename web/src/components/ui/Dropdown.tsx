import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option<T extends string> {
  value: T;
  label: string;
}

export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input inline-flex w-full items-center justify-between gap-2 pr-2"
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="animate-menu-in absolute right-0 z-30 mt-1 min-w-full overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm ${
                o.value === value ? 'bg-brand-50 font-semibold text-brand-700' : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
