import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'bg-[#6F4E37]',
  error: 'bg-rose-700',
  info: 'bg-stone-800',
};

const TONE_ICON: Record<ToastTone, string> = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${TONE_CLASS[t.tone]}`}
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-white/20 text-[10px]">{TONE_ICON[t.tone]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
