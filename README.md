# Lezhe

*Connais-toi. Découvre la valeur que tu peux apporter.*

SaaS qui aide une personne à construire son identité professionnelle et à générer des documents
(CV, lettre de motivation, lettre de recommandation) à partir de faits qu'elle a elle-même validés.

**Zero Fabrication** — l'IA ne peut utiliser que les faits saisis par le candidat, et aucun texte
généré n'entre dans un document ou dans le profil sans confirmation explicite. C'est une contrainte
d'architecture : seules `POST /documents/:id/sections/confirm` et `POST /profile/skills/confirm`
peuvent écrire `DocumentSection.content` ou créer un `Skill`, et l'export PDF ignore toute section
sans contenu confirmé.

## Démarrer en local

Trois terminaux (ou onglets) :

```bash
# 1. Base de données — rien à lancer avec Supabase (configuration par défaut)
# Pour travailler hors connexion :
cd backend && npm run db:use local && npm run db:local   # Postgres embarqué, sans Docker

# 2. Backend — http://localhost:3001
cd backend && npm install && npm run start:dev

# 3. Frontend — http://localhost:3000
cd frontend && npm install && npm run dev
```

Sans Redis, l'export PDF fonctionne quand même : la file BullMQ est remplacée par un rendu direct
(un avertissement le signale au démarrage).

Sans `ANTHROPIC_API_KEY`, l'IA tourne en **mode dégradé** : les textes sont assemblés uniquement à
partir des faits du profil. Ajoute la clé dans `backend/.env` pour la génération réelle.

## Base de données

Deux configurations, commutables sans éditer de fichier :

```bash
cd backend && npm run db:use supabase   # base hébergée (par défaut)
cd backend && npm run db:use local      # base locale, utile hors connexion
```

**Supabase** (la référence du projet et la région sont dans `backend/.env`, jamais dans le dépôt) — la connexion passe
obligatoirement par le **pooler Supavisor** : l'hôte direct `db.<ref>.supabase.co` ne résout
qu'en IPv6, et la plupart des connexions domestiques n'en ont pas.

| Variable | Usage | Port |
|---|---|---|
| `DATABASE_URL` | application (mode transaction, `pgbouncer=true`) | 6543 |
| `DIRECT_URL` | migrations Prisma (mode session) | 5432 |

Migrations sur la base distante : **`npx prisma migrate deploy`** uniquement.
`migrate dev` peut proposer une remise à zéro — à ne jamais lancer sur Supabase.
Le schéma contenant déjà une table étrangère (`LEZHE`), les migrations existantes ont été
appliquées avec `prisma db execute` puis enregistrées via `prisma migrate resolve --applied`.

`node test-conn.js` vérifie en une seconde que la base configurée répond.

## Vérifier

```bash
cd backend && npm test           # tests Zero Fabrication (rendu + service)
cd backend && npm run test:e2e   # chemin critique complet contre l'API locale
cd frontend && npm run verify    # TypeScript + ESLint + clés de traduction
```

## Structure

```
backend/    NestJS · Prisma/PostgreSQL · BullMQ · Playwright (PDF) · Anthropic SDK
  src/auth           inscription, connexion JWT, suppression de compte
  src/profile        profil : expériences, formations, compétences, langues,
                     certifications, projets, réalisations, objectif professionnel
  src/ai-generation  appel Claude avec prompt « Zero Fabrication » + mode dégradé
  src/documents      documents, sections, suggestions IA (génération / reformulation /
                     confirmation)
  src/export         file d'export, rendu HTML → PDF, téléchargement authentifié
frontend/   Next.js (App Router) · TailwindCSS · TanStack Query · Framer Motion
            React Hook Form + Zod · next-intl
  src/app            pages : landing, auth, onboarding, dashboard, documents, éditeur,
                     export, profil, compétences, paramètres, tarifs
  src/components     ui/ (Button, Field, Card, Modal, Tabs, Toast, ChatBubble…),
                     editor/ (SectionCard, DocumentPreview, AiAssistant), profile/
  src/lib            client API, auth, hooks de données, libellés, schémas Zod
  src/messages       catalogues de traduction (fr.json)
  src/i18n           configuration next-intl (locales, direction LTR/RTL)
```

## Traductions

Aucun texte en dur dans les composants : tout passe par `useTranslations('namespace')`
et `src/messages/fr.json`. Ajouter une langue = ajouter `src/messages/<locale>.json`
puis la déclarer dans `src/i18n/config.ts` (l'arabe basculera automatiquement en RTL).
`npm run check:i18n` échoue si une clé utilisée n'existe pas.

## Règles Zero Fabrication dans le code

| Garde-fou | Où |
|---|---|
| Une génération n'écrit jamais `DocumentSection.content` | `documents.service.ts` → `generateSectionSuggestion` |
| Seule la confirmation écrit le contenu | `confirmSectionSuggestion` (vérifie l'appartenance et le statut) |
| Seule la confirmation crée un `Skill` | `confirmSkillSuggestion` |
| Une reformulation redevient une proposition | `refineSection` |
| Le PDF ignore toute section non validée | `render-html.ts` |
| Pas de suggestion sans faits saisis | `suggestHiddenSkills` |

## Variables d'environnement (`backend/.env`)

| Clé | Rôle |
|---|---|
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET` | signature des jetons |
| `REDIS_HOST` / `REDIS_PORT` | file d'export (optionnelle) |
| `ANTHROPIC_API_KEY` | vide = mode dégradé |
| `ANTHROPIC_MODEL` | modèle Claude utilisé |
| `PORT` | 3001 |
| `FRONTEND_URL` | origine autorisée en CORS |

Le frontend lit `NEXT_PUBLIC_API_URL` dans `frontend/.env.local`.

## Déploiement

**Frontend — Vercel** (déploiement automatique à chaque push sur `main`)
Root Directory : `frontend`. Variable à définir : `NEXT_PUBLIC_API_URL` = l'URL publique du backend.
Elle est compilée dans le bundle : après l'avoir changée, il faut **redéployer**.

**Backend — Render** (plan `render.yaml` à la racine)
1. render.com → *New* → *Blueprint* → connecter le dépôt → *Apply*. Le service s'appelle `lezhe`.
2. Renseigner les variables marquées `sync: false` : `DATABASE_URL`, `DIRECT_URL` (copier depuis
   `backend/.env`), `FRONTEND_URL` (URL Vercel, plusieurs origines séparées par des virgules),
   et `ANTHROPIC_API_KEY` si tu veux la génération réelle. `JWT_SECRET` est généré par Render.
3. L'image est construite depuis `backend/Dockerfile` (base Playwright : Chromium inclus pour les
   PDF). Les migrations Prisma sont appliquées au démarrage.

À savoir sur le plan gratuit Render :
- le service s'endort après ~15 min d'inactivité ; la première requête suivante prend ~50 s ;
- le disque est éphémère : les PDF déjà générés disparaissent à chaque redéploiement (il suffit de
  relancer l'export). Pour les conserver, ajouter un disque persistant ou un stockage objet ;
- sans Redis, l'export bascule automatiquement en rendu direct — c'est suffisant à ce stade.

## Reste à faire

- Module paiement / Mobile Money (volontairement hors scope pour l'instant)
- Phase 2 : analyse d'offre d'emploi collée (job-match), autres familles de modèles
  (Professional, Executive, Academic…), export DOCX, indicateurs ATS réels,
  notifications persistantes, mode sombre
- Traductions : seul le français (`fr.json`) est rempli ; la structure accepte d'autres langues
