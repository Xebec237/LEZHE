// Vérifie que la base configurée dans .env est joignable.
// Usage : node test-conn.js
// (Aucun identifiant en dur : tout vient de DATABASE_URL / DIRECT_URL.)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Aucune DATABASE_URL dans backend/.env');
  process.exit(1);
}

(async () => {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const started = Date.now();
  try {
    await prisma.$connect();
    const [{ count }] = await prisma.$queryRaw`select count(*)::int as count from "User"`;
    console.log(`Connexion OK en ${Date.now() - started} ms — ${count} utilisateur(s)`);
  } catch (err) {
    console.error('Connexion impossible :', err.message.split('\n')[0]);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
