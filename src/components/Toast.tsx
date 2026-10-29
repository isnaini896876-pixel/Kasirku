import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-3 pointer-events-none no-print">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-emerald-900/90 text-emerald-100 border-emerald-600 backdrop-blur-sm'
                : isError
                ? 'bg-rose-900/90 text-rose-100 border-rose-600 backdrop-blur-sm'
                : isWarning
                ? 'bg-amber-900/90 text-amber-100 border-amber-600 backdrop-blur-sm'
                : 'bg-slate-900/90 text-slate-100 border-slate-700 backdrop-blur-sm'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {isWarning && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}

            <div className="flex-1">
              {toast.title && <p className="font-bold text-[11px] mb-0.5">{toast.title}</p>}
              <p className="leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-0.5 rounded text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
