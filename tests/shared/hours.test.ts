import { describe, it, expect } from 'vitest';
import type { ShiftRecord } from '../../src/shared/types.js';
import {
  parseTimeMinutes,
  roundHours,
  computeShiftDurationHours,
  calculateWeekHours,
} from '../../src/shared/rules/hours.js';

function makeShift(date: string, checkInTime: string, checkOutTime?: string): ShiftRecord {
  return {
    date,
    workerId: 'w-murugan',
    checkInEventId: `in-${date}`,
    checkOutEventId: checkOutTime ? `out-${date}` : undefined,
    checkInTime,
    checkOutTime,
    originalCheckInTime: checkInTime,
    originalCheckOutTime: checkOutTime,
    zoneCode: 'TB-GATE',
    source: 'qr',
    edits: [],
  };
}

describe('hours.ts', () => {
  it('parses HH:mm and ISO strings into minutes accurately', () => {
    expect(parseTimeMinutes('09:00')).toBe(540);
    expect(parseTimeMinutes('20:40')).toBe(1240);
    expect(parseTimeMinutes('2026-10-20T08:30:00Z')).toBe(510);
  });

  it('throws on invalid time strings', () => {
    expect(() => parseTimeMinutes('invalid')).toThrow();
  });

  it('rounds hours to two decimals', () => {
    expect(roundHours(2.66666)).toBe(2.67);
    expect(roundHours(8.001)).toBe(8);
  });

  it('computes daytime duration and detects midnight crossing for night shifts', () => {
    const day = computeShiftDurationHours('09:00', '17:30');
    expect(day.hours).toBe(8.5);
    expect(day.crossesMidnight).toBe(false);

    const night = computeShiftDurationHours('20:00', '08:00');
    expect(night.hours).toBe(12);
    expect(night.crossesMidnight).toBe(true);
  });

  it('handles an empty week cleanly', () => {
    const res = calculateWeekHours([], 'construction');
    expect(res.normalHours).toBe(0);
    expect(res.otHours).toBe(0);
    expect(res.dailyOtHours).toBe(0);
    expect(res.weeklyExtraOtHours).toBe(0);
    expect(res.perDay).toHaveLength(0);
  });

  it('ignores open shifts without a checkOutTime', () => {
    const res = calculateWeekHours([makeShift('2026-10-27', '09:00', undefined)], 'construction');
    expect(res.normalHours).toBe(0);
    expect(res.perDay).toHaveLength(0);
  });

  it('splits normal hours (<=8h) and daily overtime (>8h)', () => {
    const shifts = [
      makeShift('2026-10-19', '09:00', '17:00'), // 8h normal
      makeShift('2026-10-20', '09:00', '20:30'), // 8h normal + 3.5h OT
    ];
    const res = calculateWeekHours(shifts, 'construction');
    expect(res.normalHours).toBe(16);
    expect(res.dailyOtHours).toBe(3.5);
    expect(res.weeklyExtraOtHours).toBe(0);
    expect(res.otHours).toBe(3.5);
  });

  it('calculates weekly overtime beyond 48h without double-counting daily overtime', () => {
    const days = [
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ];
    // 7 days * 10h = 70h total
    // Each day has 8h normal + 2h daily OT => 56h daily-normal + 14h daily OT
    // Weekly normal cap is 48h => 56 - 48 = 8h weekly extra OT
    // Total OT = 14 + 8 = 22h (48 normal + 22 OT = 70h total, zero double counting)
    const shifts = days.map((d) => makeShift(d, '08:00', '18:00'));
    const res = calculateWeekHours(shifts, 'construction');
    expect(res.normalHours).toBe(48);
    expect(res.dailyOtHours).toBe(14);
    expect(res.weeklyExtraOtHours).toBe(8);
    expect(res.otHours).toBe(22);
    expect(res.totalHours).toBe(70);
  });

  it('assigns night shifts crossing midnight to the start date and cites the law', () => {
    const shifts = [makeShift('2026-10-24', '21:00', '07:00')]; // 10h
    const res = calculateWeekHours(shifts, 'campus');
    expect(res.perDay[0].date).toBe('2026-10-24');
    expect(res.perDay[0].crossesMidnight).toBe(true);
    expect(res.normalHours).toBe(8);
    expect(res.otHours).toBe(2);
    expect(res.ruleRefs.map((r) => r.id)).toEqual(['hours.daily', 'ot.weekly', 'ot.multiplier']);
    expect(res.ruleRefs[0].source).toMatch(
      /Occupational Safety, Health and Working Conditions Code/
    );
  });
});
