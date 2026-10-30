/** Every language the app speaks. Order is the order shown in pickers. */
export const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English', locale: 'en-IN' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', locale: 'ta-IN' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', locale: 'hi-IN' },
  { code: 'es', native: 'Español', english: 'Spanish', locale: 'es' },
  { code: 'fr', native: 'Français', english: 'French', locale: 'fr' },
  { code: 'de', native: 'Deutsch', english: 'German', locale: 'de' },
  { code: 'pt', native: 'Português', english: 'Portuguese', locale: 'pt' },
  { code: 'ja', native: '日本語', english: 'Japanese', locale: 'ja' },
  { code: 'zh', native: '简体中文', english: 'Chinese (Simplified)', locale: 'zh-CN' },
  { code: 'ko', native: '한국어', english: 'Korean', locale: 'ko' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [Language, ...Language[]];

export function isLanguage(v: unknown): v is Language {
  return typeof v === 'string' && (LANGUAGE_CODES as string[]).includes(v);
}

export function localeOf(lang: Language): string {
  return LANGUAGES.find((l) => l.code === lang)?.locale ?? 'en-IN';
}

/** Name used when asking the AI to answer in this language, e.g. "Japanese (日本語)". */
export function promptLanguageName(lang: Language): string {
  const l = LANGUAGES.find((x) => x.code === lang);
  if (!l || l.code === 'en') return 'English';
  return `${l.english} (${l.native})`;
}
