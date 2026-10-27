import { describe, it, expect } from 'vitest';
import { check } from '../../src/shared/rules/factcheck.js';

describe('factcheck.ts', () => {
  const truth = {
    normalHours: 45,
    otHours: 4.67,
    hourlyRate: 100,
    netPay: 5084.25,
  };

  it('passes when all cited numbers match truth and all numbers in text are cited', () => {
    const res = check(
      [
        { ref: 'normalHours', value: 45 },
        { ref: 'otHours', value: 4.67 },
        { ref: 'netPay', value: 5084.25 },
      ],
      truth,
      'You worked 45 normal hours and 4.67 overtime hours for ₹5084.25.'
    );
    expect(res.passed).toBe(true);
  });

  it('allows ±0.01 tolerance on hour references', () => {
    const res = check([{ ref: 'otHours', value: 4.68 }], truth, 'Your overtime is 4.68 hours.');
    expect(res.passed).toBe(true);
  });

  it('fails when an hour reference exceeds ±0.01 tolerance', () => {
    const res = check([{ ref: 'otHours', value: 4.75 }], truth, 'Your overtime is 4.75 hours.');
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('Hours mismatch');
  });

  it('fails when a cited money value is off by even 1 paisa', () => {
    const res = check([{ ref: 'netPay', value: 5084.26 }], truth, 'Your net pay is ₹5084.26.');
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('Money/value mismatch');
  });

  it('fails when an unknown ref is cited', () => {
    const res = check([{ ref: 'bonusPay', value: 500 }], truth, 'Bonus ₹500.');
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('does not exist');
  });

  it('fails when answer text contains an uncited number', () => {
    const res = check(
      [{ ref: 'normalHours', value: 45 }],
      truth,
      'You worked 45 hours and got ₹2000 extra.'
    );
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('uncited number 2000');
  });

  it('fails when citedFacts is empty', () => {
    const res = check([], truth, 'Your pay is ready.');
    expect(res.passed).toBe(false);
  });
});
