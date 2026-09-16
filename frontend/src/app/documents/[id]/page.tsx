'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Eye, ShieldCheck, Sparkles } from 'lucide-react';
import { apiFetch, errorMessage } from '@/lib/api';
import { queryKeys, useDocument } from '@/lib/queries';
import { SECTIONS_BY_DOCUMENT_TYPE, useDocumentTypeLabels, useSectionTitle, useTemplateOptions } from '@/lib/labels';
import type { RefineValues } from '@/lib/validation';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import ProgressBar from '@/components/ui/ProgressBar';
import Tooltip from '@/components/ui/Tooltip';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import SectionCard from '@/components/editor/SectionCard';
import DocumentPreview from '@/components/editor/DocumentPreview';
import AiAssistant from '@/components/editor/AiAssistant';

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('editor');
  const typeLabels = useDocumentTypeLabels();
  const sectionTitle = useSectionTitle();
  const templates = useTemplateOptions();
  const queryClient = useQueryClient();
  const toast = useToast();
  const doc = useDocument(id);

  const [generating, setGenerating] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false); // colonne desktop
  const [showAssistantSheet, setShowAssistantSheet] = useState(false); // feuille mobile
  const [templateId, setTemplateId] = useState<string | null>(null);

  const activeTemplate = templateId ?? doc.data?.templateId ?? 'ats';
  const previewTemplate = useDebounced(activeTemplate);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.document(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.documents });
  };

  const generate = useMutation({
    mutationFn: (vars: { sectionType: string; order: number }) =>
      apiFetch(`/documents/${id}/sections/generate`, { method: 'POST', body: JSON.stringify(vars) }),
    onMutate: (vars) => setGenerating(vars.sectionType),
    onSuccess: () => {
      refresh();
      toast.info(t('toastGenerated'));
    },
    onError: (err) => toast.error(errorMessage(err)),
    onSettled: () => setGenerating(null),
  });

  const review = useMutation({
    mutationFn: (vars: { suggestionId: string; action: 'CONFIRM' | 'EDIT' | 'REJECT'; editedContent?: string }) =>
      apiFetch(`/documents/${id}/sections/confirm`, { method: 'POST', body: JSON.stringify(vars) }),
    onSuccess: (_d, vars) => {
      refresh();
      toast.success(vars.action === 'REJECT' ? t('toastRejected') : t('toastValidated'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const manual = useMutation({
    mutationFn: (vars: { sectionType: string; order: number; content: string }) =>
      apiFetch(`/documents/${id}/sections/manual`, { method: 'POST', body: JSON.stringify(vars) }),
    onSuccess: () => {
      refresh();
      toast.success(t('toastSaved'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const refine = useMutation({
    mutationFn: (values: RefineValues) =>
      apiFetch(`/documents/${id}/sections/refine`, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (_d, values) => {
      refresh();
      toast.success(t('assistantResult', { section: sectionTitle(values.sectionType) }));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const changeTemplate = useMutation({
    mutationFn: (newTemplate: string) => apiFetch(`/documents/${id}`, { method: 'PATCH', body: JSON.stringify({ templateId: newTemplate }) }),
    onSuccess: refresh,
    onError: (err) => {
      setTemplateId(null);
      toast.error(errorMessage(err));
    },
  });

  if (doc.isPending) return <PageSkeleton />;
  if (doc.isError) return <ErrorState message={doc.error.message} onRetry={() => doc.refetch()} />;

  const d = doc.data;
  const definitions = SECTIONS_BY_DOCUMENT_TYPE[d.type];
  const validated = definitions.filter((def) => d.sections.find((s) => s.type === def.type)?.content?.trim()).length;
  const busy = review.isPending || manual.isPending;
  const essentialTitle = sectionTitle(definitions.find((def) => def.essential)?.type ?? '');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <header className="bg-white p-4 sm:p-5 rounded-3xl border border-[#F3E3D6] shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/documents" aria-label={t('previewClose')} className="p-2 rounded-xl bg-[#FFF9F3] border border-[#F3E3D6] hover:bg-[#FFE8DC] shrink-0">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#2E241F] truncate">{d.title}</h1>
              <p className="text-sm text-[#83726A]">
                {typeLabels[d.type]}
                {d.targetCountry ? ` · ${d.targetCountry}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Select
                aria-label={t('templateLabel')}
                value={activeTemplate}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  changeTemplate.mutate(e.target.value);
                }}
                options={templates.map((tpl) => ({ value: tpl.id, label: t('templateOption', { name: tpl.name }) }))}
              />
            </div>

            <Button variant="secondary" onClick={() => setShowAssistant((v) => !v)} className="hidden lg:inline-flex">
              <Sparkles size={16} />
              {showAssistant ? t('assistantClose') : t('assistantOpen')}
            </Button>

            {d.canExport ? (
              <Link
                href={`/documents/${id}/export`}
                className="bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold text-sm px-5 py-3 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Download size={16} /> {t('exportPdf')}
              </Link>
            ) : (
              <Tooltip label={t('exportBlocked', { section: essentialTitle })}>
                <Button disabled>
                  <Download size={16} /> {t('exportPdf')}
                </Button>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[#2E241F]">{t('progress', { validated, total: definitions.length })}</span>
            <span className="text-[#83726A] inline-flex items-center gap-1">
              <ShieldCheck size={15} className="text-[#2BB673]" /> {t('guarantee')}
            </span>
          </div>
          <ProgressBar value={(validated / definitions.length) * 100} label={t('progress', { validated, total: definitions.length })} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNE 1 — sections à éditer */}
        <div className={`space-y-4 ${showAssistant ? 'lg:col-span-4' : 'lg:col-span-6'}`}>
          {definitions.map((def) => (
            <SectionCard
              key={def.type}
              definition={def}
              section={d.sections.find((s) => s.type === def.type)}
              busy={busy || generating === def.type}
              onGenerate={() => generate.mutate({ sectionType: def.type, order: def.order })}
              onReview={(suggestionId, action, editedContent) => review.mutateAsync({ suggestionId, action, editedContent })}
              onManualSave={(content) => manual.mutateAsync({ sectionType: def.type, order: def.order, content })}
            />
          ))}
          {d.profile.experiences.length === 0 && (
            <p className="p-4 rounded-2xl bg-[#DFF1FF]/70 text-sm text-[#1F5E82]">
              {t('emptyProfileNotice')}{' '}
              <Link href="/profile" className="font-bold underline">
                {t('completeProfile')}
              </Link>
            </p>
          )}
        </div>

        {/* COLONNE 2 — aperçu temps réel (contenu validé uniquement) */}
        <aside className={`hidden lg:block lg:sticky lg:top-20 space-y-2 ${showAssistant ? 'lg:col-span-5' : 'lg:col-span-6'}`}>
          <h2 className="text-sm font-bold text-[#83726A]">{t('previewTitle')}</h2>
          <DocumentPreview document={d} templateId={previewTemplate} />
        </aside>

        {/* COLONNE 3 — assistant IA, activable */}
        {showAssistant && (
          <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-20">
            <AiAssistant
              definitions={definitions}
              sections={d.sections}
              busy={refine.isPending}
              onRefine={(values) => refine.mutateAsync(values)}
            />
          </aside>
        )}
      </div>

      {/* Mobile : aperçu et assistant derrière deux boutons flottants */}
      <div className="lg:hidden fixed right-4 bottom-24 z-30 flex flex-col gap-2">
        <button
          onClick={() => setShowAssistantSheet(true)}
          className="bg-white border border-[#F3E3D6] text-[#2E241F] font-bold text-sm px-4 py-3 rounded-full shadow-lg inline-flex items-center gap-2"
        >
          <Sparkles size={16} className="text-[#FF7A59]" /> {t('assistantTitle')}
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="bg-[#2E241F] text-white font-bold text-sm px-4 py-3 rounded-full shadow-lg inline-flex items-center gap-2"
        >
          <Eye size={16} /> {t('previewButton')}
        </button>
      </div>

      <Modal open={showPreview} onClose={() => setShowPreview(false)} title={t('previewButton')} variant="sheet">
        <DocumentPreview document={d} templateId={previewTemplate} />
      </Modal>

      <div className="lg:hidden">
        <Modal open={showAssistantSheet} onClose={() => setShowAssistantSheet(false)} title={t('assistantTitle')} variant="sheet">
          <AiAssistant
            definitions={definitions}
            sections={d.sections}
            busy={refine.isPending}
            onRefine={async (values) => {
              await refine.mutateAsync(values);
              setShowAssistantSheet(false);
            }}
          />
        </Modal>
      </div>
    </div>
  );
}
