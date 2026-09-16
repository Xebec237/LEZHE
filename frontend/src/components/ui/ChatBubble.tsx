'use client';

import { motion } from 'framer-motion';

/** Bulle de conversation Lezhe — langage visuel propre au produit, pas un chat générique. */
export default function ChatBubble({ children, from = 'lezhe' }: { children: React.ReactNode; from?: 'lezhe' | 'candidate' }) {
  if (from === 'candidate') {
    return (
      <div className="flex justify-end">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#F3E3D6] px-4 py-3 rounded-2xl rounded-tr-md text-base text-[#2E241F] max-w-lg"
        >
          {children}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-2xl bg-[#FF7A59] text-white flex items-center justify-center font-bold text-sm shrink-0" aria-hidden>
        L
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FFE8DC]/60 px-4 py-3 rounded-2xl rounded-tl-md text-base text-[#2E241F] leading-relaxed max-w-lg"
      >
        {children}
      </motion.div>
    </div>
  );
}
