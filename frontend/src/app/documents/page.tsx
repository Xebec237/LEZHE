'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { apiFetch, errorMessage } from '@/lib/api';
import { queryKeys, useDocuments } from '@/lib/queries';
import type { DocumentType } from '@/lib/types';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import DocumentCard from '@/components/ui/DocumentCard';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';

type Filter = 'ALL' | DocumentType;

export default function DocumentsPage() {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const toast = useToast();
  const documents = useDocuments();
  const [filter, setFilter] = useState<Filter>('ALL');

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      toast.success(t('deleted'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (documents.isPending) return <PageSkeleton />;
  if (documents.isError) return <ErrorState message={documents.error.message} onRetry={() => documents.refetch()} />;

  const filtered = documents.data.filter((d) => filter === 'ALL' || d.type === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card as="header" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E241F]">{t('title')}</h1>
          <p className="text-base text-[#83726A]">{t('subtitle')}</p>
        </div>
        <Link
          href="/documents/new?type=CV"
          className="bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold text-sm px-5 py-3 rounded-2xl transition flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> {t('create')}
        </Link>
      </Card>

      <Tabs
        ariaLabel={t('filterLabel')}
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'ALL', label: t('filterAll') },
          { id: 'CV', label: t('filterCv') },
          { id: 'COVER_LETTER', label: t('filterCoverLetter') },
          { id: 'RECOMMENDATION_LETTER', label: t('filterRecommendation') },
        ]}
      />

      {filtered.length === 0 ? (
        <Card className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE8DC] text-[#FF7A59] flex items-center justify-center mx-auto">
            <FileText size={22} />
          </div>
          <h2 className="text-lg font-bold text-[#2E241F]">
            {documents.data.length === 0 ? t('emptyFirstTitle') : t('emptyFilteredTitle')}
          </h2>
          <p className="text-sm text-[#83726A]">{t('emptyText')}</p>
          <Link
            href={`/documents/new?type=${filter === 'ALL' ? 'CV' : filter}`}
            className="inline-flex items-center gap-2 bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold text-sm px-5 py-3 rounded-xl transition"
          >
            <Plus size={16} /> {t('create')}
          </Link>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={() => confirm(tc('confirmDelete', { label: doc.title })) && remove.mutate(doc.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
