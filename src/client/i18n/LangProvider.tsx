import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Language } from '../../shared/types.js';
import type { CountryId } from '../../shared/countries/types.js';
import { countryPack } from '../../shared/countries/index.js';
import { baseOf, fromBrowser, homeCountryOf, normalizeLanguage } from '../../shared/languages.js';
import { money as formatMoney } from '../lib/format.js';
import { dictionaries, type StringKey } from './strings.js';
import { VARIANTS } from './variants.js';
import { COUNTRY_TEXT } from './countries/index.js';

type Args = (string | number)[];

interface LangContextValue {
  lang: Language;
  setLang(l: Language): void;
  /** The country whose law and wording apply: the workplace's, or the language's home country. */
  country: CountryId;
  /** Set by the worker and employer apps once a workplace is loaded; null when there is none. */
  setWorkplaceCountry(c: CountryId | null): void;
  t(key: StringKey, ...args: Args): string;
  /** For keys built at run time: deduction, annual payment, outside body and limit names. */
  tx(key: string, ...args: Args): string;
  /** An amount in the country's currency, written the reader's way. */
  money(n: number): string;
  currency: string;
}

const LangContext = createContext<LangContextValue | null>(null);
const KEY = 'shiftseal.lang';

function initial(): Language {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return normalizeLanguage(saved);
  } catch {
    // storage unavailable
  }
  return fromBrowser(navigator.language);
}

export function format(template: string, args: Args): string {
  return template.replace(/\{(\d)\}/g, (_, i: string) => String(args[Number(i)] ?? ''));
}

/**
 * The text for a key. Country wording wins (in the reader's language if the
 * country has it, otherwise in English); then the locale's own spelling;
 * then the language; then English. Unknown keys return ''.
 */
export function lookup(lang: Language, country: CountryId, key: string): string {
  const pack = COUNTRY_TEXT[country];
  const base = baseOf(lang);
  if (key in pack.en) return pack[base]?.[key] ?? pack.en[key];
  const variant = VARIANTS[lang] as Record<string, string> | undefined;
  const own = dictionaries[base] as Record<string, string>;
  const en = dictionaries.en as Record<string, string>;
  return variant?.[key] ?? own[key] ?? en[key] ?? '';
}

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(initial);
  const [workplaceCountry, setWorkplaceCountry] = useState<CountryId | null>(null);
  const country = workplaceCountry ?? homeCountryOf(lang);
  const currency = countryPack({ country }).currency;

  useEffect(() => {
    document.documentElement.lang = baseOf(lang);
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // storage unavailable
    }
  }, []);

  const tx = useCallback(
    (key: string, ...args: Args) => format(lookup(lang, country, key), args),
    [lang, country]
  );
  const t = useCallback((key: StringKey, ...args: Args) => tx(key, ...args), [tx]);
  const money = useCallback((n: number) => formatMoney(n, lang, currency), [lang, currency]);

  const value = useMemo(
    () => ({ lang, setLang, country, setWorkplaceCountry, t, tx, money, currency }),
    [lang, setLang, country, t, tx, money, currency]
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang outside LangProvider');
  return ctx;
}
