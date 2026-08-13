import type { ReactNode } from 'react';

export default function Modal({
  open,
  title,
  onClose,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={onClose}>
      <div
        className={`card w-full ${width} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="rounded-md px-2 py-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            ✕
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
