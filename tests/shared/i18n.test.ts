import { describe, it, expect } from 'vitest';
import { dictionaries, t } from '../../src/shared/i18n/index.js';
import { en } from '../../src/shared/i18n/en.js';

describe('i18n dictionaries', () => {
  const keys = Object.keys(en) as (keyof typeof en)[];

  it.each(['en', 'ta', 'hi'] as const)('%s defines every key with non-empty text', (lang) => {
    for (const key of keys) {
      expect(dictionaries[lang][key], `${lang}.${key}`).toBeTypeOf('string');
      expect(dictionaries[lang][key].trim().length, `${lang}.${key}`).toBeGreaterThan(0);
    }
  });

  it('translates worker-facing navigation into Tamil and Hindi', () => {
    expect(t('ta', 'navHome')).not.toBe(t('en', 'navHome'));
    expect(t('hi', 'navHome')).not.toBe(t('en', 'navHome'));
  });

  it('contains no emoji in any translation', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const lang of ['en', 'ta', 'hi'] as const) {
      for (const key of keys)
        expect(emoji.test(dictionaries[lang][key]), `${lang}.${key}`).toBe(false);
    }
  });
});
