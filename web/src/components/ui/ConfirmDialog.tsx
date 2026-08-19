import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return createPortal(
    <div className="animate-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 p-4" onClick={onCancel}>
      <div className="animate-panel-in card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
              <p className="mt-1 text-sm text-stone-600">{message}</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn bg-rose-600 text-white hover:bg-rose-700" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}