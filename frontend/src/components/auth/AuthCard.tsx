'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** Enveloppe commune aux écrans de connexion et d'inscription. */
export default function AuthCard({
  title,
  subtitle,
  error,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
}: {
  title: string;
  subtitle: string;
  error?: string | null;
  children: React.ReactNode;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
}) {
  const tc = useTranslations('common');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl border border-[#F3E3D6] shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF7A59] to-[#FFB84D] text-white flex items-center justify-center font-bold text-2xl mx-auto" aria-hidden>
            {tc('appName').charAt(0)}
          </div>
          <h1 className="text-2xl font-extrabold text-[#2E241F]">{title}</h1>
          <p className="text-sm text-[#83726A]">{subtitle}</p>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-xl bg-[#FBE7E5] text-[#B5433A] text-sm font-semibold border border-[#E2645A]/20">
            {error}
          </div>
        )}

        {children}

        <p className="text-center text-sm text-[#83726A]">
          {footerText}{' '}
          <Link href={footerLinkHref} className="font-bold text-[#FF7A59] hover:underline">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
