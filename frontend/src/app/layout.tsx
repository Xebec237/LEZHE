import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/BottomNavigation';
import { directionOf } from '@/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: `${t('appName')} — ${t('tagline')}`,
    description:
      'Lezhe transforme ton expérience, tes compétences et ton parcours en documents professionnels, sans jamais inventer un fait.',
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={directionOf(locale)} className="h-full">
      <body className="h-full flex flex-col bg-[#FFF9F3] text-[#2E241F] antialiased selection:bg-[#FFD9C7] selection:text-[#9A3A20]">
        <NextIntlClientProvider>
          <Providers>
            <Navbar />
            <main className="flex-1 pb-24 md:pb-8">{children}</main>
            <BottomNavigation />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
