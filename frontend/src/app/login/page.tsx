'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, errorMessage, setAuthToken } from '@/lib/api';
import { useIsAuthenticated } from '@/lib/auth';
import { useSchemas, type LoginValues } from '@/lib/validation';
import AuthCard from '@/components/auth/AuthCard';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('auth');
  const isAuth = useIsAuthenticated();
  const { login } = useSchemas();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(login), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (isAuth && !submitted) router.replace('/dashboard');
  }, [isAuth, submitted, router]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const data = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSubmitted(true);
      queryClient.clear();
      setAuthToken(data.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      setServerError(errorMessage(err, t('invalidCredentials')));
    }
  });

  return (
    <AuthCard
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      error={serverError}
      footerText={t('noAccount')}
      footerLinkHref="/register"
      footerLinkLabel={t('goRegister')}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
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
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          {t('submitLogin')}
        </Button>
      </form>
    </AuthCard>
  );
}
