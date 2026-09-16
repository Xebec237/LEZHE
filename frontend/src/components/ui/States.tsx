'use client';

import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import Button from './Button';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-2xl bg-[#F3E3D6]/70 ${className}`} />;
}

export function PageSkeleton() {
  const t = useTranslations('common');
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" aria-busy="true" aria-label={t('loading')}>
      <Skeleton className="h-28" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useTranslations('common');
  return (
    <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-[#F3E3D6] shadow-card text-center space-y-4">
      <div className="text-3xl" aria-hidden>
        🌤️
      </div>
      <p className="text-base font-semibold text-[#2E241F]">{message || t('genericError')}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw size={16} />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
