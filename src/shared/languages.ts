import type { CountryId } from './countries/types.js';

/**
 * Every locale the app speaks: a language as used in one country. Order is the
 * order shown in pickers. `country` is the home country used before a person
 * has joined a workplace; once they have, the workplace's country decides the
 * rules and the legal wording.
 */
export const LANGUAGES = [
  {
    code: 'en-IN',
    base: 'en',
    native: 'English',
    region: 'India',
    english: 'English (India)',
    locale: 'en-IN',
    country: 'IN',
  },
  {
    code: 'ta',
    base: 'ta',
    native: 'தமிழ்',
    region: 'இந்தியா',
    english: 'Tamil',
    locale: 'ta-IN',
    country: 'IN',
  },
  {
    code: 'hi',
    base: 'hi',
    native: 'हिन्दी',
    region: 'भारत',
    english: 'Hindi',
    locale: 'hi-IN',
    country: 'IN',
  },
  {
    code: 'en-GB',
    base: 'en',
    native: 'English',
    region: 'United Kingdom',
    english: 'English (UK)',
    locale: 'en-GB',
    country: 'GB',
  },
  {
    code: 'en-US',
    base: 'en',
    native: 'English',
    region: 'United States',
    english: 'English (US)',
    locale: 'en-US',
    country: 'US',
  },
  {
    code: 'es-ES',
    base: 'es',
    native: 'Español',
    region: 'España',
    english: 'Spanish (Spain)',
    locale: 'es-ES',
    country: 'ES',
  },
  {
    code: 'es-MX',
    base: 'es',
    native: 'Español',
    region: 'México',
    english: 'Spanish (Mexico)',
    locale: 'es-MX',
    country: 'MX',
  },
  {
    code: 'fr',
    base: 'fr',
    native: 'Français',
    region: 'France',
    english: 'French',
    locale: 'fr-FR',
    country: 'FR',
  },
  {
    code: 'de',
    base: 'de',
    native: 'Deutsch',
    region: 'Deutschland',
    english: 'German',
    locale: 'de-DE',
    country: 'DE',
  },
  {
    code: 'pt-BR',
    base: 'pt',
    native: 'Português',
    region: 'Brasil',
    english: 'Portuguese (Brazil)',
    locale: 'pt-BR',
    country: 'BR',
  },
  {
    code: 'pt-PT',
    base: 'pt',
    native: 'Português',
    region: 'Portugal',
    english: 'Portuguese (Portugal)',
    locale: 'pt-PT',
    country: 'PT',
  },
  {
    code: 'ja',
    base: 'ja',
    native: '日本語',
    region: '日本',
    english: 'Japanese',
    locale: 'ja-JP',
    country: 'JP',
  },
  {
    code: 'zh',
    base: 'zh',
    native: '简体中文',
    region: '中国',
    english: 'Chinese (Simplified)',
    locale: 'zh-CN',
    country: 'CN',
  },
  {
    code: 'ko',
    base: 'ko',
    native: '한국어',
    region: '대한민국',
    english: 'Korean',
    locale: 'ko-KR',
    country: 'KR',
  },
] as const satisfies readonly {
  code: string;
  base: string;
  native: string;
  region: string;
  english: string;
  locale: string;
  country: CountryId;
}[];

export type Language = (typeof LANGUAGES)[number]['code'];
/** The language without its country: one dictionary each. */
export type BaseLanguage = (typeof LANGUAGES)[number]['base'];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [Language, ...Language[]];
export const BASE_LANGUAGES = [...new Set(LANGUAGES.map((l) => l.base))] as BaseLanguage[];

/** Codes saved before locales carried a country. */
const LEGACY: Record<string, Language> = { en: 'en-IN', es: 'es-ES', pt: 'pt-BR' };

export function isLanguage(v: unknown): v is Language {
  return typeof v === 'string' && (LANGUAGE_CODES as string[]).includes(v);
}

/** Accepts current and legacy codes; anything else becomes `fallback`. */
export function normalizeLanguage(v: unknown, fallback: Language = 'en-IN'): Language {
  if (isLanguage(v)) return v;
  if (typeof v === 'string' && LEGACY[v]) return LEGACY[v];
  return fallback;
}

function entry(lang: Language) {
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
}

export function baseOf(lang: Language): BaseLanguage {
  return entry(lang).base;
}

export function localeOf(lang: Language): string {
  return entry(lang).locale;
}

export function homeCountryOf(lang: Language): CountryId {
  return entry(lang).country;
}

/** Best match for a browser language tag such as "pt-PT", "es-419" or "ja". */
export function fromBrowser(tag: string): Language {
  const exact = LANGUAGES.find((x) => x.locale.toLowerCase() === tag.toLowerCase());
  if (exact) return exact.code;
  const [l, r = ''] = tag.split('-');
  const region = r.toUpperCase();
  if (l === 'es') return region === 'ES' ? 'es-ES' : 'es-MX';
  if (l === 'pt') return region === 'PT' ? 'pt-PT' : 'pt-BR';
  if (l === 'en') {
    if (region === 'GB' || region === 'IE') return 'en-GB';
    if (region === 'US') return 'en-US';
    return 'en-IN';
  }
  const byBase = LANGUAGES.find((x) => x.base === l);
  return byBase ? byBase.code : 'en-IN';
}

/** Name used when asking the AI to answer in this language, e.g. "Spanish (Mexico)". */
export function promptLanguageName(lang: Language): string {
  const l = entry(lang);
  return l.base === 'en' && l.code !== 'en-IN' ? l.english : `${l.english} (${l.native})`;
}
