import { describe, it, expect } from 'vitest';
import { evaluateWorkerFatigueAndAttrition } from '../../src/shared/rules/fatigue.js';
import type { ShiftRecord, WorkerProfile } from '../../src/shared/types.js';

const worker: WorkerProfile = {
  id: 'w1',
  name: 'Lakshmi R.',
  nameTa: 'Lakshmi R.',
  nameHi: 'Lakshmi R.',
  workplaceId: 'wp',
  sector: 'construction',
  role: 'Helper',
  roleTa: 'Helper',
  roleHi: 'Helper',
  team: 'A',
  hourlyRate: 90,
  dailyWage: 0,
  preferredLanguage: 'ta',
};

function shift(date: string, inT: string, outT: string): ShiftRecord {
  return {
    date,
    workerId: 'w1',
    checkInEventId: `${date}-in`,
    checkOutEventId: `${date}-out`,
    checkInTime: inT,
    checkOutTime: outT,
    originalCheckInTime: inT,
    originalCheckOutTime: outT,
    zoneCode: 'GATE',
    source: 'qr',
    edits: [],
  };
}

describe('fatigue and attrition signals', () => {
  it('flags 7 nights in a row, over 60 h in 7 days and a short rest gap', () => {
    const shifts = [18, 19, 20, 21, 22, 23].map((d) => shift(`2026-10-${d}`, '20:00', '06:00'));
    shifts.push(shift('2026-10-24', '12:00', '23:00'));
    const sig = evaluateWorkerFatigueAndAttrition(worker, shifts, []);
    expect(sig.fatigueLevel).toBe('high');
    expect(sig.consecutiveDays).toBe(7);
    expect(sig.rolling7dHours).toBeGreaterThan(60);
    expect(sig.minRestGapHours).toBe(6);
    expect(sig.fatigueReasons.join(' | ')).toContain('7 days in a row');
    expect(sig.fatigueReasons.join(' | ')).toContain('rest gap 6 h on 24 Oct');
  });

  it('flags rising overtime and missed shifts as attrition risks', () => {
    const sig = evaluateWorkerFatigueAndAttrition(
      { ...worker, otTrend3Weeks: [2, 5, 9], missedShifts14d: 2 },
      [shift('2026-10-20', '08:00', '17:00')],
      []
    );
    expect(sig.attritionLevel).toBe('high');
    expect(sig.attritionReasons.join(' | ')).toContain('overtime rising 3 weeks in a row');
    expect(sig.attritionReasons.join(' | ')).toContain('2 missed shifts in 14 days');
  });

  it('rates normal 5-day weeks with no disputes as low risk', () => {
    const shifts = [20, 21, 22, 23, 24].map((d) => shift(`2026-10-${d}`, '08:00', '17:00'));
    const sig = evaluateWorkerFatigueAndAttrition(worker, shifts, []);
    expect(sig.fatigueLevel).toBe('low');
    expect(sig.attritionLevel).toBe('low');
  });
});
