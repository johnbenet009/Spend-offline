import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}

export function Modal({ open, title, children, onClose, actions }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="px-5 py-4">{children}</div>
        {actions && <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
