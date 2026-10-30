import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Language } from '../../shared/types.js';
import { isLanguage } from '../../shared/languages.js';
import { dictionaries, type StringKey } from './strings.js';

interface LangContextValue {
  lang: Language;
  setLang(l: Language): void;
  t(key: StringKey, ...args: (string | number)[]): string;
}

const LangContext = createContext<LangContextValue | null>(null);
const KEY = 'shiftseal.lang';

function initial(): Language {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // storage unavailable
  }
  const nav = navigator.language.slice(0, 2);
  return isLanguage(nav) ? nav : 'en';
}

export function format(template: string, args: (string | number)[]): string {
  return template.replace(/\{(\d)\}/g, (_, i: string) => String(args[Number(i)] ?? ''));
}

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(initial);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // storage unavailable
    }
  }, []);

  const t = useCallback(
    // Unknown keys (e.g. a flag code with no translation yet) return '' so callers can fall back.
    (key: StringKey, ...args: (string | number)[]) =>
      format(dictionaries[lang][key] ?? dictionaries.en[key] ?? '', args),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang outside LangProvider');
  return ctx;
}
