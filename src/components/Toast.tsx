import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const toast: Toast = { id: crypto.randomUUID(), message, type };
    setToasts((t) => [...t, toast]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== toast.id));
    }, 1800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        <div className="space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-2 rounded-xl shadow-lg text-white text-sm font-semibold text-center ${
                t.type === 'success'
                  ? 'bg-emerald-600'
                  : t.type === 'error'
                  ? 'bg-red-600'
                  : 'bg-gray-800'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
