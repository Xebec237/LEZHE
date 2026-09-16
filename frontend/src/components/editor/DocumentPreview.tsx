'use client';

import { useTranslations } from 'next-intl';
import { formatMonthYear, useSectionTitle } from '@/lib/labels';
import type { DocumentDetail } from '@/lib/types';

const THEMES: Record<string, { accent: string; align: string; upper: boolean }> = {
  ats: { accent: '#1F3A5F', align: 'text-left', upper: true },
  minimal: { accent: '#2E241F', align: 'text-center', upper: false },
  modern: { accent: '#FF7A59', align: 'text-left', upper: true },
};

function SectionHeading({ theme, children }: { theme: (typeof THEMES)[string]; children: React.ReactNode }) {
  return (
    <h3
      className={`text-xs font-bold pb-1 mb-1.5 border-b border-[#E8DDD4] ${theme.upper ? 'uppercase tracking-wider' : ''}`}
      style={{ color: theme.accent }}
    >
      {children}
    </h3>
  );
}

/**
 * Aperçu du document (PDFPreview) : n'affiche QUE le contenu validé,
 * avec la même logique que le rendu PDF du backend.
 */
export default function DocumentPreview({ document, templateId }: { document: DocumentDetail; templateId: string }) {
  const t = useTranslations('editor');
  const tp = useTranslations('profile');
  const tc = useTranslations('common');
  const tLevels = useTranslations('languageLevels');
  const sectionTitle = useSectionTitle();

  const theme = THEMES[templateId] ?? THEMES.ats;
  const { profile } = document;
  const isCv = document.type === 'CV';
  const confirmed = document.sections.filter((s) => s.content?.trim()).sort((a, b) => a.order - b.order);

  return (
    <article className="bg-white rounded-2xl border border-[#F3E3D6] shadow-xl p-6 sm:p-8 min-h-[520px] space-y-5 text-[#2E241F] text-[13px] leading-relaxed">
      <header className={`pb-3 border-b-2 ${theme.align}`} style={{ borderColor: theme.accent }}>
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.accent }}>
          {profile.user.fullName}
        </h2>
        {profile.headline && <div className="text-sm font-semibold text-[#83726A]">{profile.headline}</div>}
        <div className="text-xs text-[#83726A] pt-1">
          {[profile.location, profile.user.email, profile.user.phone].filter(Boolean).join(' · ')}
        </div>
      </header>

      {confirmed.map((s) => (
        <section key={s.id}>
          <SectionHeading theme={theme}>{sectionTitle(s.type)}</SectionHeading>
          <p className="whitespace-pre-line">{s.content}</p>
        </section>
      ))}

      {isCv && profile.careerGoal && (
        <section>
          <SectionHeading theme={theme}>{tp('goalLabel')}</SectionHeading>
          <p className="whitespace-pre-line">{profile.careerGoal}</p>
        </section>
      )}

      {isCv && profile.experiences.length > 0 && (
        <section>
          <SectionHeading theme={theme}>{tp('experiencesTitle')}</SectionHeading>
          <div className="space-y-2">
            {profile.experiences.map((e) => (
              <div key={e.id}>
                <div className="font-bold">
                  {e.title} — {e.company}
                </div>
                <div className="text-xs text-[#83726A]">
                  {formatMonthYear(e.startDate)} – {e.isCurrent ? tc('today') : formatMonthYear(e.endDate)}
                </div>
                {e.description && <p className="whitespace-pre-line">{e.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {isCv && profile.projects.length > 0 && (
        <section>
          <SectionHeading theme={theme}>{tp('projectsTitle')}</SectionHeading>
          {profile.projects.map((p) => (
            <div key={p.id}>
              <span className="font-bold">{p.name}</span>
              {p.description ? ` — ${p.description}` : ''}
            </div>
          ))}
        </section>
      )}

      {isCv && profile.achievements.length > 0 && (
        <section>
          <SectionHeading theme={theme}>{tp('achievementsTitle')}</SectionHeading>
          {profile.achievements.map((a) => (
            <div key={a.id}>
              <span className="font-bold">{a.title}</span>
              {a.description ? ` — ${a.description}` : ''}
            </div>
          ))}
        </section>
      )}

      {isCv && profile.educations.length > 0 && (
        <section>
          <SectionHeading theme={theme}>{tp('educationTitle')}</SectionHeading>
          {profile.educations.map((e) => (
            <div key={e.id}>
              <span className="font-bold">{e.degree}</span> — {e.school}
            </div>
          ))}
        </section>
      )}

      {isCv && profile.certifications.length > 0 && (
        <section>
          <SectionHeading theme={theme}>{tp('certificationsTitle')}</SectionHeading>
          {profile.certifications.map((c) => (
            <div key={c.id}>
              <span className="font-bold">{c.name}</span>
              {c.issuer ? ` — ${c.issuer}` : ''}
            </div>
          ))}
        </section>
      )}

      {isCv && profile.skills.length > 0 && (
        <section>
          <SectionHeading theme={theme}>{tp('skillsTitle', { count: profile.skills.length })}</SectionHeading>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span key={s.id} className="px-2 py-0.5 rounded-full border border-[#E8DDD4] text-xs">
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {isCv && profile.languages.length > 0 && (
        <section>
          <SectionHeading theme={theme}>{tp('languagesTitle')}</SectionHeading>
          <div className="flex flex-wrap gap-1.5">
            {profile.languages.map((l) => (
              <span key={l.id} className="px-2 py-0.5 rounded-full border border-[#E8DDD4] text-xs">
                {l.name} — {tLevels(l.level)}
              </span>
            ))}
          </div>
        </section>
      )}

      {confirmed.length === 0 && <p className="text-center py-12 text-sm text-[#83726A]">{t('previewEmpty')}</p>}
    </article>
  );
}
