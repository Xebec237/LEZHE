'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => {});

const STYLES: Record<ToastKind, { className: string; Icon: typeof Info }> = {
  success: { className: 'bg-[#DDF5E7] text-[#1F7A4F] border-[#2BB673]/30', Icon: CheckCircle2 },
  error: { className: 'bg-[#FBE7E5] text-[#B5433A] border-[#E2645A]/30', Icon: AlertCircle },
  info: { className: 'bg-[#DFF1FF] text-[#1F6E99] border-[#3AA9E0]/30', Icon: Info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[60] left-4 right-4 bottom-24 md:bottom-6 md:left-auto md:right-6 md:w-96 flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map(({ id, kind, message }) => {
            const { className, Icon } = STYLES[kind];
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                role={kind === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-card ${className}`}
              >
                <Icon size={18} className="shrink-0 mt-0.5" />
                <span className="flex-1">{message}</span>
                <button onClick={() => dismiss(id)} aria-label="Fermer la notification" className="opacity-60 hover:opacity-100">
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastContext);
  return {
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
  };
}
