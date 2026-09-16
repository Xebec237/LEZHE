'use client';

import { AnimatePresence, motion } from 'framer-motion';
import ChatBubble from './ChatBubble';

/**
 * Une question à la fois : bulle de Lezhe + réponses rapides et/ou champ libre.
 * Utilisé par l'onboarding (4.4) et le flux de création de document (4.9).
 */
export default function QuestionCard({
  stepKey,
  question,
  quickReplies,
  onQuickReply,
  children,
}: {
  stepKey: string;
  question: string;
  quickReplies?: string[];
  onQuickReply?: (reply: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -18 }}
        transition={{ duration: 0.2 }}
        className="space-y-5"
      >
        <ChatBubble>{question}</ChatBubble>

        {quickReplies && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => onQuickReply?.(reply)}
                className="px-3.5 py-2 rounded-full border border-[#F3E3D6] bg-white text-sm font-medium text-[#2E241F] hover:bg-[#FFE8DC] hover:border-[#FF7A59] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A59]"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {children}
      </motion.div>
    </AnimatePresence>
  );
}
