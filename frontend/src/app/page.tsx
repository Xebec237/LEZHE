'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, ArrowRight, Award } from 'lucide-react';
import Footer from '@/components/Footer';
import { useIsAuthenticated } from '@/lib/auth';

export default function LandingPage() {
  const t = useTranslations('landing');
  const isAuth = useIsAuthenticated();
  const startHref = isAuth ? '/dashboard' : '/register';

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <>
      <div className="space-y-24 py-8">
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 text-center pt-8 md:pt-16 space-y-8">
          <motion.div
            {...fadeUp()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFE8DC] text-[#9A3A20] font-medium text-sm border border-[#FFD9C7]"
          >
            <Sparkles size={16} />
            <span>{t('badge')}</span>
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-6xl font-extrabold text-[#2E241F] tracking-tight leading-tight max-w-4xl mx-auto">
            {t.rich('title', { accent: (chunks) => <span className="text-[#FF7A59]">{chunks}</span> })}
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-lg sm:text-xl text-[#83726A] max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href={startHref}
              className="w-full sm:w-auto bg-[#FF7A59] hover:bg-[#E86343] text-white text-base font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>{isAuth ? t('ctaPrimaryAuthenticated') : t('ctaPrimary')}</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto bg-white hover:bg-[#FFE8DC]/50 text-[#2E241F] border border-[#F3E3D6] text-base font-semibold px-8 py-4 rounded-2xl transition"
            >
              {t('ctaSecondary')}
            </Link>
          </motion.div>

          {/* Aperçu du produit : ta parole → proposition à valider → document */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="pt-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F3E3D6] shadow-card text-left space-y-6">
              <div className="flex items-center justify-between border-b border-[#F3E3D6] pb-4">
                <div className="flex items-center gap-2" aria-hidden>
                  <div className="w-3 h-3 rounded-full bg-[#FF7A59]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFB84D]" />
                  <div className="w-3 h-3 rounded-full bg-[#2BB673]" />
                </div>
                <span className="text-xs font-semibold text-[#83726A] bg-[#FFF9F3] px-3 py-1 rounded-full border border-[#F3E3D6]">
                  {t('previewLabel')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#FFF9F3] p-4 rounded-2xl border border-[#F3E3D6] space-y-2">
                  <div className="text-xs font-bold text-[#83726A] uppercase tracking-wide">{t('step1Title')}</div>
                  <p className="text-sm text-[#2E241F]">{t('step1Text')}</p>
                </div>
                <div className="bg-[#FFD9C7]/40 p-4 rounded-2xl border border-[#FF7A59]/30 space-y-2">
                  <div className="text-xs font-bold text-[#9A3A20] uppercase tracking-wide">{t('step2Title')}</div>
                  <p className="text-sm text-[#2E241F]">{t('step2Text')}</p>
                  <div className="inline-block text-xs font-bold text-[#9A3A20] bg-white px-2 py-0.5 rounded border border-[#FF7A59]/20">
                    {t('step2Badge')}
                  </div>
                </div>
                <div className="bg-[#DDF5E7] p-4 rounded-2xl border border-[#2BB673]/30 space-y-2">
                  <div className="text-xs font-bold text-[#1F7A4F] uppercase tracking-wide">{t('step3Title')}</div>
                  <p className="text-sm text-[#2E241F] font-semibold">{t('step3Text')}</p>
                  <div className="text-xs font-bold text-[#1F7A4F]">{t('step3Badge')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 scroll-mt-20">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-[#2E241F]">{t('howTitle')}</h2>
            <p className="text-[#83726A] text-base max-w-xl mx-auto">{t('howSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: 1, title: t('how1Title'), text: t('how1Text'), tint: 'bg-[#FFE8DC] text-[#9A3A20]' },
              { n: 2, title: t('how2Title'), text: t('how2Text'), tint: 'bg-[#FFD98A]/50 text-[#2E241F]' },
              { n: 3, title: t('how3Title'), text: t('how3Text'), tint: 'bg-[#DDF5E7] text-[#1F7A4F]' },
            ].map((step) => (
              <div key={step.n} className="bg-white p-8 rounded-3xl border border-[#F3E3D6] shadow-card space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${step.tint}`}>{step.n}</div>
                <h3 className="text-xl font-bold text-[#2E241F]">{step.title}</h3>
                <p className="text-base text-[#83726A] leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SÉCURITÉ & CONFIDENTIALITÉ */}
        <section id="zero-fabrication" className="bg-white border-y border-[#F3E3D6] py-16 scroll-mt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5E7] text-[#1F7A4F] font-bold text-sm">
                <ShieldCheck size={16} />
                <span>{t('securityBadge')}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-[#2E241F]">{t('securityTitle')}</h2>
              <p className="text-base text-[#83726A] leading-relaxed">{t('securityText')}</p>
              <ul className="space-y-3 text-base text-[#2E241F]">
                {[t('securityPoint1'), t('securityPoint2'), t('securityPoint3')].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="text-[#2BB673] font-bold" aria-hidden>
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full md:w-1/2 bg-[#FFF9F3] p-8 rounded-3xl border border-[#F3E3D6] space-y-4">
              <div className="flex items-center gap-3">
                <Award className="text-[#FF7A59] shrink-0" size={28} />
                <div>
                  <div className="font-bold text-[#2E241F]">{t('securityAsideTitle')}</div>
                  <div className="text-sm text-[#83726A]">{t('securityAsideSubtitle')}</div>
                </div>
              </div>
              <p className="text-base text-[#83726A] leading-relaxed">{t('securityAsideText')}</p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-[#FF7A59] to-[#FFB84D] p-10 sm:p-14 rounded-3xl text-white shadow-xl space-y-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold">{t('finalTitle')}</h2>
            <p className="text-white/90 text-base max-w-xl mx-auto">{t('finalText')}</p>
            <Link
              href={startHref}
              className="inline-block bg-white text-[#2E241F] font-bold text-base px-8 py-4 rounded-2xl shadow hover:bg-[#FFF9F3] transition"
            >
              {t('finalCta')}
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
