'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Briefcase, GraduationCap, Sparkles, Languages, Award, FolderGit2, Trophy, ShieldCheck, Plus } from 'lucide-react';
import { apiFetch, errorMessage } from '@/lib/api';
import { queryKeys, useProfile } from '@/lib/queries';
import { computeProfileCompletion, formatMonthYear } from '@/lib/labels';
import {
  monthToIso,
  useSchemas,
  type AchievementValues,
  type CertificationValues,
  type EducationValues,
  type ExperienceValues,
  type IdentityValues,
  type LanguageValues,
  type ProjectValues,
  type SkillValues,
} from '@/lib/validation';
import type { LanguageLevel, Profile } from '@/lib/types';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import ProgressBar from '@/components/ui/ProgressBar';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import SkillChip from '@/components/ui/SkillChip';
import { Input, Select, Textarea } from '@/components/ui/Field';
import CollectionSection from '@/components/profile/CollectionSection';

const LEVELS: LanguageLevel[] = ['NOTIONS', 'INTERMEDIAIRE', 'COURANT', 'BILINGUE', 'NATIF'];

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tLevels = useTranslations('languageLevels');
  const queryClient = useQueryClient();
  const toast = useToast();
  const profile = useProfile();
  const schemas = useSchemas();

  const mutate = useMutation({
    mutationFn: ({ endpoint, method, body }: { endpoint: string; method: string; body?: unknown; success: string }) =>
      apiFetch(endpoint, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      toast.success(variables.success);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const identityForm = useForm<IdentityValues>({ resolver: zodResolver(schemas.identity) });
  const experienceForm = useForm<ExperienceValues>({ resolver: zodResolver(schemas.experience), defaultValues: { isCurrent: false } });
  const educationForm = useForm<EducationValues>({ resolver: zodResolver(schemas.education) });
  const skillForm = useForm<SkillValues>({ resolver: zodResolver(schemas.skill) });
  const languageForm = useForm<LanguageValues>({ resolver: zodResolver(schemas.language), defaultValues: { level: 'INTERMEDIAIRE' } });
  const certificationForm = useForm<CertificationValues>({ resolver: zodResolver(schemas.certification) });
  const projectForm = useForm<ProjectValues>({ resolver: zodResolver(schemas.project) });
  const achievementForm = useForm<AchievementValues>({ resolver: zodResolver(schemas.achievement) });

  const experienceIsCurrent = useWatch({ control: experienceForm.control, name: 'isCurrent' });

  if (profile.isPending) return <PageSkeleton />;
  if (profile.isError) return <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />;

  const data: Profile = profile.data;
  const { percent } = computeProfileCompletion(data);

  const remove = (collection: string, id: string, label: string) => {
    if (!confirm(tc('confirmDelete', { label }))) return;
    mutate.mutate({ endpoint: `/profile/${collection}/${id}`, method: 'DELETE', success: t('toastDeleted') });
  };

  const add = (endpoint: string, body: unknown, reset: () => void) =>
    mutate.mutate({ endpoint, method: 'POST', body, success: t('toastAdded') }, { onSuccess: reset });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Card as="header" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={data.user.fullName} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E241F] truncate">{data.user.fullName}</h1>
              <p className="text-base text-[#83726A] truncate">{data.user.email}</p>
            </div>
          </div>
          <span className="text-sm font-extrabold text-[#9A3A20] bg-[#FFE8DC] px-3 py-1 rounded-full self-start sm:self-auto shrink-0">
            {t('completion', { percent })}
          </span>
        </div>
        <ProgressBar value={percent} label={t('completion', { percent })} />
        <p className="text-sm text-[#83726A] flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#2BB673] shrink-0" />
          {t('guarantee')}
        </p>
      </Card>

      {/* INFORMATIONS PERSONNELLES + OBJECTIF */}
      <Card className="space-y-5">
        <CardTitle icon={<User size={20} className="text-[#FF7A59]" />}>{t('personalTitle')}</CardTitle>
        <form
          key={[data.headline, data.location, data.summary, data.careerGoal].join('|')}
          onSubmit={identityForm.handleSubmit((values) =>
            mutate.mutate({ endpoint: '/profile', method: 'PATCH', body: values, success: t('toastSaved') }),
          )}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('headlineLabel')}
              placeholder={t('headlinePlaceholder')}
              defaultValue={data.headline ?? ''}
              error={identityForm.formState.errors.headline?.message}
              {...identityForm.register('headline')}
            />
            <Input
              label={t('locationLabel')}
              placeholder={t('locationPlaceholder')}
              defaultValue={data.location ?? ''}
              error={identityForm.formState.errors.location?.message}
              {...identityForm.register('location')}
            />
          </div>
          <Textarea
            rows={3}
            label={t('summaryLabel')}
            placeholder={t('summaryPlaceholder')}
            defaultValue={data.summary ?? ''}
            error={identityForm.formState.errors.summary?.message}
            {...identityForm.register('summary')}
          />
          <Textarea
            rows={2}
            label={t('goalLabel')}
            placeholder={t('goalPlaceholder')}
            defaultValue={data.careerGoal ?? ''}
            error={identityForm.formState.errors.careerGoal?.message}
            {...identityForm.register('careerGoal')}
          />
          <Button type="submit" loading={identityForm.formState.isSubmitting}>
            {tc('save')}
          </Button>
        </form>
      </Card>

      {/* EXPÉRIENCES */}
      <CollectionSection
        icon={<Briefcase size={20} className="text-[#FF7A59]" />}
        title={t('experiencesTitle')}
        emptyText={t('experiencesEmpty')}
        addTitle={t('addExperience')}
        submitting={experienceForm.formState.isSubmitting}
        items={data.experiences.map((e) => ({
          id: e.id,
          title: `${e.title} — ${e.company}`,
          subtitle: `${formatMonthYear(e.startDate)} – ${e.isCurrent ? tc('today') : formatMonthYear(e.endDate) || '?'}${e.location ? ` · ${e.location}` : ''}`,
          description: e.description,
        }))}
        onDelete={(item) => remove('experiences', item.id, item.title)}
        onSubmit={experienceForm.handleSubmit((values) =>
          add(
            '/profile/experiences',
            {
              title: values.title,
              company: values.company,
              location: values.location || undefined,
              description: values.description || undefined,
              startDate: monthToIso(values.start),
              endDate: values.isCurrent ? undefined : monthToIso(values.end),
              isCurrent: values.isCurrent,
            },
            () => experienceForm.reset({ title: '', company: '', location: '', description: '', start: '', end: '', isCurrent: false }),
          ),
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder={t('positionPlaceholder')} aria-label={t('positionPlaceholder')} error={experienceForm.formState.errors.title?.message} {...experienceForm.register('title')} />
          <Input placeholder={t('companyPlaceholder')} aria-label={t('companyPlaceholder')} error={experienceForm.formState.errors.company?.message} {...experienceForm.register('company')} />
          <Input id="exp-start" type="month" label={tc('start')} error={experienceForm.formState.errors.start?.message} {...experienceForm.register('start')} />
          <Input id="exp-end" type="month" label={tc('end')} disabled={experienceIsCurrent} error={experienceForm.formState.errors.end?.message} {...experienceForm.register('end')} />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#2E241F]">
          <input type="checkbox" className="w-4 h-4 accent-[#FF7A59]" {...experienceForm.register('isCurrent')} />
          {t('stillThere')}
        </label>
        <Input placeholder={t('placePlaceholder')} aria-label={t('placePlaceholder')} {...experienceForm.register('location')} />
        <Textarea rows={3} placeholder={t('descriptionPlaceholder')} aria-label={t('descriptionPlaceholder')} error={experienceForm.formState.errors.description?.message} {...experienceForm.register('description')} />
      </CollectionSection>

      {/* FORMATION */}
      <CollectionSection
        icon={<GraduationCap size={20} className="text-[#FF7A59]" />}
        title={t('educationTitle')}
        emptyText={t('educationEmpty')}
        addTitle={t('addEducation')}
        submitting={educationForm.formState.isSubmitting}
        items={data.educations.map((e) => ({
          id: e.id,
          title: `${e.degree}${e.field ? `, ${e.field}` : ''} — ${e.school}`,
          subtitle: `${formatMonthYear(e.startDate)}${e.endDate ? ` – ${formatMonthYear(e.endDate)}` : ''}`,
        }))}
        onDelete={(item) => remove('educations', item.id, item.title)}
        onSubmit={educationForm.handleSubmit((values) =>
          add(
            '/profile/educations',
            {
              degree: values.degree,
              school: values.school,
              field: values.field || undefined,
              startDate: monthToIso(values.start),
              endDate: monthToIso(values.end),
            },
            () => educationForm.reset({ degree: '', school: '', field: '', start: '', end: '' }),
          ),
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder={t('degreePlaceholder')} aria-label={t('degreePlaceholder')} error={educationForm.formState.errors.degree?.message} {...educationForm.register('degree')} />
          <Input placeholder={t('schoolPlaceholder')} aria-label={t('schoolPlaceholder')} error={educationForm.formState.errors.school?.message} {...educationForm.register('school')} />
          <Input className="sm:col-span-2" placeholder={t('fieldPlaceholder')} aria-label={t('fieldPlaceholder')} {...educationForm.register('field')} />
          <Input id="edu-start" type="month" label={tc('start')} error={educationForm.formState.errors.start?.message} {...educationForm.register('start')} />
          <Input id="edu-end" type="month" label={tc('endOptional')} error={educationForm.formState.errors.end?.message} {...educationForm.register('end')} />
        </div>
      </CollectionSection>

      {/* COMPÉTENCES */}
      <Card className="space-y-5" aria-label={t('skillsTitle', { count: data.skills.length })}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle icon={<Sparkles size={20} className="text-[#FF7A59]" />}>{t('skillsTitle', { count: data.skills.length })}</CardTitle>
          <Link href="/skills/discover" className="text-sm font-bold text-[#FF7A59] hover:underline">
            {t('discoverSkills')}
          </Link>
        </div>

        {data.skills.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {data.skills.map((s) => (
              <li key={s.id}>
                <SkillChip name={s.name} onRemove={() => remove('skills', s.id, s.name)} removeLabel={t('deleteItemLabel', { title: s.name })} />
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={skillForm.handleSubmit((values) => add('/profile/skills', { name: values.name }, () => skillForm.reset({ name: '' })))}
          noValidate
          className="flex items-start gap-2"
        >
          <div className="flex-1">
            <Input placeholder={t('addSkillPlaceholder')} aria-label={t('addSkillAria')} error={skillForm.formState.errors.name?.message} {...skillForm.register('name')} />
          </div>
          <Button type="submit" loading={skillForm.formState.isSubmitting} className="mt-0.5">
            <Plus size={16} /> {tc('add')}
          </Button>
        </form>
      </Card>

      {/* LANGUES */}
      <CollectionSection
        icon={<Languages size={20} className="text-[#FF7A59]" />}
        title={t('languagesTitle')}
        emptyText={t('languagesEmpty')}
        addTitle={t('languagesTitle')}
        submitting={languageForm.formState.isSubmitting}
        items={data.languages.map((l) => ({ id: l.id, title: l.name, subtitle: tLevels(l.level) }))}
        onDelete={(item) => remove('languages', item.id, item.title)}
        onSubmit={languageForm.handleSubmit((values) =>
          add('/profile/languages', values, () => languageForm.reset({ name: '', level: 'INTERMEDIAIRE' })),
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder={t('languagePlaceholder')} aria-label={t('languagePlaceholder')} error={languageForm.formState.errors.name?.message} {...languageForm.register('name')} />
          <Select label={t('languageLevelLabel')} options={LEVELS.map((level) => ({ value: level, label: tLevels(level) }))} {...languageForm.register('level')} />
        </div>
      </CollectionSection>

      {/* CERTIFICATIONS */}
      <CollectionSection
        icon={<Award size={20} className="text-[#FF7A59]" />}
        title={t('certificationsTitle')}
        emptyText={t('certificationsEmpty')}
        addTitle={t('certificationsTitle')}
        submitting={certificationForm.formState.isSubmitting}
        items={data.certifications.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: [c.issuer, c.issuedAt ? formatMonthYear(c.issuedAt) : ''].filter(Boolean).join(' · '),
        }))}
        onDelete={(item) => remove('certifications', item.id, item.title)}
        onSubmit={certificationForm.handleSubmit((values) =>
          add(
            '/profile/certifications',
            { name: values.name, issuer: values.issuer || undefined, issuedAt: monthToIso(values.issuedAt) },
            () => certificationForm.reset({ name: '', issuer: '', issuedAt: '' }),
          ),
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder={t('certificationPlaceholder')} aria-label={t('certificationPlaceholder')} error={certificationForm.formState.errors.name?.message} {...certificationForm.register('name')} />
          <Input placeholder={t('issuerPlaceholder')} aria-label={t('issuerPlaceholder')} {...certificationForm.register('issuer')} />
          <Input type="month" label={t('issuedAtLabel')} error={certificationForm.formState.errors.issuedAt?.message} {...certificationForm.register('issuedAt')} />
        </div>
      </CollectionSection>

      {/* PROJETS */}
      <CollectionSection
        icon={<FolderGit2 size={20} className="text-[#FF7A59]" />}
        title={t('projectsTitle')}
        emptyText={t('projectsEmpty')}
        addTitle={t('projectsTitle')}
        submitting={projectForm.formState.isSubmitting}
        items={data.projects.map((p) => ({ id: p.id, title: p.name, subtitle: p.url ?? undefined, description: p.description }))}
        onDelete={(item) => remove('projects', item.id, item.title)}
        onSubmit={projectForm.handleSubmit((values) =>
          add(
            '/profile/projects',
            { name: values.name, description: values.description || undefined, url: values.url || undefined },
            () => projectForm.reset({ name: '', description: '', url: '' }),
          ),
        )}
      >
        <Input placeholder={t('projectPlaceholder')} aria-label={t('projectPlaceholder')} error={projectForm.formState.errors.name?.message} {...projectForm.register('name')} />
        <Textarea rows={2} placeholder={t('projectDescriptionPlaceholder')} aria-label={t('projectDescriptionPlaceholder')} {...projectForm.register('description')} />
        <Input placeholder={t('projectUrlPlaceholder')} aria-label={t('projectUrlPlaceholder')} error={projectForm.formState.errors.url?.message} {...projectForm.register('url')} />
      </CollectionSection>

      {/* RÉALISATIONS */}
      <CollectionSection
        icon={<Trophy size={20} className="text-[#FF7A59]" />}
        title={t('achievementsTitle')}
        emptyText={t('achievementsEmpty')}
        addTitle={t('achievementsTitle')}
        submitting={achievementForm.formState.isSubmitting}
        items={data.achievements.map((a) => ({ id: a.id, title: a.title, description: a.description }))}
        onDelete={(item) => remove('achievements', item.id, item.title)}
        onSubmit={achievementForm.handleSubmit((values) =>
          add('/profile/achievements', { title: values.title, description: values.description || undefined }, () =>
            achievementForm.reset({ title: '', description: '' }),
          ),
        )}
      >
        <Input placeholder={t('achievementPlaceholder')} aria-label={t('achievementPlaceholder')} error={achievementForm.formState.errors.title?.message} {...achievementForm.register('title')} />
        <Textarea rows={2} placeholder={t('achievementDescriptionPlaceholder')} aria-label={t('achievementDescriptionPlaceholder')} {...achievementForm.register('description')} />
      </CollectionSection>

      <p className="text-center text-sm text-[#83726A]">
        {t('privacyLink')}{' '}
        <Link href="/settings" className="font-semibold text-[#FF7A59] hover:underline">
          {t('privacyLinkAction')}
        </Link>
      </p>
    </div>
  );
}
