'use client';

import { useDocumentStatusLabels } from '@/lib/labels';
import type { DocumentStatus } from '@/lib/types';

const STYLES: Record<DocumentStatus, string> = {
  DRAFT: 'bg-[#F3E3D6] text-[#6B5B53]',
  READY: 'bg-[#FFD9C7] text-[#9A3A20]',
  EXPORTED: 'bg-[#DDF5E7] text-[#1F7A4F]',
};

export default function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const labels = useDocumentStatusLabels();
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STYLES[status]}`}>{labels[status]}</span>;
}
