import { describe, it, expect } from 'vitest';
import {
  buildFallbackStructuredClaim,
  buildFallbackHazard,
  buildFallbackAnonymisedFeedback,
} from '../../src/server/gemini/demo-fallbacks.js';

describe('demo fallbacks (used only when Gemini is unavailable)', () => {
  it('produces a well-formed claim with a valid ISO date and bounded hours', () => {
    const claim = buildFallbackStructuredClaim('I stayed 2 extra hours on Saturday', 'en');
    expect(claim.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(claim.extraHours).toBeGreaterThan(0);
    expect(claim.extraHours).toBeLessThanOrEqual(16);
    expect(claim.confidence).toBeGreaterThanOrEqual(0);
    expect(claim.confidence).toBeLessThanOrEqual(1);
  });

  it('builds the hazard summary from the worker’s own words', () => {
    const text = 'Loose plank on scaffold level four';
    const hazard = buildFallbackHazard(text, 'construction', 'en');
    expect(hazard.description).toContain('Loose plank');
    expect(['low', 'medium', 'high', 'critical']).toContain(hazard.aiSeverity);
  });

  it('returns de-identified feedback in the expected shape', () => {
    const fb = buildFallbackAnonymisedFeedback('Supervisor Ravi shouted at me near Gate 2', 'en');
    expect(fb.cleanText.length).toBeGreaterThan(0);
    expect(Array.isArray(fb.removed)).toBe(true);
    expect(fb.sentiment).toBeGreaterThanOrEqual(-1);
    expect(fb.sentiment).toBeLessThanOrEqual(1);
  });
});
