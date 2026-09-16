'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, errorMessage, setAuthToken } from '@/lib/api';
import { useIsAuthenticated } from '@/lib/auth';
import { useSchemas, type RegisterValues } from '@/lib/validation';
import AuthCard from '@/components/auth/AuthCard';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const isAuth = useIsAuthenticated();
  const { register: registerSchema } = useSchemas();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', phone: '' },
  });

  useEffect(() => {
    if (isAuth && !submitted) router.replace('/dashboard');
  }, [isAuth, submitted, router]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const data = await apiFetch<{ accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...values, phone: values.phone || undefined }),
      });
      setSubmitted(true);
      queryClient.clear();
      setAuthToken(data.accessToken);
      router.replace('/onboarding');
    } catch (err) {
      setServerError(errorMessage(err, t('registerError')));
    }
  });

  return (
    <AuthCard
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
      error={serverError}
      footerText={t('hasAccount')}
      footerLinkHref="/login"
      footerLinkLabel={t('goLogin')}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label={t('fullName')}
          autoComplete="name"
          placeholder={t('fullNamePlaceholder')}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label={t('email')}
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label={t('password')}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint={t('passwordHint')}
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label={`${t('phone')} (${tc('optional')})`}
          type="tel"
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          {t('submitRegister')}
        </Button>
      </form>
    </AuthCard>
  );
}
