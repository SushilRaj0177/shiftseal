import { describe, it, expect } from 'vitest';
import {
  buildFallbackStructuredClaim,
  buildFallbackHazard,
  detectScript,
} from '../../src/server/gemini/fallbacks.js';
import { buildStructureClaimPrompt, recentWeekdays } from '../../src/server/gemini/prompts.js';

describe('fallbacks (used only when Gemini is unavailable)', () => {
  it('resolves weekday words to the most recent past date, in any language', () => {
    // 2026-10-27 is a Tuesday.
    expect(
      buildFallbackStructuredClaim('I stayed 2 extra hours on Saturday', 'en-IN', '2026-10-27').date
    ).toBe('2026-10-24');
    expect(
      buildFallbackStructuredClaim('சனிக்கிழமை ரெண்டு மணி நேரம்', 'en-IN', '2026-10-27')
    ).toMatchObject({
      date: '2026-10-24',
      extraHours: 2,
      detectedLanguage: 'ta',
    });
    expect(buildFallbackStructuredClaim('stayed late', 'en-IN', '2026-10-27').date).toBe(
      '2026-10-27'
    );
    expect(recentWeekdays('2026-10-27').Tuesday).toBe('2026-10-20');
  });

  it("keeps the worker's own words and asks them to check the guess", () => {
    const claim = buildFallbackStructuredClaim(
      'three hours on friday for the slab',
      'en-IN',
      '2026-10-27'
    );
    expect(claim.reason).toBe('three hours on friday for the slab');
    expect(claim.extraHours).toBe(3);
    expect(claim.confidence).toBeLessThan(0.5);
  });

  it('builds the hazard summary from the worker’s own words and does not guess a type', () => {
    const hazard = buildFallbackHazard(
      'Loose plank on scaffold level four',
      'construction',
      'en-IN'
    );
    expect(hazard.description).toContain('Loose plank');
    expect(hazard.hazardType).toBe('scaffold');
    expect(buildFallbackHazard('something is wrong', 'construction', 'en-IN').hazardType).toBe(
      'other'
    );
  });

  it('gives the model the real date to resolve relative days against', () => {
    const prompt = buildStructureClaimPrompt('2026-10-27', 'ta');
    expect(prompt).toContain('2026-10-27 (Tuesday)');
    expect(prompt).toContain('"Saturday" or "last Saturday" -> "2026-10-24"');
  });

  it('detects the language from its script and reads weekdays in new languages', () => {
    expect(detectScript('土曜日に2時間残業しました', 'en-IN')).toBe('ja');
    expect(detectScript('星期六加班两个小时', 'en-IN')).toBe('zh');
    expect(detectScript('토요일에 2시간 더 일했어요', 'en-IN')).toBe('ko');
    expect(detectScript("J'ai travaillé samedi", 'fr')).toBe('fr');
    const claim = buildFallbackStructuredClaim('土曜日に3時間残業しました', 'ja', '2026-10-27');
    expect(claim).toMatchObject({ date: '2026-10-24', extraHours: 3, detectedLanguage: 'ja' });
    expect(
      buildFallbackStructuredClaim('Trabajé 2 horas extra el sábado', 'es-ES', '2026-10-27').date
    ).toBe('2026-10-24');
  });
});
