'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Check, X, Pencil, ShieldCheck, Info } from 'lucide-react';
import { apiFetch, errorMessage } from '@/lib/api';
import { queryKeys, useProfile, useSkillSuggestions } from '@/lib/queries';
import type { AiSuggestion } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SkillChip from '@/components/ui/SkillChip';
import { Input } from '@/components/ui/Field';

type Action = 'CONFIRM' | 'EDIT' | 'REJECT';

function sourceSummary(suggestion: AiSuggestion): string {
  const facts = Array.isArray(suggestion.sourceFactsSnapshot) ? suggestion.sourceFactsSnapshot : [];
  return facts.map((f) => `${f.title} — ${f.company}`).join(', ');
}

export default function DiscoverSkillsPage() {
  const t = useTranslations('skills');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const toast = useToast();
  const profile = useProfile();
  const suggestions = useSkillSuggestions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  const analyse = useMutation({
    mutationFn: () => apiFetch<AiSuggestion[]>('/profile/skills/suggest', { method: 'POST' }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skillSuggestions });
      if (created.length) toast.success(t('toastFound', { count: created.length }));
      else toast.info(t('toastNothingNew'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const review = useMutation({
    mutationFn: (vars: { suggestionId: string; action: Action; editedContent?: string }) =>
      apiFetch('/profile/skills/confirm', { method: 'POST', body: JSON.stringify(vars) }),
    onSuccess: (_data, vars) => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.skillSuggestions });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      toast.success(vars.action === 'REJECT' ? t('toastRejected') : t('toastConfirmed'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (profile.isPending || suggestions.isPending) return <PageSkeleton />;
  if (profile.isError) return <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />;
  if (suggestions.isError) return <ErrorState message={suggestions.error.message} onRetry={() => suggestions.refetch()} />;

  const hasExperiences = profile.data.experiences.length > 0;
  const pending = suggestions.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Card as="header" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E241F]">{t('title')}</h1>
            <p className="text-base text-[#83726A]">{t('subtitle')}</p>
          </div>
          <Button onClick={() => analyse.mutate()} loading={analyse.isPending} disabled={!hasExperiences} className="shrink-0">
            <Sparkles size={16} />
            {analyse.isPending ? t('analysing') : t('analyse')}
          </Button>
        </div>
        <p className="p-3.5 rounded-2xl bg-[#DFF1FF]/70 text-[#1F5E82] text-sm flex items-start gap-2">
          <ShieldCheck size={18} className="shrink-0 mt-0.5" />
          <span>{t.rich('guarantee', { b: (chunks) => <strong>{chunks}</strong> })}</span>
        </p>
      </Card>

      {!hasExperiences && (
        <Card className="border-dashed border-[#FF7A59]/40 text-center space-y-3">
          <p className="text-base font-semibold text-[#2E241F]">{t('needExperienceTitle')}</p>
          <p className="text-sm text-[#83726A]">{t('needExperienceText')}</p>
          <Link href="/profile" className="inline-block bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold text-sm px-5 py-3 rounded-xl">
            {t('addExperience')}
          </Link>
        </Card>
      )}

      {hasExperiences && (
        <section className="space-y-4" aria-labelledby="pending-title">
          <h2 id="pending-title" className="text-lg font-bold text-[#2E241F] flex items-center gap-2">
            {t('pendingTitle')}
            <span className="text-sm bg-[#FFD9C7] text-[#9A3A20] px-2.5 py-0.5 rounded-full font-bold">{pending.length}</span>
          </h2>

          {pending.length === 0 ? (
            <Card className="text-center space-y-2">
              <p className="text-base font-semibold text-[#2E241F]">{t('nonePendingTitle')}</p>
              <p className="text-sm text-[#83726A]">{t('nonePendingText')}</p>
            </Card>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {pending.map((s) => (
                  <motion.li
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-5 rounded-3xl border border-[#FF7A59]/30 shadow-card flex flex-col gap-4"
                  >
                    <div className="space-y-2">
                      <StatusBadge state="PENDING" customText={t('suggested')} />
                      {editingId === s.id ? (
                        <Input
                          autoFocus
                          aria-label={t('skillNameAria')}
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="border-[#FF7A59]"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-[#2E241F]">{s.generatedContent}</h3>
                      )}
                      {sourceSummary(s) && (
                        <p className="text-sm text-[#83726A] flex items-start gap-1.5">
                          <Info size={14} className="shrink-0 mt-0.5 text-[#3AA9E0]" />
                          {t('basedOn', { facts: sourceSummary(s) })}
                        </p>
                      )}
                    </div>

                    {editingId === s.id ? (
                      <div className="flex items-center gap-2 mt-auto">
                        <Button
                          variant="success"
                          className="flex-1"
                          disabled={!editedText.trim() || review.isPending}
                          onClick={() => review.mutate({ suggestionId: s.id, action: 'EDIT', editedContent: editedText })}
                        >
                          {tc('save')}
                        </Button>
                        <Button variant="ghost" onClick={() => setEditingId(null)}>
                          {tc('cancel')}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-auto">
                        <Button
                          variant="success"
                          className="flex-1"
                          disabled={review.isPending}
                          aria-label={t('confirmLabel', { name: s.generatedContent })}
                          onClick={() => review.mutate({ suggestionId: s.id, action: 'CONFIRM' })}
                        >
                          <Check size={16} /> {t('confirm')}
                        </Button>
                        <Button
                          variant="secondary"
                          aria-label={t('editLabel', { name: s.generatedContent })}
                          onClick={() => {
                            setEditingId(s.id);
                            setEditedText(s.generatedContent);
                          }}
                        >
                          <Pencil size={14} /> {tc('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={review.isPending}
                          aria-label={t('removeLabel', { name: s.generatedContent })}
                          onClick={() => review.mutate({ suggestionId: s.id, action: 'REJECT' })}
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      )}

      {profile.data.skills.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-[#2E241F]">{t('confirmedTitle', { count: profile.data.skills.length })}</h2>
          <ul className="flex flex-wrap gap-2">
            {profile.data.skills.map((skill) => (
              <li key={skill.id}>
                <SkillChip name={skill.name} />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4 text-sm font-bold">
            <Link href="/documents/new?type=CV" className="text-[#FF7A59] hover:underline">
              {t('useInCv')}
            </Link>
            <Link href="/profile" className="text-[#83726A] hover:underline">
              {t('manageInProfile')}
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
