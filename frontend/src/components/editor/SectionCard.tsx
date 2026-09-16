'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sparkles, Check, X, Pencil, RefreshCw, Info } from 'lucide-react';
import StatusBadge, { type BadgeState } from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { useSectionTitle } from '@/lib/labels';
import type { AiSuggestion, DocumentSection, FactsSnapshot, SectionDefinition } from '@/lib/types';

type ReviewAction = 'CONFIRM' | 'EDIT' | 'REJECT';

interface Props {
  definition: SectionDefinition;
  section?: DocumentSection;
  busy: boolean;
  onGenerate: () => void;
  onReview: (suggestionId: string, action: ReviewAction, editedContent?: string) => Promise<unknown>;
  onManualSave: (content: string) => Promise<unknown>;
}

/** Résumé lisible des faits exacts utilisés par la proposition (traçabilité Zero Fabrication). */
function useFactsSummary() {
  const t = useTranslations('editor');
  const tc = useTranslations('common');

  return (suggestion: AiSuggestion): string => {
    const snapshot = suggestion.sourceFactsSnapshot;
    const facts: FactsSnapshot = snapshot && !Array.isArray(snapshot) ? snapshot : {};
    const parts: string[] = [];

    for (const e of facts.experiences ?? []) {
      const start = e.startDate ? new Date(e.startDate).getFullYear() : '';
      const end = e.isCurrent ? tc('today') : e.endDate ? new Date(e.endDate).getFullYear() : '';
      parts.push(`${e.title} — ${e.company}${start ? ` (${start}–${end})` : ''}`);
    }
    for (const e of facts.educations ?? []) parts.push(`${e.degree} (${e.school})`);
    if (facts.skills?.length) parts.push(facts.skills.map((s) => s.name).join(', '));
    if (!parts.length && facts.profile?.headline) parts.push(facts.profile.headline);

    return parts.join(' · ') || t('basedOnFallback');
  };
}

export default function SectionCard({ definition, section, busy, onGenerate, onReview, onManualSave }: Props) {
  const t = useTranslations('editor');
  const tc = useTranslations('common');
  const sectionTitle = useSectionTitle();
  const factsSummary = useFactsSummary();
  const [editing, setEditing] = useState<null | { text: string; suggestionId?: string }>(null);

  const title = sectionTitle(definition.type);
  const pending = section?.suggestions.find((s) => s.status === 'PENDING_CONFIRMATION');
  const confirmedContent = section?.content?.trim() ? section.content : null;
  const state: BadgeState = pending ? 'PENDING' : confirmedContent ? 'CONFIRMED' : 'EMPTY';

  const saveEdit = async () => {
    if (!editing) return;
    try {
      if (editing.suggestionId) await onReview(editing.suggestionId, 'EDIT', editing.text);
      else await onManualSave(editing.text);
      setEditing(null);
    } catch {
      // l'erreur est affichée par un toast ; on conserve la saisie
    }
  };

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby={`section-${definition.type}`}
      className={`bg-white p-5 rounded-3xl border shadow-card space-y-4 ${pending ? 'border-[#FF7A59]/40' : 'border-[#F3E3D6]'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={`section-${definition.type}`} className="font-bold text-base text-[#2E241F]">
          {title}
          {definition.essential && <span className="ml-2 text-xs font-medium text-[#83726A]">{t('essential')}</span>}
        </h3>
        <StatusBadge state={state} />
      </div>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            autoFocus
            rows={7}
            aria-label={t('contentAria', { section: title })}
            value={editing.text}
            onChange={(e) => setEditing({ ...editing, text: e.target.value })}
            className="border-[#FF7A59]"
          />
          <div className="flex items-center gap-2">
            <Button variant="success" onClick={saveEdit} disabled={busy || !editing.text.trim()}>
              {t('saveAndValidate')}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {tc('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {confirmedContent && (
            <div className="space-y-2">
              <p className="p-4 rounded-2xl bg-[#DDF5E7]/50 border border-[#2BB673]/20 text-sm text-[#2E241F] leading-relaxed whitespace-pre-line">
                {confirmedContent}
              </p>
              {!pending && (
                <div className="flex items-center justify-end gap-4 text-sm">
                  <button
                    onClick={() => setEditing({ text: confirmedContent })}
                    className="font-semibold text-[#83726A] hover:text-[#2E241F] inline-flex items-center gap-1"
                  >
                    <Pencil size={13} /> {tc('edit')}
                  </button>
                  <button
                    onClick={onGenerate}
                    disabled={busy}
                    className="font-semibold text-[#FF7A59] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={busy ? 'animate-spin motion-reduce:animate-none' : ''} /> {t('regenerate')}
                  </button>
                </div>
              )}
            </div>
          )}

          {pending && (
            <div className="space-y-3">
              {confirmedContent && <p className="text-sm font-semibold text-[#9A3A20]">{t('newProposal')}</p>}
              <p className="p-4 rounded-2xl bg-[#FFD9C7]/30 border border-[#FF7A59]/30 text-sm text-[#2E241F] leading-relaxed whitespace-pre-line">
                {pending.generatedContent}
              </p>
              <p className="p-3 rounded-xl bg-[#FFE8DC] text-sm text-[#5C4A42] flex items-start gap-2">
                <Info size={15} className="text-[#FF7A59] shrink-0 mt-0.5" />
                <span>
                  <strong>{t('basedOn')}</strong> {factsSummary(pending)}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="success"
                  onClick={() => onReview(pending.id, 'CONFIRM').catch(() => undefined)}
                  disabled={busy}
                  aria-label={t('validateLabel', { section: title })}
                  className="flex-1 min-w-32"
                >
                  <Check size={16} /> {t('validate')}
                </Button>
                <Button
                  onClick={() => setEditing({ text: pending.generatedContent, suggestionId: pending.id })}
                  disabled={busy}
                  aria-label={t('editLabel', { section: title })}
                >
                  <Pencil size={14} /> {tc('edit')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onReview(pending.id, 'REJECT').catch(() => undefined)}
                  disabled={busy}
                  aria-label={t('rejectLabel', { section: title })}
                >
                  <X size={15} /> {t('reject')}
                </Button>
              </div>
            </div>
          )}

          {!confirmedContent && !pending && (
            <div className="space-y-3">
              <p className="text-sm text-[#83726A]">{t('noContent')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={onGenerate} disabled={busy}>
                  <Sparkles size={15} className={busy ? 'animate-pulse motion-reduce:animate-none' : ''} />
                  {busy ? t('generating') : t('generate')}
                </Button>
                <Button variant="ghost" onClick={() => setEditing({ text: '' })}>
                  {t('writeMyself')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}
