'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, Info } from 'lucide-react';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const t = useTranslations('pricing');

  const plans = [
    {
      id: 'free',
      tag: t('freeTag'),
      name: t('freeName'),
      price: t('freePrice'),
      period: t('freePeriod'),
      text: t('freeText'),
      features: [t('freeFeature1'), t('freeFeature2'), t('freeFeature3')],
      cta: t('freeCta'),
      href: '/register',
      featured: false,
    },
    {
      id: 'pro',
      tag: t('proTag'),
      name: t('proName'),
      price: t('proPrice'),
      period: t('proPeriod'),
      text: t('proText'),
      features: [t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4')],
      cta: t('proCta'),
      href: 'mailto:contact@lezhe.com?subject=Pass%20Pro',
      featured: true,
    },
    {
      id: 'business',
      tag: t('businessTag'),
      name: t('businessName'),
      price: t('businessPrice'),
      period: '',
      text: t('businessText'),
      features: [t('businessFeature1'), t('businessFeature2'), t('businessFeature3')],
      cta: t('businessCta'),
      href: 'mailto:contact@lezhe.com',
      featured: false,
    },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE8DC] text-[#9A3A20] font-bold text-sm">
            <Sparkles size={14} />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2E241F]">{t('title')}</h1>
          <p className="text-base text-[#83726A]">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white p-8 rounded-3xl space-y-6 flex flex-col justify-between relative ${
                plan.featured ? 'border-2 border-[#FF7A59] shadow-xl md:-translate-y-2' : 'border border-[#F3E3D6] shadow-card'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF7A59] text-white font-bold text-xs px-3.5 py-1 rounded-full shadow">
                  {t('popular')}
                </div>
              )}
              <div className="space-y-4">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${plan.featured ? 'bg-[#FFE8DC] text-[#9A3A20]' : 'bg-[#FFF9F3] text-[#83726A] border border-[#F3E3D6]'}`}>
                  {plan.tag}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-[#2E241F]">{plan.name}</h2>
                  <div className={`text-3xl font-extrabold mt-2 ${plan.featured ? 'text-[#FF7A59]' : 'text-[#2E241F]'}`}>
                    {plan.price} {plan.period && <span className="text-sm text-[#83726A] font-normal">/ {plan.period}</span>}
                  </div>
                </div>
                <p className="text-sm text-[#83726A]">{plan.text}</p>
                <hr className="border-[#F3E3D6]" />
                <ul className="space-y-3 text-sm text-[#2E241F]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={16} className="text-[#2BB673] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={plan.href}
                className={`w-full text-center font-bold text-sm py-3.5 rounded-xl transition ${
                  plan.featured
                    ? 'bg-[#FF7A59] hover:bg-[#E86343] text-white shadow'
                    : 'bg-[#FFF9F3] hover:bg-[#FFE8DC] text-[#2E241F] border border-[#F3E3D6]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#1F5E82] bg-[#DFF1FF]/70 max-w-2xl mx-auto p-4 rounded-2xl flex items-center justify-center gap-2">
          <Info size={16} className="shrink-0" />
          {t('contactNotice')}
        </p>
      </div>
      <Footer />
    </>
  );
}
