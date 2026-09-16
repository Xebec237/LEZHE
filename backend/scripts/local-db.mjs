// PostgreSQL local SANS Docker (alternative à `docker compose up -d`).
// Utile quand Docker Desktop ne peut pas démarrer (virtualisation/WSL désactivés).
// Mêmes identifiants que docker-compose.yml : lezhe / lezhepassword, base "lezhe", port 5432.
// Usage : npm run db:local   (laisser la fenêtre ouverte ; Ctrl+C pour arrêter)
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.local-db');

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'lezhe',
  password: 'lezhepassword',
  port: 5432,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error(String(message).trim()),
});

const firstRun = !existsSync(path.join(databaseDir, 'PG_VERSION'));
if (firstRun) {
  console.log('Initialisation de la base locale dans backend/.local-db …');
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase('lezhe');
  console.log('Base "lezhe" créée.');
} catch {
  // la base existe déjà
}

console.log('PostgreSQL local prêt sur localhost:5432 (Ctrl+C pour arrêter)');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
