'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { signOut, useIsAuthenticated } from '@/lib/auth';

const APP_LINKS = [
  { href: '/dashboard', key: 'home', match: (p: string) => p === '/dashboard' },
  { href: '/documents', key: 'documents', match: (p: string) => p.startsWith('/documents') },
  { href: '/skills/discover', key: 'skills', match: (p: string) => p.startsWith('/skills') },
  { href: '/profile', key: 'profile', match: (p: string) => p === '/profile' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuth = useIsAuthenticated();
  const t = useTranslations('nav');
  const tc = useTranslations('common');

  const handleLogout = () => {
    signOut('/login');
    queryClient.clear();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9F3]/90 backdrop-blur-md border-b border-[#F3E3D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href={isAuth ? '/dashboard' : '/'} className="flex items-center gap-2 group" aria-label={t('homeAria')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7A59] to-[#FFB84D] flex items-center justify-center text-white font-bold text-xl shadow-sm transition-transform group-hover:scale-105">
            L
          </div>
          <span className="font-bold text-2xl tracking-tight text-[#2E241F]">
            {tc('appName')}<span className="text-[#FF7A59]">.</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 font-medium text-sm text-[#83726A]" aria-label={t('mainNav')}>
          {isAuth === true &&
            APP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.match(pathname) ? 'page' : undefined}
                className={`hover:text-[#FF7A59] transition ${link.match(pathname) ? 'text-[#FF7A59] font-semibold' : ''}`}
              >
                {t(link.key)}
              </Link>
            ))}
          {isAuth === false && (
            <>
              <Link href="/#how-it-works" className="hover:text-[#FF7A59] transition">
                {t('howItWorks')}
              </Link>
              <Link href="/pricing" className={`hover:text-[#FF7A59] transition ${pathname === '/pricing' ? 'text-[#FF7A59] font-semibold' : ''}`}>
                {t('pricing')}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuth === true && (
            <>
              <Link
                href="/settings"
                className={`hidden sm:inline text-sm font-medium hover:text-[#FF7A59] transition ${pathname === '/settings' ? 'text-[#FF7A59]' : 'text-[#83726A]'}`}
              >
                {t('settings')}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-[#83726A] hover:text-[#E2645A] px-3 py-1.5 rounded-lg border border-[#F3E3D6] hover:bg-[#FBE7E5] transition"
              >
                {t('logout')}
              </button>
            </>
          )}
          {isAuth === false && (
            <>
              <Link href="/login" className="text-sm font-semibold text-[#2E241F] hover:text-[#FF7A59] transition">
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="bg-[#FF7A59] hover:bg-[#E86343] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm hover:shadow"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
