'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';

/**
 * Schémas Zod partagés par tous les formulaires (React Hook Form).
 * Les messages passent par les clés de traduction — aucun texte en dur.
 * Rappel 4.0 : cette validation sert le confort de saisie ; le backend revalide toujours.
 */
export function useSchemas() {
  const t = useTranslations('validation');

  const required = (max = 200) =>
    z
      .string()
      .trim()
      .min(1, t('required'))
      .max(max, t('tooLong', { max }));

  const month = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, t('monthRequired'));

  const optionalMonth = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, t('monthRequired'))
    .optional()
    .or(z.literal(''));

  const login = z.object({
    email: z.string().trim().min(1, t('required')).email(t('email')),
    password: z.string().min(6, t('passwordMin')),
  });

  const register = login.extend({
    fullName: z.string().trim().min(2, t('nameMin')).max(120, t('tooLong', { max: 120 })),
    phone: z.string().trim().max(30, t('tooLong', { max: 30 })).optional().or(z.literal('')),
  });

  const identity = z.object({
    headline: z.string().trim().max(120, t('tooLong', { max: 120 })).optional().or(z.literal('')),
    location: z.string().trim().max(120, t('tooLong', { max: 120 })).optional().or(z.literal('')),
    summary: z.string().trim().max(2000, t('tooLong', { max: 2000 })).optional().or(z.literal('')),
    careerGoal: z.string().trim().max(2000, t('tooLong', { max: 2000 })).optional().or(z.literal('')),
  });

  const datedRange = { start: month, end: optionalMonth, isCurrent: z.boolean().optional() };
  const checkOrder = (data: { start: string; end?: string; isCurrent?: boolean }) =>
    !data.end || data.isCurrent || data.end >= data.start;

  const experience = z
    .object({
      title: required(120),
      company: required(120),
      location: z.string().trim().max(120, t('tooLong', { max: 120 })).optional().or(z.literal('')),
      description: z.string().trim().max(2000, t('tooLong', { max: 2000 })).optional().or(z.literal('')),
      ...datedRange,
    })
    .refine(checkOrder, { message: t('endBeforeStart'), path: ['end'] });

  const education = z
    .object({
      degree: required(120),
      school: required(120),
      field: z.string().trim().max(120, t('tooLong', { max: 120 })).optional().or(z.literal('')),
      ...datedRange,
    })
    .refine(checkOrder, { message: t('endBeforeStart'), path: ['end'] });

  const skill = z.object({ name: required(80) });

  const language = z.object({
    name: required(60),
    level: z.enum(['NOTIONS', 'INTERMEDIAIRE', 'COURANT', 'BILINGUE', 'NATIF']),
  });

  const certification = z.object({
    name: required(120),
    issuer: z.string().trim().max(120, t('tooLong', { max: 120 })).optional().or(z.literal('')),
    issuedAt: optionalMonth,
  });

  const project = z.object({
    name: required(120),
    description: z.string().trim().max(2000, t('tooLong', { max: 2000 })).optional().or(z.literal('')),
    url: z.string().trim().url(t('url')).optional().or(z.literal('')),
  });

  const achievement = z.object({
    title: required(160),
    description: z.string().trim().max(2000, t('tooLong', { max: 2000 })).optional().or(z.literal('')),
  });

  const refine = z.object({
    sectionType: z.string().min(1),
    instruction: required(300),
  });

  return { login, register, identity, experience, education, skill, language, certification, project, achievement, refine };
}

export type LoginValues = z.infer<ReturnType<typeof useSchemas>['login']>;
export type RegisterValues = z.infer<ReturnType<typeof useSchemas>['register']>;
export type IdentityValues = z.infer<ReturnType<typeof useSchemas>['identity']>;
export type ExperienceValues = z.infer<ReturnType<typeof useSchemas>['experience']>;
export type EducationValues = z.infer<ReturnType<typeof useSchemas>['education']>;
export type SkillValues = z.infer<ReturnType<typeof useSchemas>['skill']>;
export type LanguageValues = z.infer<ReturnType<typeof useSchemas>['language']>;
export type CertificationValues = z.infer<ReturnType<typeof useSchemas>['certification']>;
export type ProjectValues = z.infer<ReturnType<typeof useSchemas>['project']>;
export type AchievementValues = z.infer<ReturnType<typeof useSchemas>['achievement']>;
export type RefineValues = z.infer<ReturnType<typeof useSchemas>['refine']>;

/** "2024-03" -> "2024-03-01" (le backend attend une date ISO). */
export function monthToIso(month?: string | null): string | undefined {
  return month ? `${month}-01` : undefined;
}
