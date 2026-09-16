'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Download, Trash2, FileText, Brain, AlertTriangle } from 'lucide-react';
import { apiFetch, errorMessage } from '@/lib/api';
import { signOut } from '@/lib/auth';
import { useProfile } from '@/lib/queries';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const toast = useToast();
  const profile = useProfile();
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const confirmWord = t('confirmWord');

  const deleteAccount = useMutation({
    mutationFn: () => apiFetch('/auth/me', { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(t('toastDeleted'));
      signOut('/');
      queryClient.clear();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (profile.isPending) return <PageSkeleton />;
  if (profile.isError) return <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />;

  const soon = [
    { Icon: Download, title: t('exportData'), description: t('exportDataDescription') },
    { Icon: Brain, title: t('aiMemory'), description: t('aiMemoryDescription') },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Card as="header" className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5E7] text-[#1F7A4F] font-semibold text-sm">
          <ShieldCheck size={16} /> {t('badge')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E241F]">{t('title')}</h1>
        <p className="text-base text-[#83726A]">{t('loggedInAs', { email: profile.data.user.email })}</p>
      </Card>

      <section className="bg-white rounded-3xl border border-[#F3E3D6] shadow-card divide-y divide-[#F3E3D6]">
        <Link href="/documents" className="flex items-center gap-4 p-5 hover:bg-[#FFF9F3] rounded-t-3xl">
          <FileText className="text-[#FF7A59] shrink-0" size={22} />
          <div className="flex-1">
            <div className="font-semibold text-[#2E241F]">{t('manageDocuments')}</div>
            <div className="text-sm text-[#83726A]">{t('manageDocumentsDescription')}</div>
          </div>
          <span className="text-[#83726A]" aria-hidden>
            →
          </span>
        </Link>
        {soon.map(({ Icon, title, description }) => (
          <div key={title} className="flex items-center gap-4 p-5">
            <Icon className="text-[#83726A] shrink-0" size={22} />
            <div className="flex-1">
              <div className="font-semibold text-[#2E241F]">{title}</div>
              <div className="text-sm text-[#83726A]">{description}</div>
            </div>
            <span className="text-xs font-semibold bg-[#FFE8DC] text-[#9A3A20] px-2.5 py-1 rounded-full shrink-0">{tc('soon')}</span>
          </div>
        ))}
      </section>

      <Card className="border-[#E2645A]/30 space-y-4">
        <h2 className="text-lg font-bold text-[#B5433A] flex items-center gap-2">
          <Trash2 size={20} /> {t('deleteTitle')}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-2xl bg-[#FBE7E5]/60 space-y-1.5">
            <div className="font-semibold text-[#2E241F]">{t('willBeDeleted')}</div>
            <ul className="list-disc pl-5 text-[#2E241F] space-y-0.5">
              <li>{t('deleted1')}</li>
              <li>{t('deleted2')}</li>
              <li>{t('deleted3')}</li>
              <li>{t('deleted4')}</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#F3E3D6] space-y-1.5">
            <div className="font-semibold text-[#2E241F]">{t('willBeKept')}</div>
            <p className="text-[#83726A]">{t('keptText')}</p>
          </div>
        </div>

        {!showDelete ? (
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            {t('deleteCta')}
          </Button>
        ) : (
          <div className="p-4 rounded-2xl border border-[#E2645A]/40 space-y-3">
            <p className="text-sm text-[#2E241F] flex items-start gap-2">
              <AlertTriangle size={18} className="text-[#E2645A] shrink-0" />
              {t.rich('confirmText', { word: confirmWord, b: (chunks) => <strong>{chunks}</strong> })}
            </p>
            <Input
              aria-label={t('confirmAria', { word: confirmWord })}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="focus:border-[#E2645A]"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                className="bg-[#E2645A] text-white hover:bg-[#c9544b]"
                disabled={confirmText.trim().toUpperCase() !== confirmWord}
                loading={deleteAccount.isPending}
                onClick={() => deleteAccount.mutate()}
              >
                {deleteAccount.isPending ? t('deleting') : t('deleteConfirm')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmText('');
                }}
              >
                {tc('cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
