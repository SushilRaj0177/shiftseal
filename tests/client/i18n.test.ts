import { describe, it, expect } from 'vitest';
import { dictionaries, en } from '../../src/client/i18n/strings.js';
import { format, lookup } from '../../src/client/i18n/LangProvider.js';
import { VARIANTS } from '../../src/client/i18n/variants.js';
import { COUNTRY_TEXT } from '../../src/client/i18n/countries/index.js';
import { COUNTRY_KEYS, packKeys } from '../../src/client/i18n/country.js';
import { BASE_LANGUAGES } from '../../src/shared/languages.js';
import { COUNTRY_IDS } from '../../src/shared/countries/types.js';

const placeholders = (s: string) => (s.match(/\{\d\}/g) ?? []).sort().join(',');

describe('translations', () => {
  it('has every English string in every language, with the same placeholders', () => {
    for (const lang of BASE_LANGUAGES) {
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        const value = dictionaries[lang][key];
        expect(value, `${lang}.${key}`).toBeTruthy();
        expect(placeholders(value), `${lang}.${key}`).toBe(placeholders(en[key]));
      }
    }
  });

  it('keeps locale variants to known keys with the same placeholders', () => {
    for (const [code, dict] of Object.entries(VARIANTS)) {
      for (const [key, value] of Object.entries(dict ?? {})) {
        expect(key in en, `${code}.${key}`).toBe(true);
        expect(placeholders(value as string), `${code}.${key}`).toBe(
          placeholders(en[key as keyof typeof en])
        );
      }
    }
  });

  it('gives every country its own legal wording in every language', () => {
    for (const id of COUNTRY_IDS) {
      const text = COUNTRY_TEXT[id];
      const required = [...COUNTRY_KEYS, ...packKeys(id)];
      for (const lang of BASE_LANGUAGES) {
        const dict = text[lang];
        expect(dict, `${id}.${lang}`).toBeDefined();
        for (const key of required) expect(dict![key], `${id}.${lang}.${key}`).toBeTruthy();
        for (const key of Object.keys(dict!)) {
          expect(placeholders(dict![key]), `${id}.${lang}.${key}`).toBe(placeholders(text.en[key]));
        }
      }
    }
  });

  it('never shows Indian law outside India', () => {
    for (const id of COUNTRY_IDS.filter((c) => c !== 'IN')) {
      for (const lang of ['en-GB', 'ja', 'es-MX', 'pt-BR', 'fr'] as const) {
        const words = COUNTRY_KEYS.map((k) => lookup(lang, id, k)).join(' ');
        expect(words, `${id} ${lang}`).not.toMatch(
          /POSH|Internal Committee|Shops and Establishments|उत्पीड़न|உள் குழு/
        );
      }
    }
  });

  it('uses the workplace country first, then the locale, then the language', () => {
    expect(lookup('ja', 'JP', 'committeeLabel')).toBe('ハラスメント相談窓口');
    expect(lookup('ta', 'JP', 'committeeLabel')).toBe('துன்புறுத்தல் ஆலோசனை மையம்');
    expect(lookup('es-ES', 'MX', 'typeWfh')).toBe('Home office');
    expect(lookup('es-MX', 'MX', 'checkIn')).toBe('Checar entrada');
    expect(lookup('es-ES', 'ES', 'checkIn')).toBe('Fichar entrada');
    expect(lookup('en-US', 'US', 'checkIn')).toBe('Clock in');
  });

  it('fills placeholders and leaves no emoji in the interface', () => {
    expect(format('Sent to {0}', ['+91 98410 23456'])).toBe('Sent to +91 98410 23456');
    const all = [
      ...Object.values(dictionaries).flatMap((d) => Object.values(d)),
      ...Object.values(COUNTRY_TEXT).flatMap((c) =>
        Object.values(c).flatMap((d) => Object.values(d!))
      ),
    ].join(' ');
    expect(all).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
