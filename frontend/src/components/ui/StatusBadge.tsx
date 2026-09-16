'use client';

import { useTranslations } from 'next-intl';

export type BadgeState = 'EMPTY' | 'PENDING' | 'CONFIRMED' | 'REJECTED';

const STYLES: Record<BadgeState, { className: string; icon: string; key: string }> = {
  PENDING: { className: 'bg-[#FFD9C7] text-[#9A3A20] border-[#FF7A59]/30', icon: '🤖', key: 'pending' },
  CONFIRMED: { className: 'bg-[#DDF5E7] text-[#1F7A4F] border-[#2BB673]/30', icon: '✓', key: 'confirmed' },
  REJECTED: { className: 'bg-[#FBE7E5] text-[#B5433A] border-[#E2645A]/30', icon: '✕', key: 'rejected' },
  EMPTY: { className: 'bg-[#F3E3D6] text-[#6B5B53] border-transparent', icon: '○', key: 'empty' },
};

export default function StatusBadge({ state, customText }: { state: BadgeState; customText?: string }) {
  const t = useTranslations('badges');
  const { className, icon, key } = STYLES[state];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${className}`}>
      <span aria-hidden>{icon}</span>
      {customText ?? t(key as never)}
    </span>
  );
}
