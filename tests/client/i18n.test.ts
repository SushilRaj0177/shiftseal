import { describe, it, expect } from 'vitest';
import { dictionaries, en } from '../../src/client/i18n/strings.js';
import { format } from '../../src/client/i18n/LangProvider.js';
import { LANGUAGE_CODES } from '../../src/shared/languages.js';

const placeholders = (s: string) => (s.match(/\{\d\}/g) ?? []).sort().join(',');

describe('worker app translations', () => {
  it('has every English string in every language, with the same placeholders', () => {
    for (const lang of LANGUAGE_CODES.filter((l) => l !== 'en')) {
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        const value = dictionaries[lang][key];
        expect(value, `${lang}.${key}`).toBeTruthy();
        expect(placeholders(value), `${lang}.${key}`).toBe(placeholders(en[key]));
      }
    }
  });

  it('fills placeholders and leaves no emoji in the interface', () => {
    expect(format('Sent to {0}', ['+91 98410 23456'])).toBe('Sent to +91 98410 23456');
    const all = Object.values(dictionaries)
      .flatMap((d) => Object.values(d))
      .join(' ');
    expect(all).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
