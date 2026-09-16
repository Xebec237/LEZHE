import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="max-w-md mx-auto my-20 px-4 text-center space-y-4">
      <div className="text-5xl" aria-hidden>
        🧭
      </div>
      <h1 className="text-2xl font-extrabold text-[#2E241F]">{t('title')}</h1>
      <p className="text-base text-[#83726A]">{t('text')}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/dashboard" className="bg-[#FF7A59] hover:bg-[#E86343] text-white font-bold px-5 py-3 rounded-xl">
          {t('mySpace')}
        </Link>
        <Link href="/" className="border border-[#F3E3D6] text-[#2E241F] font-bold px-5 py-3 rounded-xl hover:bg-white">
          {t('home')}
        </Link>
      </div>
    </div>
  );
}
