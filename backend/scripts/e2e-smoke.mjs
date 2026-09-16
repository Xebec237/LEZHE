// Test manuel bout-en-bout du chemin critique Phase 1 contre l'API qui tourne en local.
// Usage : npm run test:e2e   (backend démarré sur http://localhost:3001)
const API = process.env.API_URL || 'http://localhost:3001';
let token = '';
let failures = 0;

async function call(method, path, body, { raw = false } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

function check(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

const email = `e2e-${Date.now()}@lezhe.test`;

const reg = await call('POST', '/auth/register', { email, password: 'motdepasse', fullName: 'Awa Koné' });
check('Inscription', reg.status === 201, reg.status);
if (reg.status !== 201) {
  console.error('Arrêt : impossible de créer un compte (base injoignable ?).');
  process.exit(1);
}
token = reg.data.accessToken;

check('Profil inclut le nom', (await call('GET', '/profile')).data?.user?.fullName === 'Awa Koné');
await call('PATCH', '/profile', { headline: 'Assistante commerciale', location: 'Abidjan' });
const exp = await call('POST', '/profile/experiences', {
  title: 'Vendeuse', company: 'Boutique Kanvas', startDate: '2022-03-01', isCurrent: true,
  description: 'J’organisais les commandes et je répondais aux clients.',
});
check('Ajout expérience', exp.status === 201, exp.status);

// Nouvelles sections du profil (langues, certifications, projets, réalisations, objectif)
const lang = await call('POST', '/profile/languages', { name: 'Anglais', level: 'COURANT' });
const cert = await call('POST', '/profile/certifications', { name: 'Certificat Excel', issuer: 'Microsoft', issuedAt: '2023-05-01' });
const proj = await call('POST', '/profile/projects', { name: 'Boutique en ligne', description: 'Vente de tissus locaux', url: 'https://exemple.com' });
const ach = await call('POST', '/profile/achievements', { title: 'Organisation d’un événement de 200 personnes' });
await call('PATCH', '/profile', { careerGoal: 'Évoluer vers un poste de responsable commercial.' });
check('Ajout langue / certification / projet / réalisation', [lang, cert, proj, ach].every((r) => r.status === 201));

const profileNow = (await call('GET', '/profile')).data;
check(
  'Profil complet renvoyé',
  profileNow.languages.length === 1 && profileNow.certifications.length === 1 && profileNow.projects.length === 1 && profileNow.achievements.length === 1 && !!profileNow.careerGoal,
);

const dupLang = await call('POST', '/profile/languages', { name: 'anglais', level: 'NATIF' });
check('Pas de doublon de langue', dupLang.status === 201 && (await call('GET', '/profile')).data.languages.length === 1);

const delLang = await call('DELETE', `/profile/languages/${lang.data.id}`);
check('Suppression dans une collection du profil', delLang.status === 200);

const badCollection = await call('DELETE', '/profile/inconnu/123');
check('Collection inconnue refusée', badCollection.status === 400, badCollection.status);

const sugg = await call('POST', '/profile/skills/suggest');
check('Suggestions de compétences créées en attente', sugg.status === 201 && sugg.data.length > 0 && sugg.data.every((s) => s.status === 'PENDING_CONFIRMATION'), `${sugg.data?.length} suggestions`);
check('Aucun Skill créé par la suggestion', (await call('GET', '/profile')).data.skills.length === 0);

const conf = await call('POST', '/profile/skills/confirm', { suggestionId: sugg.data[0].id, action: 'CONFIRM' });
check('Confirmation crée le Skill', conf.status === 201 && (await call('GET', '/profile')).data.skills.length === 1);
const again = await call('POST', '/profile/skills/confirm', { suggestionId: sugg.data[0].id, action: 'CONFIRM' });
check('Double confirmation refusée', again.status === 400, again.status);

const doc = await call('POST', '/documents', { type: 'CV', title: 'CV test', targetJob: 'Assistante commerciale', targetCountry: 'Côte d’Ivoire', templateId: 'modern' });
check('Création document', doc.status === 201, doc.status);
const docId = doc.data.id;

const blocked = await call('POST', `/documents/${docId}/export`);
check('Export refusé sans section essentielle validée', blocked.status === 400, blocked.status);

const gen = await call('POST', `/documents/${docId}/sections/generate`, { sectionType: 'SUMMARY', order: 1 });
check('Génération = suggestion en attente', gen.status === 201 && gen.data.suggestion.status === 'PENDING_CONFIRMATION');
let detail = await call('GET', `/documents/${docId}`);
check('Section encore vide après génération', detail.data.sections[0].content === null && detail.data.canExport === false);

const ok = await call('POST', `/documents/${docId}/sections/confirm`, { suggestionId: gen.data.suggestion.id, action: 'CONFIRM' });
check('Validation de la section', ok.status === 201 && !!ok.data.content);
detail = await call('GET', `/documents/${docId}`);
check('Document prêt à exporter', detail.data.canExport === true && detail.data.status === 'READY');

// Assistant IA : une reformulation redevient une proposition à valider
const confirmedBefore = detail.data.sections.find((s) => s.type === 'SUMMARY').content;
const refined = await call('POST', `/documents/${docId}/sections/refine`, {
  sectionType: 'SUMMARY',
  instruction: 'Rends-le plus court',
});
check('Assistant IA : nouvelle proposition en attente', refined.status === 201 && refined.data.suggestion.status === 'PENDING_CONFIRMATION');
const afterRefine = await call('GET', `/documents/${docId}`);
check(
  'Assistant IA : le texte validé reste inchangé',
  afterRefine.data.sections.find((s) => s.type === 'SUMMARY').content === confirmedBefore,
);
await call('POST', `/documents/${docId}/sections/confirm`, { suggestionId: refined.data.suggestion.id, action: 'REJECT' });

const refineEmpty = await call('POST', `/documents/${docId}/sections/refine`, {
  sectionType: 'SKILLS_SUMMARY',
  instruction: 'Rends-le plus court',
});
check('Assistant IA : refuse une section vide', refineEmpty.status === 400, refineEmpty.status);

// Une suggestion non confirmée (EXPERIENCE_1) ne doit jamais apparaître dans le PDF
const pending = await call('POST', `/documents/${docId}/sections/generate`, { sectionType: 'EXPERIENCE_1', order: 2 });

const job = await call('POST', `/documents/${docId}/export`);
check('Export lancé', job.status === 201, job.status);
let status = job.data.status;
for (let i = 0; i < 60 && !['DONE', 'FAILED'].includes(status); i++) {
  await new Promise((r) => setTimeout(r, 1000));
  status = (await call('GET', `/documents/${docId}/export/${job.data.id}`)).data.status;
}
check('PDF généré', status === 'DONE', status);

const pdf = await call('GET', `/documents/${docId}/export/${job.data.id}/download`, null, { raw: true });
const bytes = Buffer.from(await pdf.arrayBuffer());
check('Téléchargement authentifié du PDF', pdf.status === 200 && bytes.subarray(0, 5).toString() === '%PDF-', `${bytes.length} octets`);

const savedToken = token;
token = '';
const anon = await call('GET', `/documents/${docId}/export/${job.data.id}/download`);
check('Téléchargement refusé sans connexion', anon.status === 401, anon.status);
const publicFile = await fetch(`${API}/uploads/pdf/`);
check('Aucun dossier PDF public', publicFile.status === 404, publicFile.status);
token = savedToken;

const del = await call('DELETE', '/auth/me');
check('Suppression du compte', del.status === 200 && del.data.deleted === true);
check('Jeton invalide après suppression', (await call('GET', '/profile')).status === 401);
void pending;

console.log(failures === 0 ? '\nTout le chemin critique fonctionne.' : `\n${failures} vérification(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
