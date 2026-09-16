'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Info } from 'lucide-react';
import { apiFetch, errorMessage } from '@/lib/api';
import { queryKeys, useProfile } from '@/lib/queries';
import { formatMonthYear, useDocumentTypeLabels, useTemplateOptions } from '@/lib/labels';
import type { DocumentType } from '@/lib/types';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import ProgressBar from '@/components/ui/ProgressBar';
import QuestionCard from '@/components/ui/QuestionCard';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

const POPULAR_COUNTRIES = ['Côte d’Ivoire', 'France', 'Sénégal', 'Cameroun', 'Canada', 'Belgique', 'Maroc', 'Suisse'];
const DOC_TYPES: DocumentType[] = ['CV', 'COVER_LETTER', 'RECOMMENDATION_LETTER'];
const STEPS = ['type', 'country', 'job', 'template', 'facts'] as const;

function NewDocumentWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations('documentNew');
  const tc = useTranslations('common');
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const typeLabels = useDocumentTypeLabels();
  const templates = useTemplateOptions();

  const initialType = DOC_TYPES.includes(params.get('type') as DocumentType) ? (params.get('type') as DocumentType) : 'CV';
  const adapt = params.get('adapt') === '1';

  const [step, setStep] = useState(params.get('type') ? 1 : 0);
  const [type, setType] = useState<DocumentType>(initialType);
  const [country, setCountry] = useState('');
  const [targetJobInput, setTargetJob] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState('ats');

  const targetJob = targetJobInput ?? profile.data?.headline ?? '';

  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>('/documents', {
        method: 'POST',
        body: JSON.stringify({
          type,
          title: `${typeLabels[type]}${targetJob ? ` — ${targetJob}` : ''}`,
          targetJob: targetJob || undefined,
          targetCountry: country || undefined,
          templateId,
          language: 'fr',
        }),
      }),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      router.push(`/documents/${doc.id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (profile.isPending) return <PageSkeleton />;
  if (profile.isError) return <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />;

  const p = profile.data;
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const current = STEPS[step];
  const hasFacts = p.experiences.length + p.educations.length + p.skills.length > 0;
  const countries = [...new Set([...(p.location ? [p.location] : []), ...POPULAR_COUNTRIES])].slice(0, 8);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button onClick={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#83726A] hover:text-[#2E241F]">
            <ArrowLeft size={16} /> {tc('back')}
          </button>
        ) : (
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#83726A] hover:text-[#2E241F]">
            <ArrowLeft size={16} /> {tc('back')}
          </Link>
        )}
        <span className="text-sm text-[#83726A]">{tc('stepOf', { current: step + 1, total: STEPS.length })}</span>
      </div>
      <ProgressBar value={((step + 1) / STEPS.length) * 100} label={tc('stepOf', { current: step + 1, total: STEPS.length })} />

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F3E3D6] shadow-card min-h-[360px]">
        {current === 'type' && (
          <QuestionCard stepKey="type" question={t('typeQuestion')}>
            <div className="grid gap-2.5">
              {DOC_TYPES.map((docType) => (
                <button
                  key={docType}
                  onClick={() => {
                    setType(docType);
                    next();
                  }}
                  className={`text-left p-4 rounded-2xl border text-base font-semibold transition flex items-center justify-between ${
                    type === docType ? 'border-[#FF7A59] bg-[#FFE8DC]' : 'border-[#F3E3D6] hover:bg-[#FFE8DC]/50'
                  }`}
                >
                  {typeLabels[docType]}
                  <ArrowRight size={18} className="text-[#FF7A59]" />
                </button>
              ))}
            </div>
          </QuestionCard>
        )}

        {current === 'country' && (
          <QuestionCard
            stepKey="country"
            question={t('countryQuestion')}
            quickReplies={countries}
            onQuickReply={(c) => {
              setCountry(c);
              next();
            }}
          >
            <Input
              list="countries"
              aria-label={t('countryAria')}
              placeholder={t('countryPlaceholder')}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && country && next()}
            />
            <datalist id="countries">
              {POPULAR_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="flex gap-3">
              <Button onClick={next} disabled={!country} fullWidth size="lg">
                {tc('continue')}
              </Button>
              <Button onClick={next} variant="ghost">
                {tc('skip')}
              </Button>
            </div>
          </QuestionCard>
        )}

        {current === 'job' && (
          <QuestionCard stepKey="job" question={t('jobQuestion')}>
            {adapt && (
              <p className="p-3 rounded-2xl bg-[#DFF1FF]/70 text-sm text-[#1F5E82] flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                {t('adaptNotice')}
              </p>
            )}
            <Input
              aria-label={t('jobAria')}
              placeholder={t('jobPlaceholder')}
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
            />
            <Button onClick={next} fullWidth size="lg">
              {tc('continue')}
            </Button>
          </QuestionCard>
        )}

        {current === 'template' && (
          <QuestionCard stepKey="template" question={t('templateQuestion')}>
            <div className="grid gap-2.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setTemplateId(tpl.id);
                    next();
                  }}
                  className={`text-left p-4 rounded-2xl border transition ${
                    templateId === tpl.id ? 'border-[#FF7A59] bg-[#FFE8DC]' : 'border-[#F3E3D6] hover:bg-[#FFE8DC]/50'
                  }`}
                >
                  <div className="font-bold text-base text-[#2E241F]">{tpl.name}</div>
                  <div className="text-sm text-[#83726A]">{tpl.description}</div>
                </button>
              ))}
            </div>
          </QuestionCard>
        )}

        {current === 'facts' && (
          <QuestionCard stepKey="facts" question={hasFacts ? t('factsKnown') : t('factsUnknown')}>
            {hasFacts ? (
              <ul className="space-y-2 text-sm">
                {p.experiences.map((e) => (
                  <li key={e.id} className="flex gap-2 p-3 rounded-xl bg-[#FFF9F3] border border-[#F3E3D6]">
                    <Check size={16} className="text-[#2BB673] shrink-0 mt-0.5" />
                    <span>
                      <strong>{e.title}</strong> — {e.company} · {formatMonthYear(e.startDate)} –{' '}
                      {e.isCurrent ? tc('today') : formatMonthYear(e.endDate)}
                    </span>
                  </li>
                ))}
                {p.educations.map((e) => (
                  <li key={e.id} className="flex gap-2 p-3 rounded-xl bg-[#FFF9F3] border border-[#F3E3D6]">
                    <Check size={16} className="text-[#2BB673] shrink-0 mt-0.5" />
                    <span>
                      <strong>{e.degree}</strong> — {e.school}
                    </span>
                  </li>
                ))}
                {p.skills.length > 0 && (
                  <li className="flex gap-2 p-3 rounded-xl bg-[#FFF9F3] border border-[#F3E3D6]">
                    <Check size={16} className="text-[#2BB673] shrink-0 mt-0.5" />
                    <span>{t('factsSkills', { list: p.skills.map((s) => s.name).join(', ') })}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-[#83726A]">{t('factsEmptyText')}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => create.mutate()} loading={create.isPending} size="lg" className="flex-1">
                {create.isPending ? t('creating') : hasFacts ? t('confirmFacts') : t('continueAnyway')}
                <ArrowRight size={18} />
              </Button>
              <Link
                href="/profile"
                className="text-center px-4 py-3.5 rounded-xl border border-[#F3E3D6] text-sm font-semibold text-[#2E241F] hover:bg-[#FFF9F3]"
              >
                {hasFacts ? t('fixProfile') : t('completeProfile')}
              </Link>
            </div>
          </QuestionCard>
        )}
      </div>
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewDocumentWizard />
    </Suspense>
  );
}
