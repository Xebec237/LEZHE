'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');
  const tc = useTranslations('common');

  return (
    <footer className="border-t border-[#F3E3D6] bg-white/60 mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 space-y-2">
          <div className="font-bold text-xl text-[#2E241F]">
            {tc('appName')}
            <span className="text-[#FF7A59]">.</span>
          </div>
          <p className="text-[#83726A] max-w-xs">{tc('tagline')}</p>
        </div>
        <div className="space-y-2">
          <div className="font-semibold text-[#2E241F]">{t('product')}</div>
          <ul className="space-y-1.5 text-[#83726A]">
            <li>
              <Link href="/#how-it-works" className="hover:text-[#FF7A59]">
                {tn('howItWorks')}
              </Link>
            </li>
            <li>
              <Link href="/#zero-fabrication" className="hover:text-[#FF7A59]">
                {t('zeroFabrication')}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-[#FF7A59]">
                {tn('pricing')}
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <div className="font-semibold text-[#2E241F]">{t('account')}</div>
          <ul className="space-y-1.5 text-[#83726A]">
            <li>
              <Link href="/register" className="hover:text-[#FF7A59]">
                {t('createAccount')}
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-[#FF7A59]">
                {tn('login')}
              </Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-[#FF7A59]">
                {t('privacy')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-[#83726A] pb-24 md:pb-6">{t('rights', { year: new Date().getFullYear() })}</div>
    </footer>
  );
}
