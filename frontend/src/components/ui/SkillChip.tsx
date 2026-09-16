'use client';

import { X } from 'lucide-react';

type Tone = 'confirmed' | 'suggested' | 'neutral';

const TONES: Record<Tone, string> = {
  confirmed: 'bg-[#DDF5E7] text-[#1F5E40]',
  suggested: 'bg-[#FFD9C7] text-[#9A3A20]',
  neutral: 'bg-[#F3E3D6] text-[#6B5B53]',
};

export default function SkillChip({
  name,
  tone = 'confirmed',
  onRemove,
  removeLabel,
}: {
  name: string;
  tone?: Tone;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full pl-3 ${onRemove ? 'pr-1.5' : 'pr-3'} py-1.5 text-sm font-medium ${TONES[tone]}`}>
      {tone === 'confirmed' && <span aria-hidden>✓</span>}
      {name}
      {onRemove && (
        <button onClick={onRemove} aria-label={removeLabel ?? `Retirer ${name}`} className="w-6 h-6 rounded-full hover:bg-white/70 inline-flex items-center justify-center">
          <X size={13} />
        </button>
      )}
    </span>
  );
}
