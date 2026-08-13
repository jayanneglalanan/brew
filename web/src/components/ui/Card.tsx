import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, subtitle, action, children, className = '' }: CardProps) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-[rgba(253,246,236,0.14)] px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-stone-50">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-stone-300">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
