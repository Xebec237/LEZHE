'use client';

import { useTranslations } from 'next-intl';
import type { DocumentStatus, DocumentType, Profile, SectionDefinition } from './types';

/** Modèles de document disponibles (le rendu réel vit dans le backend, `render-html.ts`). */
export const TEMPLATE_IDS = ['ats', 'minimal', 'modern'] as const;
export const TEMPLATES = TEMPLATE_IDS.map((id) => ({ id, name: id === 'ats' ? 'ATS' : id === 'minimal' ? 'Minimal' : 'Modern' }));

export type { SectionDefinition };

export const SECTIONS_BY_DOCUMENT_TYPE: Record<DocumentType, SectionDefinition[]> = {
  CV: [
    { type: 'SUMMARY', order: 1, essential: true },
    { type: 'EXPERIENCE_1', order: 2, essential: false },
    { type: 'SKILLS_SUMMARY', order: 3, essential: false },
  ],
  COVER_LETTER: [{ type: 'COVER_LETTER_BODY', order: 1, essential: true }],
  RECOMMENDATION_LETTER: [{ type: 'RECOMMENDATION_LETTER_BODY', order: 1, essential: true }],
};

export function useDocumentTypeLabels(): Record<DocumentType, string> {
  const tType = useTranslations('documentTypes');
  return { CV: tType('CV'), COVER_LETTER: tType('COVER_LETTER'), RECOMMENDATION_LETTER: tType('RECOMMENDATION_LETTER') };
}

export function useDocumentStatusLabels(): Record<DocumentStatus, string> {
  const tStatus = useTranslations('documentStatus');
  return { DRAFT: tStatus('DRAFT'), READY: tStatus('READY'), EXPORTED: tStatus('EXPORTED') };
}

/** Titre lisible d'une section ; retombe sur le type technique si la clé n'existe pas. */
export function useSectionTitle() {
  const tSection = useTranslations('sections');
  return (type: string) => {
    try {
      return tSection(type as never);
    } catch {
      return type;
    }
  };
}

export function useTemplateOptions() {
  const tTemplate = useTranslations('templates');
  return TEMPLATE_IDS.map((id) => ({
    id,
    name: tTemplate(id),
    description: tTemplate(`${id}Description` as never),
  }));
}

export function firstName(fullName?: string | null): string {
  return fullName?.trim().split(/\s+/)[0] ?? '';
}

export function formatMonthYear(date?: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

/** Barre d'achèvement partagée par le dashboard, l'onboarding et la page profil. */
export function computeProfileCompletion(profile: Profile | null | undefined) {
  const checks: { key: string; done: boolean }[] = [
    { key: 'headline', done: !!profile?.headline },
    { key: 'location', done: !!profile?.location },
    { key: 'summary', done: !!profile?.summary },
    { key: 'experience', done: (profile?.experiences.length ?? 0) > 0 },
    { key: 'education', done: (profile?.educations.length ?? 0) > 0 },
    { key: 'skills', done: (profile?.skills.length ?? 0) >= 3 },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missingKeys: checks.filter((c) => !c.done).map((c) => c.key),
  };
}
