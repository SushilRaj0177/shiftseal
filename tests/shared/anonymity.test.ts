import { describe, it, expect } from 'vitest';
import {
  evaluateGroupAnonymity,
  ANONYMITY_MIN_RESPONSES,
} from '../../src/shared/rules/anonymity.js';

describe('anonymity.ts', () => {
  const makeEntries = (n: number, team = 'Security') =>
    Array.from({ length: n }, (_, i) => ({
      id: `fb-${i}`,
      workplaceId: 'wp-campus',
      team,
      cleanText: 'Clean text',
      cleanTextEnglish: 'Clean text',
      removed: ['name' as const],
      themes: ['rest_breaks' as const],
      sentiment: -0.5,
      createdAt: '2026-10-26T00:00:00Z',
    }));

  it('requires at least 5 responses', () => {
    expect(ANONYMITY_MIN_RESPONSES).toBe(5);
  });

  it('hides feedback when group has 0 responses', () => {
    const res = evaluateGroupAnonymity('wp-campus', 'Security', []);
    expect(res.visible).toBe(false);
    expect(res.count).toBe(0);
    expect(res.entries).toHaveLength(0);
  });

  it('hides feedback when group has 4 responses (just below threshold)', () => {
    const res = evaluateGroupAnonymity('wp-campus', 'Security', makeEntries(4));
    expect(res.visible).toBe(false);
    expect(res.count).toBe(4);
    expect(res.entries).toHaveLength(0);
    expect(res.themes).toHaveLength(0);
    expect(res.statusMessage).toContain('(4/5)');
  });

  it('unlocks themes and cleaned entries when group reaches 5 responses', () => {
    const res = evaluateGroupAnonymity('wp-campus', 'Security', makeEntries(5));
    expect(res.visible).toBe(true);
    expect(res.count).toBe(5);
    expect(res.entries).toHaveLength(5);
    expect(res.themes[0]).toEqual({ theme: 'rest_breaks', count: 5 });
  });

  it('isolates counts per workplace and team', () => {
    const mixed = [...makeEntries(4, 'Security'), ...makeEntries(3, 'Housekeeping')];
    const sec = evaluateGroupAnonymity('wp-campus', 'Security', mixed);
    expect(sec.visible).toBe(false);
    expect(sec.count).toBe(4);
  });
});
