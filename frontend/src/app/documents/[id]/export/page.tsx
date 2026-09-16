'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Circle, Download, Loader2, Pencil, RefreshCw, Share2, FileType } from 'lucide-react';
import { apiDownload, apiFetch, errorMessage } from '@/lib/api';
import { queryKeys, useDocument } from '@/lib/queries';
import { useDocumentTypeLabels } from '@/lib/labels';
import type { ExportJob } from '@/lib/types';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

type Phase = 'checklist' | 'running' | 'done' | 'failed';

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('export');
  const tc = useTranslations('common');
  const typeLabels = useDocumentTypeLabels();
  const toast = useToast();
  const queryClient = useQueryClient();
  const doc = useDocument(id);

  const [phase, setPhase] = useState<Phase>('checklist');
  const [jobId, setJobId] = useState<string | null>(null);
  const [visualStep, setVisualStep] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const starting = useRef(false);

  const steps = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5')];

  // Étapes purement visuelles : le backend ne renvoie que QUEUED / PROCESSING / DONE / FAILED
  useEffect(() => {
    if (phase !== 'running') return;
    const timer = setInterval(() => setVisualStep((s) => Math.min(s + 1, steps.length - 2)), 700);
    return () => clearInterval(timer);
  }, [phase, steps.length]);

  useEffect(() => {
    if (phase !== 'running' || !jobId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const job = await apiFetch<ExportJob>(`/documents/${id}/export/${jobId}`);
        if (cancelled) return;
        if (job.status === 'DONE') {
          setVisualStep(steps.length - 1);
          setPhase('done');
          queryClient.invalidateQueries({ queryKey: queryKeys.documents });
          queryClient.invalidateQueries({ queryKey: queryKeys.document(id) });
          toast.success(t('toastReady'));
          return;
        }
        if (job.status === 'FAILED') {
          setPhase('failed');
          return;
        }
      } catch {
        // coupure réseau passagère : nouvelle tentative au tour suivant
      }
      if (!cancelled) setTimeout(poll, 1200);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [phase, jobId, id, queryClient, toast, t, steps.length]);

  if (doc.isPending) return <PageSkeleton />;
  if (doc.isError) return <ErrorState message={doc.error.message} onRetry={() => doc.refetch()} />;
  const d = doc.data;

  const start = async () => {
    if (starting.current) return;
    starting.current = true;
    setVisualStep(0);
    try {
      const job = await apiFetch<ExportJob>(`/documents/${id}/export`, { method: 'POST' });
      setJobId(job.id);
      setPhase('running');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      starting.current = false;
    }
  };

  const lastExport = d.exportJobs?.[0];
  const downloadJobId = jobId ?? (lastExport?.status === 'DONE' ? lastExport.id : null);

  const download = async () => {
    if (!downloadJobId) return;
    setDownloading(true);
    try {
      await apiDownload(`/documents/${id}/export/${downloadJobId}/download`, `${d.title}.pdf`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    const text = t('shareText', { type: typeLabels[d.type].toLowerCase() });
    if (navigator.share) {
      await navigator.share({ title: d.title, text }).catch(() => undefined);
    } else {
      toast.info(t('shareFallback'));
    }
  };

  const confirmedCount = d.sections.filter((s) => s.content?.trim()).length;
  const checks = [
    { label: t('checkContent'), detail: t('checkContentDetail', { count: confirmedCount }), ok: d.canExport },
    { label: t('checkLayout'), detail: t('checkLayoutDetail', { template: d.templateId.toUpperCase() }), ok: true },
    { label: t('checkLanguage'), detail: t('checkLanguageDetail'), ok: true },
    { label: t('checkFormat'), detail: t('checkFormatDetail'), ok: true },
    { label: t('checkZeroFabrication'), detail: t('checkZeroFabricationDetail'), ok: true },
  ];
  const hasPrevious = phase === 'checklist' && !!downloadJobId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <Link href={`/documents/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#83726A] hover:text-[#2E241F]">
        <ArrowLeft size={16} /> {t('backToEditor')}
      </Link>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#F3E3D6] shadow-card space-y-6">
        {phase === 'checklist' && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E241F]">{d.canExport ? t('readyTitle') : t('notReadyTitle')}</h1>
              <p className="text-base text-[#83726A]">{d.title}</p>
            </div>
            <ul className="space-y-2">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border ${c.ok ? 'bg-[#DDF5E7]/50 border-[#2BB673]/20' : 'bg-[#FBE7E5]/60 border-[#E2645A]/30'}`}
                >
                  {c.ok ? <CheckCircle2 className="text-[#2BB673] shrink-0" size={20} /> : <Circle className="text-[#E2645A] shrink-0" size={20} />}
                  <div>
                    <div className="font-semibold text-[#2E241F]">{c.label}</div>
                    <div className="text-sm text-[#83726A]">{c.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
            {d.canExport ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={start} size="lg" className="flex-1">
                  <FileType size={18} /> {hasPrevious ? t('generateAgain') : t('generate')}
                </Button>
                {hasPrevious && (
                  <Button onClick={download} loading={downloading} variant="success" size="lg" className="flex-1">
                    <Download size={18} /> {t('downloadLast')}
                  </Button>
                )}
              </div>
            ) : (
              <Link href={`/documents/${id}`} className="block text-center bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold py-4 rounded-2xl">
                {t('validateSections')}
              </Link>
            )}
          </>
        )}

        {(phase === 'running' || phase === 'done') && (
          <>
            <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-[#2E241F]">{phase === 'done' ? t('doneTitle') : t('running')}</h1>
            <ol className="space-y-2.5">
              {steps.map((label, i) => {
                const finished = phase === 'done' || i < visualStep;
                const current = phase === 'running' && i === visualStep;
                return (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-base ${
                      finished
                        ? 'bg-[#DDF5E7]/60 border-[#2BB673]/25 text-[#1F7A4F] font-semibold'
                        : current
                          ? 'bg-[#FFE8DC] border-[#FF7A59] text-[#9A3A20] font-bold'
                          : 'bg-[#FFF9F3] border-[#F3E3D6] text-[#83726A]'
                    }`}
                  >
                    {label}
                    {finished ? <CheckCircle2 size={18} /> : current ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" /> : <Circle size={18} />}
                  </motion.li>
                );
              })}
            </ol>
            {phase === 'done' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <Button onClick={download} loading={downloading} fullWidth size="lg">
                  <Download size={20} /> {downloading ? t('downloading') : t('download')}
                </Button>
                <div className="grid grid-cols-3 gap-2 text-sm font-semibold">
                  <Link href={`/documents/${id}`} className="py-3 rounded-xl border border-[#F3E3D6] text-center hover:bg-[#FFF9F3] inline-flex items-center justify-center gap-1.5">
                    <Pencil size={14} /> {t('edit')}
                  </Link>
                  <button onClick={share} className="py-3 rounded-xl border border-[#F3E3D6] hover:bg-[#FFF9F3] inline-flex items-center justify-center gap-1.5">
                    <Share2 size={14} /> {t('share')}
                  </button>
                  <span className="py-3 rounded-xl border border-dashed border-[#F3E3D6] text-[#83726A] text-center">{t('docxSoon')}</span>
                </div>
              </motion.div>
            )}
          </>
        )}

        {phase === 'failed' && (
          <div className="text-center space-y-4 py-4">
            <h1 className="text-2xl font-extrabold text-[#2E241F]">{t('failedTitle')}</h1>
            <p className="text-base text-[#83726A]">{t('failedText')}</p>
            <Button onClick={start} size="lg">
              <RefreshCw size={16} /> {tc('retry')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
