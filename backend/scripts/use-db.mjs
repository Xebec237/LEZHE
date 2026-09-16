// Bascule backend/.env entre la base locale et Supabase.
// Usage : npm run db:use local   |   npm run db:use supabase
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
const target = process.argv[2];
if (!['local', 'supabase'].includes(target)) {
  console.error('Usage : npm run db:use local | supabase');
  process.exit(1);
}

const lines = fs.readFileSync(ENV, 'utf8').split(/\r?\n/);
const isUrl = (line) => /^#?\s*(DATABASE_URL|DIRECT_URL)=/.test(line);
const isLocal = (line) => line.includes('@localhost:5432');

const updated = lines.map((line) => {
  if (!isUrl(line)) return line;
  const wanted = target === 'local' ? isLocal(line) : !isLocal(line);
  const bare = line.replace(/^#\s*/, '');
  return wanted ? bare : `# ${bare}`;
});

fs.writeFileSync(ENV, updated.join('\n'));
console.log(
  target === 'local'
    ? 'Base locale activée (lance `npm run db:local` dans un autre terminal).'
    : 'Supabase activé (pooler us-west-2).',
);
console.log('Redémarre le backend pour appliquer le changement.');
