'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { SECTIONS_BY_DOCUMENT_TYPE, TEMPLATES, useDocumentTypeLabels } from '@/lib/labels';
import type { DocumentSummary } from '@/lib/types';
import DocumentStatusBadge from './DocumentStatusBadge';

/** Miniature schématique : une barre par section, verte quand la section est validée. */
function Thumbnail({ doc }: { doc: DocumentSummary }) {
  const defs = SECTIONS_BY_DOCUMENT_TYPE[doc.type];
  const confirmed = defs.filter((d) => doc.sections.some((s) => s.type === d.type && s.content?.trim())).length;
  const accent = doc.templateId === 'modern' ? 'bg-[#FF7A59]' : doc.templateId === 'minimal' ? 'bg-[#2E241F]' : 'bg-[#1F3A5F]';
  return (
    <div className="w-16 h-20 shrink-0 rounded-lg bg-white border border-[#F3E3D6] p-1.5 flex flex-col gap-1" aria-hidden>
      <div className={`h-1.5 w-8 rounded ${accent}`} />
      {defs.map((d, i) => (
        <div key={d.type} className={`h-1 rounded ${i < confirmed ? 'bg-[#2BB673]/60' : 'bg-[#F3E3D6]'}`} />
      ))}
      <div className="h-1 w-10 rounded bg-[#F3E3D6]" />
      <div className="h-1 w-7 rounded bg-[#F3E3D6]" />
    </div>
  );
}

export default function DocumentCard({ doc, onDelete }: { doc: DocumentSummary; onDelete: () => void }) {
  const t = useTranslations('documents');
  const typeLabels = useDocumentTypeLabels();
  const template = TEMPLATES.find((tpl) => tpl.id === doc.templateId)?.name ?? doc.templateId;
  const lastExport = doc.exportJobs[0];

  return (
    <li className="bg-white p-5 rounded-3xl border border-[#F3E3D6] shadow-card hover:border-[#FF7A59]/40 transition flex flex-col gap-4">
      <div className="flex gap-4">
        <Thumbnail doc={doc} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#B3462A]">{typeLabels[doc.type]}</span>
            <DocumentStatusBadge status={doc.status} />
          </div>
          <h3 className="text-lg font-bold text-[#2E241F] truncate">{doc.title}</h3>
          <p className="text-sm text-[#83726A]">
            {template} · {doc.language.toUpperCase()} · {new Date(doc.updatedAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[#F3E3D6]">
        <Link
          href={`/documents/${doc.id}`}
          className="flex-1 bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
        >
          <Pencil size={14} /> {t('edit')}
        </Link>
        <Link
          href={`/documents/${doc.id}/export`}
          className="px-3 py-2.5 bg-[#FFF9F3] hover:bg-[#FFE8DC] text-[#2E241F] border border-[#F3E3D6] rounded-xl text-sm font-semibold flex items-center gap-1.5"
        >
          <Download size={14} /> {lastExport?.status === 'DONE' ? t('download') : t('pdf')}
        </Link>
        <button
          onClick={onDelete}
          aria-label={t('deleteLabel', { title: doc.title })}
          className="p-2.5 text-[#E2645A] hover:bg-[#FBE7E5] rounded-xl transition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}
