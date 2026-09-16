'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FileText, Sparkles, PenLine, Target, ArrowRight, Plus } from 'lucide-react';
import { useDocuments, useProfile } from '@/lib/queries';
import { computeProfileCompletion, firstName, useDocumentTypeLabels } from '@/lib/labels';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import DocumentStatusBadge from '@/components/ui/DocumentStatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tChecklist = useTranslations('profileChecklist');
  const typeLabels = useDocumentTypeLabels();
  const profile = useProfile();
  const documents = useDocuments();

  if (profile.isPending) return <PageSkeleton />;
  if (profile.isError) return <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />;

  const { percent, missingKeys } = computeProfileCompletion(profile.data);
  const recent = documents.data?.slice(0, 3) ?? [];

  const actions = [
    { href: '/documents/new?type=CV', title: t('createCv'), description: t('createCvDescription'), Icon: FileText, tint: 'bg-[#FFE8DC] text-[#9A3A20]' },
    { href: '/documents/new?type=COVER_LETTER', title: t('writeLetter'), description: t('writeLetterDescription'), Icon: PenLine, tint: 'bg-[#FFD98A]/50 text-[#2E241F]' },
    { href: '/documents/new?type=COVER_LETTER&adapt=1', title: t('adaptApplication'), description: t('adaptApplicationDescription'), Icon: Target, tint: 'bg-[#DFF1FF] text-[#1F5E82]' },
    { href: '/skills/discover', title: t('exploreSkills'), description: t('exploreSkillsDescription'), Icon: Sparkles, tint: 'bg-[#DDF5E7] text-[#1F7A4F]' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E241F]">{t('greeting', { name: firstName(profile.data.user.fullName) })}</h1>
          <p className="text-base text-[#83726A]">{t('question')}</p>
        </Card>
      </motion.div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label={t('quickActions')}>
        {actions.map(({ href, title, description, Icon, tint }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Link
              href={href}
              className="h-full block bg-white p-5 rounded-3xl border border-[#F3E3D6] shadow-card hover:border-[#FF7A59] hover:-translate-y-0.5 transition space-y-3 group"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tint}`}>
                <Icon size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#2E241F] text-base group-hover:text-[#FF7A59] transition">{title}</h2>
                <p className="text-sm text-[#83726A] mt-1">{description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#2E241F]">{t('profileTitle')}</h2>
            <p className="text-sm text-[#83726A]">{t('profileSubtitle')}</p>
          </div>
          <span className="text-sm font-extrabold text-[#9A3A20] bg-[#FFE8DC] px-3 py-1 rounded-full shrink-0">{percent} %</span>
        </div>
        <ProgressBar value={percent} label={`${percent} %`} />
        <div className="p-4 rounded-2xl bg-[#DFF1FF]/60 border border-[#3AA9E0]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-[#2E241F]">
            {missingKeys.length === 0
              ? t('profileComplete')
              : t('profileMissing', {
                  count: missingKeys.length,
                  items: missingKeys.slice(0, 3).map((key) => tChecklist(key as never)).join(', '),
                })}
          </p>
          {missingKeys.length > 0 && (
            <Link href={percent < 50 ? '/onboarding' : '/profile'} className="text-sm font-bold text-[#FF7A59] hover:underline shrink-0">
              {t('completeProfile')}
            </Link>
          )}
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2E241F]">{t('recentDocuments')}</h2>
          <Link href="/documents" className="text-sm font-bold text-[#FF7A59] hover:underline">
            {t('seeAll')}
          </Link>
        </div>

        {documents.isPending ? (
          <div className="h-24 rounded-3xl bg-[#F3E3D6]/60 animate-pulse motion-reduce:animate-none" />
        ) : recent.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-[#FF7A59]/40 text-center space-y-3">
            <p className="text-base text-[#2E241F] font-semibold">{t('emptyTitle')}</p>
            <p className="text-sm text-[#83726A]">{t('emptyText')}</p>
            <Link
              href="/documents/new?type=CV"
              className="inline-flex items-center gap-2 bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold text-sm px-5 py-3 rounded-xl transition"
            >
              <Plus size={16} /> {t('emptyCta')}
            </Link>
          </div>
        ) : (
          <ul className="bg-white rounded-3xl border border-[#F3E3D6] shadow-card divide-y divide-[#F3E3D6]">
            {recent.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between gap-4 p-4 sm:px-6 hover:bg-[#FFF9F3] transition first:rounded-t-3xl last:rounded-b-3xl"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#2E241F] truncate">{doc.title}</div>
                    <div className="text-sm text-[#83726A]">
                      {typeLabels[doc.type]} · {t('modifiedOn', { date: new Date(doc.updatedAt).toLocaleDateString('fr-FR') })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <DocumentStatusBadge status={doc.status} />
                    <ArrowRight size={16} className="text-[#83726A]" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
