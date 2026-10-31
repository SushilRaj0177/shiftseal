import { describe, expect, it } from 'vitest';
import type { ShiftRecord } from '../../src/shared/types.js';
import {
  ageOn,
  assessMinorNight,
  assessStudentLimits,
  studentReadings,
} from '../../src/shared/rules/students.js';

const shift = (date: string, from: string, to: string): ShiftRecord => ({
  date,
  workerId: 'w1',
  checkInEventId: `in-${date}-${from}`,
  checkOutEventId: `out-${date}-${to}`,
  checkInTime: from,
  checkOutTime: to,
  originalCheckInTime: from,
  originalCheckOutTime: to,
  zoneCode: 'COUNTER',
  source: 'qr',
  edits: [],
});
const JP = { sector: 'retail' as const, country: 'JP' as const };
const reading = (rs: ReturnType<typeof studentReadings>, id: string) => rs.find((r) => r.id === id);

describe('student and young worker limits', () => {
  it('counts every job toward Japan’s 28-hour student visa cap', () => {
    // 20 h at an izakaya and 10 h at a konbini in the same week: 30 h, over 28.
    const izakaya = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map((d) =>
      shift(d, '17:00', '22:00')
    );
    const konbini = [shift('2026-11-06', '08:00', '13:00'), shift('2026-11-07', '08:00', '13:00')];
    const rs = studentReadings(
      { student: 'international' },
      [...izakaya, ...konbini],
      JP,
      '2026-11-07'
    );
    expect(reading(rs, 'studentWeek')).toMatchObject({ value: 30, cap: 28 });
    const flags = assessStudentLimits('w1', rs);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ code: 'STUDENT_LIMIT', concerns: 'employer' });
  });

  it('switches to 8 hours a day during an official school break in Japan', () => {
    const rs = studentReadings(
      { student: 'international', breakUntil: '2026-08-31' },
      [shift('2026-08-10', '09:00', '18:00')],
      JP,
      '2026-08-10'
    );
    expect(reading(rs, 'studentDay')).toMatchObject({ value: 9, cap: 8 });
    expect(reading(rs, 'studentWeek')).toMatchObject({ cap: 40 });
  });

  it('leaves weekends out of Korea’s weekday cap', () => {
    const rs = studentReadings(
      { student: 'international' },
      [shift('2026-11-02', '09:00', '19:00'), shift('2026-11-07', '09:00', '19:00')],
      { sector: 'retail', country: 'KR' },
      '2026-11-08'
    );
    expect(reading(rs, 'studentWeek')).toMatchObject({ value: 10, cap: 25 });
  });

  it('counts Germany’s 140 days, a short shift as half a day', () => {
    const rs = studentReadings(
      { student: 'international' },
      [shift('2026-03-02', '09:00', '12:00'), shift('2026-03-03', '09:00', '17:00')],
      { sector: 'retail', country: 'DE' },
      '2026-03-10'
    );
    expect(reading(rs, 'studentDays')).toMatchObject({ value: 1.5, cap: 140 });
  });

  it('keeps France’s cap yearly, and asks nothing of students without a visa', () => {
    const fr = { sector: 'retail' as const, country: 'FR' as const };
    const s = [shift('2026-02-02', '09:00', '13:00')];
    expect(
      reading(studentReadings({ student: 'international' }, s, fr, '2026-02-03'), 'studentYear')
    ).toMatchObject({ value: 4, cap: 964 });
    expect(studentReadings({ student: 'student' }, s, fr, '2026-02-03')).toEqual([]);
  });

  it('protects under-18s: Japan’s night ban and 8-hour day', () => {
    const profile = { birthDate: '2009-06-01' };
    expect(ageOn(profile.birthDate, '2026-11-02')).toBe(17);
    const late = shift('2026-11-02', '17:00', '23:00');
    const flags = assessMinorNight('w1', late, profile, JP);
    expect(flags[0]).toMatchObject({ code: 'MINOR_NIGHT', facts: { minutes: 60 } });
    const rs = studentReadings(profile, [late], JP, '2026-11-02');
    expect(reading(rs, 'minorDay')).toMatchObject({ value: 6, cap: 8 });
    // Turning 18 lifts it.
    expect(assessMinorNight('w1', { ...late, date: '2027-06-01' }, profile, JP)).toEqual([]);
  });

  it('gives US under-16s 18 hours in a school week and 40 when school is out', () => {
    const us = { sector: 'retail' as const, country: 'US' as const };
    const kid = { birthDate: '2011-01-01' };
    expect(reading(studentReadings(kid, [], us, '2026-10-05'), 'minorWeek')).toMatchObject({
      cap: 18,
    });
    expect(
      reading(
        studentReadings({ ...kid, breakUntil: '2026-10-31' }, [], us, '2026-10-05'),
        'minorWeek'
      )
    ).toMatchObject({ cap: 40 });
    // 16- and 17-year-olds have no federal hour limits.
    expect(studentReadings({ birthDate: '2009-01-01' }, [], us, '2026-10-05')).toEqual([]);
  });
});
