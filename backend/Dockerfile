# Image officielle Playwright : Chromium et ses dépendances système sont déjà installés,
# ce qui évite de les compiler à chaque déploiement (l'export PDF en dépend).
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Dépendances d'abord : cette couche est mise en cache tant que package*.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Client Prisma (généré avant la compilation TypeScript)
COPY prisma ./prisma
RUN npx prisma generate

# Code source puis compilation
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
# Render fournit PORT ; 3001 sert de valeur par défaut en local
ENV PORT=3001
EXPOSE 3001

# Les migrations sont appliquées au démarrage (via DIRECT_URL, mode session du pooler)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
