// Vérifie que chaque clé utilisée dans le code existe dans src/messages/<locale>.json
// et signale les namespaces jamais utilisés. Usage : npm run check:i18n
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE = process.argv[2] ?? 'fr';
const messages = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/messages', `${LOCALE}.json`), 'utf8'));

const has = (ns, key) => messages[ns] && Object.prototype.hasOwnProperty.call(messages[ns], key);

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
})(path.join(ROOT, 'src'));

const missing = [];
const usedNamespaces = new Set();

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const namespaceByVariable = {};

  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\('([\w.]+)'\)/g)) {
    namespaceByVariable[match[1]] = match[2];
    usedNamespaces.add(match[2]);
  }

  for (const [variable, namespace] of Object.entries(namespaceByVariable)) {
    const callPattern = new RegExp(`\\b${variable}(?:\\.rich)?\\(\\s*'([\\w.]+)'`, 'g');
    for (const match of source.matchAll(callPattern)) {
      if (!has(namespace, match[1])) missing.push(`${path.relative(ROOT, file)} → ${namespace}.${match[1]}`);
    }
  }
}

const unused = Object.keys(messages).filter((ns) => !usedNamespaces.has(ns));
if (unused.length) console.warn('Namespaces jamais utilisés :', unused.join(', '));

if (missing.length) {
  console.error(`Clés manquantes dans ${LOCALE}.json :\n` + missing.join('\n'));
  process.exit(1);
}
console.log(`✓ Toutes les clés utilisées existent dans ${LOCALE}.json`);
