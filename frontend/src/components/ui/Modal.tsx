'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Sur mobile, s'ouvre en feuille depuis le bas. */
  variant?: 'center' | 'sheet';
}

export default function Modal({ open, onClose, title, children, variant = 'center' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const isSheet = variant === 'sheet';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 z-50 bg-[#2E241F]/35 backdrop-blur-sm flex ${isSheet ? 'items-end' : 'items-center'} justify-center p-4`}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: isSheet ? 40 : 0, scale: isSheet ? 1 : 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: isSheet ? 40 : 0, scale: isSheet ? 1 : 0.96, opacity: 0 }}
            className="w-full max-w-md bg-[#FFF9F3] rounded-3xl border border-[#F3E3D6] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto focus:outline-none"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[#2E241F]">{title}</h2>
              <button onClick={onClose} aria-label="Fermer" className="p-1.5 text-[#83726A] hover:text-[#2E241F] rounded-lg">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
