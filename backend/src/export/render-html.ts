// Rendu HTML d'un document pour l'export PDF (Playwright).
// Règle Zero Fabrication : seules les sections dont `content` est non vide sont rendues.
// Une suggestion IA non confirmée n'a jamais de `content`, elle ne peut donc pas apparaître ici.

export const SECTION_LABELS: Record<string, string> = {
  SUMMARY: 'Résumé professionnel',
  EXPERIENCE_1: 'Expérience principale',
  SKILLS_SUMMARY: 'Compétences clés',
  COVER_LETTER_BODY: 'Lettre de motivation',
  RECOMMENDATION_LETTER_BODY: 'Lettre de recommandation',
};

interface TemplateTheme {
  primary: string;
  text: string;
  muted: string;
  font: string;
  headerAlign: 'left' | 'center';
  uppercaseTitles: boolean;
  chipBackground: string;
}

// Pour ajouter un modèle (Professional, Executive, Academic...) : ajouter une entrée ici.
const TEMPLATES: Record<string, TemplateTheme> = {
  ats: {
    primary: '#1F3A5F',
    text: '#222222',
    muted: '#555555',
    font: "Calibri, Arial, Helvetica, sans-serif",
    headerAlign: 'left',
    uppercaseTitles: true,
    chipBackground: 'transparent',
  },
  minimal: {
    primary: '#2E241F',
    text: '#2E241F',
    muted: '#83726A',
    font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headerAlign: 'center',
    uppercaseTitles: false,
    chipBackground: '#F5EFEA',
  },
  modern: {
    primary: '#FF7A59',
    text: '#2E241F',
    muted: '#83726A',
    font: "'Segoe UI', Roboto, Arial, sans-serif",
    headerAlign: 'left',
    uppercaseTitles: true,
    chipBackground: '#FFE8DC',
  },
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMonth(date: string | Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
}

export function renderDocumentHtml(document: any): string {
  const { templateId, profile, sections, type } = document;
  const theme = TEMPLATES[templateId] ?? TEMPLATES.ats;
  const isCv = !type || type === 'CV';

  const confirmedSections = (sections || [])
    .filter((s: any) => typeof s.content === 'string' && s.content.trim() !== '')
    .sort((a: any, b: any) => a.order - b.order);

  const user = profile?.user ?? {};
  const contact = [profile?.location, user.email, user.phone].filter(Boolean).map(escapeHtml).join(' &nbsp;·&nbsp; ');

  const experiences = isCv ? profile?.experiences || [] : [];
  const educations = isCv ? profile?.educations || [] : [];
  const skills = isCv ? profile?.skills || [] : [];
  const languages = isCv ? profile?.languages || [] : [];
  const certifications = isCv ? profile?.certifications || [] : [];
  const projects = isCv ? profile?.projects || [] : [];
  const achievements = isCv ? profile?.achievements || [] : [];

  const block = (title: string, inner: string) => `
    <section class="block">
      <h2>${escapeHtml(title)}</h2>
      ${inner}
    </section>`;

  const sectionsHtml = confirmedSections
    .map((s: any) => block(SECTION_LABELS[s.type] ?? s.type, `<div class="text">${escapeHtml(s.content.trim())}</div>`))
    .join('');

  const experiencesHtml = experiences.length
    ? block(
        'Expériences professionnelles',
        experiences
          .map(
            (e: any) => `
        <div class="item">
          <div class="item-title">${escapeHtml(e.title)} — ${escapeHtml(e.company)}</div>
          <div class="item-meta">${formatMonth(e.startDate)} – ${e.isCurrent ? 'Aujourd’hui' : formatMonth(e.endDate)}${e.location ? ` · ${escapeHtml(e.location)}` : ''}</div>
          ${e.description ? `<div class="text">${escapeHtml(e.description)}</div>` : ''}
        </div>`,
          )
          .join(''),
      )
    : '';

  const educationsHtml = educations.length
    ? block(
        'Formation',
        educations
          .map(
            (e: any) => `
        <div class="item">
          <div class="item-title">${escapeHtml(e.degree)}${e.field ? `, ${escapeHtml(e.field)}` : ''} — ${escapeHtml(e.school)}</div>
          <div class="item-meta">${e.startDate ? new Date(e.startDate).getFullYear() : ''}${e.endDate ? ` – ${new Date(e.endDate).getFullYear()}` : ''}</div>
        </div>`,
          )
          .join(''),
      )
    : '';

  const skillsHtml = skills.length
    ? block('Compétences', `<div class="chips">${skills.map((s: any) => `<span class="chip">${escapeHtml(s.name)}</span>`).join('')}</div>`)
    : '';

  const LANGUAGE_LEVELS: Record<string, string> = {
    NOTIONS: 'notions',
    INTERMEDIAIRE: 'intermédiaire',
    COURANT: 'courant',
    BILINGUE: 'bilingue',
    NATIF: 'langue maternelle',
  };

  const languagesHtml = languages.length
    ? block(
        'Langues',
        `<div class="chips">${languages
          .map((l: any) => `<span class="chip">${escapeHtml(l.name)} — ${escapeHtml(LANGUAGE_LEVELS[l.level] ?? l.level)}</span>`)
          .join('')}</div>`,
      )
    : '';

  const certificationsHtml = certifications.length
    ? block(
        'Certifications',
        certifications
          .map(
            (c: any) => `
        <div class="item">
          <div class="item-title">${escapeHtml(c.name)}</div>
          <div class="item-meta">${[c.issuer, c.issuedAt ? new Date(c.issuedAt).getFullYear() : ''].filter(Boolean).map(escapeHtml).join(' · ')}</div>
        </div>`,
          )
          .join(''),
      )
    : '';

  const projectsHtml = projects.length
    ? block(
        'Projets',
        projects
          .map(
            (p: any) => `
        <div class="item">
          <div class="item-title">${escapeHtml(p.name)}</div>
          ${p.description ? `<div class="text">${escapeHtml(p.description)}</div>` : ''}
          ${p.url ? `<div class="item-meta">${escapeHtml(p.url)}</div>` : ''}
        </div>`,
          )
          .join(''),
      )
    : '';

  const achievementsHtml = achievements.length
    ? block(
        'Réalisations',
        achievements
          .map(
            (a: any) => `
        <div class="item">
          <div class="item-title">${escapeHtml(a.title)}</div>
          ${a.description ? `<div class="text">${escapeHtml(a.description)}</div>` : ''}
        </div>`,
          )
          .join(''),
      )
    : '';

  const goalHtml = isCv && profile?.careerGoal ? block('Objectif professionnel', `<div class="text">${escapeHtml(profile.careerGoal)}</div>`) : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(document.language || 'fr')}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(document.title || 'Document Lezhe')}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: ${theme.font}; color: ${theme.text}; margin: 0; line-height: 1.5; font-size: 13px; }
    header { text-align: ${theme.headerAlign}; border-bottom: 2px solid ${theme.primary}; padding-bottom: 10px; margin-bottom: 18px; }
    header h1 { margin: 0; font-size: 26px; color: ${theme.primary}; letter-spacing: .3px; }
    header .headline { font-size: 15px; color: ${theme.muted}; margin-top: 2px; font-weight: 600; }
    header .contact { font-size: 12px; color: ${theme.muted}; margin-top: 6px; }
    .block { margin-bottom: 16px; page-break-inside: avoid; }
    .block h2 { font-size: 14px; color: ${theme.primary}; margin: 0 0 6px; padding-bottom: 3px; border-bottom: 1px solid #E8DDD4;
      ${theme.uppercaseTitles ? 'text-transform: uppercase; letter-spacing: .6px;' : ''} }
    .text { white-space: pre-line; }
    .item { margin-bottom: 10px; }
    .item-title { font-weight: 700; }
    .item-meta { font-size: 11px; color: ${theme.muted}; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { background: ${theme.chipBackground}; border: 1px solid #E8DDD4; border-radius: 10px; padding: 2px 9px; font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(user.fullName || 'Candidat')}</h1>
    ${profile?.headline ? `<div class="headline">${escapeHtml(profile.headline)}</div>` : ''}
    ${contact ? `<div class="contact">${contact}</div>` : ''}
  </header>
  ${sectionsHtml}
  ${goalHtml}
  ${experiencesHtml}
  ${projectsHtml}
  ${achievementsHtml}
  ${educationsHtml}
  ${certificationsHtml}
  ${skillsHtml}
  ${languagesHtml}
</body>
</html>`;
}
