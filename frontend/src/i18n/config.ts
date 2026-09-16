// Langues visées à terme : fr, en, es, de, pt, ar (RTL).
// Pour le MVP, seul le français est rempli — ajouter une langue = ajouter src/messages/<locale>.json.
export const LOCALES = ['fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

/** Langues écrites de droite à gauche (structure prête, pas encore activée). */
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export function directionOf(locale: string): 'ltr' | 'rtl' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}
