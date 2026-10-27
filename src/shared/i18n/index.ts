import type { Language } from '../types.js';
import { en, type TranslationKeys, type Translations } from './en.js';
import { ta } from './ta.js';
import { hi } from './hi.js';

export const dictionaries: Record<Language, Translations> = {
  en,
  ta,
  hi,
};

export function t(lang: Language, key: TranslationKeys): string {
  return dictionaries[lang]?.[key] ?? en[key];
}

export type { TranslationKeys, Translations };
