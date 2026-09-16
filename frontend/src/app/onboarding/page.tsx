'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { apiFetch, errorMessage } from '@/lib/api';
import { queryKeys, useProfile } from '@/lib/queries';
import { computeProfileCompletion } from '@/lib/labels';
import { monthToIso, useSchemas, type EducationValues, type ExperienceValues, type IdentityValues } from '@/lib/validation';
import { PageSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import ProgressBar from '@/components/ui/ProgressBar';
import QuestionCard from '@/components/ui/QuestionCard';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';

const STEPS = ['goal', 'identity', 'education', 'experience', 'done'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const schemas = useSchemas();

  const [step, setStep] = useState(0);
  const [goalNext, setGoalNext] = useState('/dashboard');
  const [situation, setSituation] = useState('');

  const identityForm = useForm<IdentityValues>({
    resolver: zodResolver(schemas.identity),
    defaultValues: { headline: '', location: '', summary: '', careerGoal: '' },
  });
  const educationForm = useForm<EducationValues>({
    resolver: zodResolver(schemas.education),
    defaultValues: { degree: '', school: '', field: '', start: '', end: '' },
  });
  const experienceForm = useForm<ExperienceValues>({
    resolver: zodResolver(schemas.experience),
    defaultValues: { title: '', company: '', location: '', description: '', start: '', end: '', isCurrent: true },
  });

  const isCurrent = useWatch({ control: experienceForm.control, name: 'isCurrent' });
  const headlineDraft = useWatch({ control: identityForm.control, name: 'headline' });
  const locationDraft = useWatch({ control: identityForm.control, name: 'location' });

  if (profile.isPending) return <PageSkeleton />;

  const current = STEPS[step];
  const next = () => setStep((s) => s + 1);
  const p = profile.data;
  const { percent } = computeProfileCompletion(p);
  const hasExperience = (p?.experiences.length ?? 0) > 0;

  // Chaque étape est enregistrée immédiatement : rien n'est perdu si l'utilisateur quitte en route
  const save = async (endpoint: string, method: string, body: unknown) => {
    try {
      await apiFetch(endpoint, { method, body: JSON.stringify(body) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      next();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const goals = [
    { label: t('goalCv'), next: '/documents/new?type=CV' },
    { label: t('goalCoverLetter'), next: '/documents/new?type=COVER_LETTER' },
    { label: t('goalApplication'), next: '/documents/new?type=COVER_LETTER&adapt=1' },
    { label: t('goalProfile'), next: '/profile' },
    { label: t('goalUnsure'), next: '/dashboard' },
  ];

  const situations = [
    t('situationStudent'),
    t('situationEmployee'),
    t('situationEntrepreneur'),
    t('situationFreelance'),
    t('situationJobSeeker'),
    t('situationOther'),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_280px] gap-6 items-start">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#9A3A20] bg-[#FFE8DC] px-3 py-1.5 rounded-full">
            <Sparkles size={14} /> {t('progressBadge')}
          </span>
          <button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-[#83726A] hover:text-[#2E241F]">
            {t('later')}
          </button>
        </div>
        <ProgressBar value={(step / (STEPS.length - 1)) * 100} label={t('progressLabel')} />

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F3E3D6] shadow-card min-h-[420px]">
          {current === 'goal' && (
            <QuestionCard stepKey="goal" question={t('goalQuestion')}>
              <div className="grid gap-2.5">
                {goals.map((goal) => (
                  <button
                    key={goal.label}
                    onClick={() => {
                      setGoalNext(goal.next);
                      next();
                    }}
                    className="text-left p-4 rounded-2xl border border-[#F3E3D6] hover:bg-[#FFE8DC]/60 hover:border-[#FF7A59] text-base font-semibold text-[#2E241F] transition"
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </QuestionCard>
          )}

          {current === 'identity' && (
            <QuestionCard
              stepKey="identity"
              question={t('identityQuestion')}
              quickReplies={situations}
              onQuickReply={setSituation}
            >
              {situation && <p className="text-sm text-[#83726A]">✓ {situation}</p>}
              <form
                onSubmit={identityForm.handleSubmit((values) =>
                  save('/profile', 'PATCH', { headline: values.headline || undefined, location: values.location || undefined }),
                )}
                noValidate
                className="space-y-4"
              >
                <Input
                  id="headline"
                  label={t('headlineLabel')}
                  placeholder={t('headlinePlaceholder')}
                  error={identityForm.formState.errors.headline?.message}
                  {...identityForm.register('headline')}
                />
                <Input
                  id="location"
                  label={t('locationLabel')}
                  placeholder={t('locationPlaceholder')}
                  error={identityForm.formState.errors.location?.message}
                  {...identityForm.register('location')}
                />
                <Button type="submit" fullWidth size="lg" loading={identityForm.formState.isSubmitting}>
                  {tc('continue')}
                </Button>
              </form>
            </QuestionCard>
          )}

          {current === 'education' && (
            <QuestionCard stepKey="education" question={t('educationQuestion')}>
              <form
                onSubmit={educationForm.handleSubmit((values) =>
                  save('/profile/educations', 'POST', {
                    degree: values.degree,
                    school: values.school,
                    field: values.field || undefined,
                    startDate: monthToIso(values.start),
                    endDate: monthToIso(values.end),
                  }),
                )}
                noValidate
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    placeholder={t('degreePlaceholder')}
                    aria-label={t('degreePlaceholder')}
                    error={educationForm.formState.errors.degree?.message}
                    {...educationForm.register('degree')}
                  />
                  <Input
                    placeholder={t('schoolPlaceholder')}
                    aria-label={t('schoolPlaceholder')}
                    error={educationForm.formState.errors.school?.message}
                    {...educationForm.register('school')}
                  />
                  <Input
                    id="edu-start"
                    type="month"
                    label={tc('start')}
                    error={educationForm.formState.errors.start?.message}
                    {...educationForm.register('start')}
                  />
                  <Input
                    id="edu-end"
                    type="month"
                    label={tc('endOptional')}
                    error={educationForm.formState.errors.end?.message}
                    {...educationForm.register('end')}
                  />
                </div>
                <Button type="submit" fullWidth size="lg" loading={educationForm.formState.isSubmitting}>
                  {tc('continue')}
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={next}>
                  {tc('skip')}
                </Button>
              </form>
            </QuestionCard>
          )}

          {current === 'experience' && (
            <QuestionCard stepKey="experience" question={t('experienceQuestion')}>
              <form
                onSubmit={experienceForm.handleSubmit((values) =>
                  save('/profile/experiences', 'POST', {
                    title: values.title,
                    company: values.company,
                    startDate: monthToIso(values.start),
                    endDate: values.isCurrent ? undefined : monthToIso(values.end),
                    isCurrent: values.isCurrent,
                    description: values.description || undefined,
                  }),
                )}
                noValidate
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label={t('roleLabel')}
                    placeholder={t('rolePlaceholder')}
                    error={experienceForm.formState.errors.title?.message}
                    {...experienceForm.register('title')}
                  />
                  <Input
                    label={t('organizationLabel')}
                    placeholder={t('organizationPlaceholder')}
                    error={experienceForm.formState.errors.company?.message}
                    {...experienceForm.register('company')}
                  />
                  <Input
                    id="exp-start"
                    type="month"
                    label={tc('start')}
                    error={experienceForm.formState.errors.start?.message}
                    {...experienceForm.register('start')}
                  />
                  <Input
                    id="exp-end"
                    type="month"
                    label={tc('end')}
                    disabled={isCurrent}
                    error={experienceForm.formState.errors.end?.message}
                    {...experienceForm.register('end')}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#2E241F]">
                  <input type="checkbox" className="w-4 h-4 accent-[#FF7A59]" {...experienceForm.register('isCurrent')} />
                  {t('stillThere')}
                </label>
                <Textarea
                  label={t('tasksLabel')}
                  placeholder={t('tasksPlaceholder')}
                  error={experienceForm.formState.errors.description?.message}
                  {...experienceForm.register('description')}
                />
                <Button type="submit" fullWidth size="lg" loading={experienceForm.formState.isSubmitting}>
                  {tc('continue')}
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={next}>
                  {tc('skip')}
                </Button>
              </form>
            </QuestionCard>
          )}

          {current === 'done' && (
            <div className="text-center space-y-5 py-6">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-full bg-[#DDF5E7] text-[#2BB673] flex items-center justify-center mx-auto"
              >
                <CheckCircle2 size={36} />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-[#2E241F]">{t('doneTitle')}</h1>
              <p className="text-base text-[#83726A] max-w-md mx-auto">
                {hasExperience ? t('doneWithExperience') : t('doneWithoutExperience')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasExperience && (
                  <Button size="lg" onClick={() => router.push('/skills/discover')}>
                    {t('exploreSkills')}
                  </Button>
                )}
                <Button size="lg" variant="secondary" onClick={() => router.push(goalNext)}>
                  {hasExperience ? t('laterContinue') : tc('continue')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aperçu discret du profil en construction */}
      <aside className="hidden lg:block bg-white/70 p-5 rounded-3xl border border-[#F3E3D6] space-y-3 text-sm">
        <div className="font-bold text-[#2E241F]">{t('previewTitle', { percent })}</div>
        <div className="text-[#2E241F] font-semibold">{p?.user.fullName}</div>
        <div className="text-[#83726A]">{p?.headline || headlineDraft || '—'}</div>
        <div className="text-[#83726A]">{p?.location || locationDraft || ''}</div>
        <div className="pt-2 border-t border-[#F3E3D6] space-y-1 text-[#83726A]">
          <div>{t('previewEducations', { count: p?.educations.length ?? 0 })}</div>
          <div>{t('previewExperiences', { count: p?.experiences.length ?? 0 })}</div>
          <div>{t('previewSkills', { count: p?.skills.length ?? 0 })}</div>
        </div>
      </aside>
    </div>
  );
}
