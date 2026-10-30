import { describe, it, expect } from 'vitest';
import type { ShiftRecord } from '../../src/shared/types.js';
import { calculateHours, type WorkplaceHours } from '../../src/shared/rules/hours.js';
import { calculatePayslip } from '../../src/shared/rules/pay.js';
import { leaveBalances } from '../../src/shared/rules/leave.js';
import { limitReadings } from '../../src/shared/rules/limits.js';
import { assessLimits } from '../../src/shared/rules/flags.js';
import { COUNTRIES, payDueDate, countryPack } from '../../src/shared/countries/index.js';
import { japanAnnualLeave } from '../../src/shared/countries/jp.js';
import { koreaAnnualLeave } from '../../src/shared/countries/kr.js';
import { mexicoAnnualLeave } from '../../src/shared/countries/mx.js';
import { chinaAnnualLeave } from '../../src/shared/countries/cn.js';
import { portugalAnnualLeave } from '../../src/shared/countries/pt.js';
import { addDays } from '../../src/shared/time.js';

function shift(date: string, from: string, to: string): ShiftRecord {
  return {
    date,
    workerId: 'w',
    checkInEventId: `in-${date}`,
    checkOutEventId: `out-${date}`,
    checkInTime: from,
    checkOutTime: to,
    originalCheckInTime: from,
    originalCheckOutTime: to,
    zoneCode: 'Z',
    source: 'qr',
    edits: [],
  };
}

/** Weekdays Monday–Friday from `monday`, each `from`–`to`. */
function week(monday: string, from: string, to: string): ShiftRecord[] {
  return [0, 1, 2, 3, 4].map((i) => shift(addDays(monday, i), from, to));
}

const bands = (
  wp: WorkplaceHours,
  shifts: ShiftRecord[],
  period?: { start: string; end: string }
) =>
  calculateHours(shifts, wp, period).priced.reduce<Record<string, number>>((acc, p) => {
    const k = `${p.kind}@${p.multiplier}`;
    acc[k] = Math.round(((acc[k] ?? 0) + p.hours) * 100) / 100;
    return acc;
  }, {});

describe('every country pack', () => {
  it('cites a source for every rule it uses, and its limits and leave rules exist', () => {
    for (const pack of Object.values(COUNTRIES)) {
      for (const r of Object.values(pack.rules))
        expect(r.source.length, `${pack.id} ${r.id}`).toBeGreaterThan(10);
      expect(pack.rules['ot.multiplier'], `${pack.id} ot.multiplier`).toBeDefined();
      expect(pack.rules['ot.weekly'], `${pack.id} ot.weekly`).toBeDefined();
      expect(pack.rules['pay.monthlyHourlyBasis'], `${pack.id} basis`).toBeDefined();
      for (const m of pack.limits)
        expect(
          countryPack({ country: pack.id }).rules[m.rule],
          `${pack.id} ${m.rule}`
        ).toBeDefined();
      for (const t of pack.leave.types)
        if (t.rule) expect(pack.rules[t.rule], `${pack.id} ${t.rule}`).toBeDefined();
      for (const a of pack.pay.annual)
        expect(pack.rules[a.rule], `${pack.id} ${a.rule}`).toBeDefined();
      if (pack.overtime.restDay)
        expect(pack.rules['ot.restDay'], `${pack.id} restDay`).toBeDefined();
      if (pack.overtime.night) expect(pack.rules['ot.night'], `${pack.id} night`).toBeDefined();
      expect(pack.rules['complaints.handlers'], `${pack.id} complaints`).toBeDefined();
    }
  });
});

describe('Japan', () => {
  const jp: WorkplaceHours = { sector: 'office', country: 'JP', payCycle: 'monthly' };

  it('pays 25% up to 60 overtime hours in a month and 50% beyond', () => {
    // 2026-11: Mondays 2, 9, 16, 23; 4 weeks of 5 × 11h days = 3h overtime a day, 60h; plus one more 2h.
    const shifts = [
      ...week('2026-11-02', '08:00', '20:00'),
      ...week('2026-11-09', '08:00', '20:00'),
      ...week('2026-11-16', '08:00', '20:00'),
      ...week('2026-11-23', '08:00', '20:00'),
      shift('2026-11-30', '08:00', '19:00'),
    ];
    // 12h days, no break recorded: 4h overtime a day × 20 days = 80h, then 3h more.
    const b = bands(jp, shifts);
    expect(b['overtime@1.25']).toBe(60);
    expect(b['overtime@1.5']).toBe(23);
  });

  it('pays the legal rest day (Sunday) at 135% and Saturday as ordinary overtime', () => {
    const b = bands(jp, [
      ...week('2026-11-02', '09:00', '17:00'),
      shift('2026-11-07', '09:00', '13:00'), // Saturday, beyond 40h
      shift('2026-11-08', '09:00', '15:00'), // Sunday
    ]);
    expect(b['overtime@1.25']).toBe(4);
    expect(b['rest_day@1.35']).toBe(6);
  });

  it('adds a 25% night premium for 22:00–05:00 and rounds yen to whole numbers', () => {
    const hours = calculateHours([shift('2026-11-04', '18:00', '02:00')], jp);
    expect(hours.nightHours).toBe(4);
    const slip = calculatePayslip({
      workerId: 'w',
      weekLabel: 'Nov',
      workplace: jp,
      hourlyRate: 1333,
      hoursResult: hours,
    });
    const night = slip.lines.find((l) => l.kind === 'night')!;
    expect(night.amount).toBe(Math.round(4 * 1333 * 0.25));
    expect(slip.currency).toBe('JPY');
    expect(Number.isInteger(slip.netPay)).toBe(true);
  });

  it('grants 10 days of annual leave after 6 months and 20 after 6½ years', () => {
    expect(japanAnnualLeave('2026-01-01', '2026-06-30')).toBe(0);
    expect(japanAnnualLeave('2026-01-01', '2026-07-01')).toBe(10);
    expect(japanAnnualLeave('2019-01-01', '2026-07-01')).toBe(20);
  });

  it('reads the 36-agreement cap and flags going over it as the employer’s', () => {
    const shifts = [
      ...week('2026-11-02', '08:00', '20:00'),
      ...week('2026-11-09', '08:00', '20:00'),
      ...week('2026-11-16', '08:00', '19:00'),
    ];
    const r = limitReadings(shifts, jp, '2026-11-20');
    const month = r.find((x) => x.id === 'jpMonth')!;
    expect(month.value).toBe(55);
    expect(month.cap).toBe(45);
    const flags = assessLimits('w', r);
    expect(flags.map((f) => f.code)).toEqual(['LIMIT_EXCEEDED']);
    expect(flags[0].concerns).toBe('employer');
  });
});

describe('South Korea', () => {
  const kr: WorkplaceHours = { sector: 'construction', country: 'KR', payCycle: 'monthly' };
  it('pays holiday work at 150% up to 8 hours and 200% after, and a paid weekly rest day', () => {
    const shifts = [...week('2026-11-02', '09:00', '17:00'), shift('2026-11-08', '08:00', '18:00')];
    const hours = calculateHours(shifts, kr);
    const b = bands(kr, shifts);
    expect(b['rest_day@1.5']).toBe(8);
    expect(b['rest_day@2']).toBe(2);
    const slip = calculatePayslip({
      workerId: 'w',
      weekLabel: 'w',
      workplace: kr,
      hourlyRate: 10000,
      hoursResult: hours,
    });
    expect(slip.lines.find((l) => l.kind === 'weekly_rest')!.amount).toBe(80000);
  });
  it('counts the 52-hour week including rest-day work', () => {
    const shifts = [...week('2026-11-02', '08:00', '19:00'), shift('2026-11-08', '09:00', '17:00')];
    const r = limitReadings(shifts, kr, '2026-11-08').find((x) => x.id === 'krWeek')!;
    expect(r.value).toBe(63);
  });
  it('grants annual leave by service: monthly in year one, 16 days in year three', () => {
    expect(koreaAnnualLeave('2026-01-01', '2026-06-15')).toBe(5);
    expect(koreaAnnualLeave('2023-01-01', '2026-02-01')).toBe(16);
    expect(koreaAnnualLeave('1990-01-01', '2026-02-01')).toBe(25);
  });
});

describe('China', () => {
  const cn: WorkplaceHours = {
    sector: 'office',
    country: 'CN',
    payCycle: 'monthly',
    holidays: ['2026-10-01'],
  };
  it('pays weekday overtime 150%, rest days 200% and public holidays 300%', () => {
    const b = bands(cn, [
      shift('2026-09-28', '09:00', '19:00'),
      shift('2026-10-01', '09:00', '13:00'),
      shift('2026-10-03', '09:00', '12:00'),
    ]);
    expect(b['overtime@1.5']).toBe(2);
    expect(b['holiday@3']).toBe(4);
    expect(b['rest_day@2']).toBe(3);
  });
  it('grants 5, 10 or 15 days by cumulative working years', () => {
    expect(chinaAnnualLeave('2026-01-01', '2026-10-01')).toBe(0);
    expect(chinaAnnualLeave('2020-01-01', '2026-10-01')).toBe(5);
    expect(chinaAnnualLeave('2010-01-01', '2026-10-01')).toBe(10);
  });
});

describe('France', () => {
  it('counts overtime from 35 hours: +25% for 8 hours, +50% after', () => {
    const fr: WorkplaceHours = { sector: 'office', country: 'FR', payCycle: 'monthly' };
    const b = bands(fr, week('2026-11-02', '08:00', '18:00')); // 50h
    expect(b['overtime@1.25']).toBe(8);
    expect(b['overtime@1.5']).toBe(7);
  });
});

describe('Germany', () => {
  it('has no statutory premium but applies the agreed rate, and 25% for night work from 23:00', () => {
    const de: WorkplaceHours = {
      sector: 'office',
      country: 'DE',
      payCycle: 'monthly',
      overtimeMultiplier: 1.25,
    };
    const shifts = [...week('2026-11-02', '08:00', '17:00'), shift('2026-11-06', '20:00', '01:00')];
    const hours = calculateHours(shifts, de);
    expect(bands(de, shifts)['overtime@1.25']).toBe(10);
    expect(hours.nightHours).toBe(2);
  });
});

describe('Mexico', () => {
  const mx: WorkplaceHours = {
    sector: 'construction',
    country: 'MX',
    payCycle: 'weekly',
    payDay: 1,
  };
  it('pays the first 9 overtime hours of the week double and the rest triple, plus 25% on Sundays', () => {
    const shifts = [
      ...[0, 1, 2, 3, 4, 5].map((i) => shift(addDays('2026-11-02', i), '07:00', '17:00')),
    ];
    // 6 × 10h = 60h: 2h daily overtime × 6 = 12h.
    const b = bands(mx, shifts);
    expect(b['overtime@2']).toBe(9);
    expect(b['overtime@3']).toBe(3);
    const sunday = calculateHours([shift('2026-11-01', '09:00', '15:00')], {
      ...mx,
      weeklyOff: [6],
    });
    expect(sunday.sundayHours).toBe(6);
  });
  it('steps the 48-hour week down from 2027 and grants 22 vacation days in year six', () => {
    const sixDays = (monday: string) =>
      [0, 1, 2, 3, 4, 5].map((i) => shift(addDays(monday, i), '08:00', '16:00'));
    const wk = (d: string) => calculateHours(sixDays(d), mx).otHours;
    expect(wk('2026-11-02')).toBe(0); // 48h, the limit in 2026
    expect(wk('2027-11-01')).toBe(2); // limit 46 from 2027
    expect(mexicoAnnualLeave('2020-01-01', '2026-02-01')).toBe(22);
    expect(mexicoAnnualLeave('2025-06-01', '2026-02-01')).toBe(0);
  });
});

describe('Brazil', () => {
  const br: WorkplaceHours = { sector: 'construction', country: 'BR', payCycle: 'monthly' };
  it('counts a night hour as 52 min 30 s and pays Sunday rest work double', () => {
    expect(calculateHours([shift('2026-11-03', '22:00', '05:00')], br).nightHours).toBe(8);
    expect(bands(br, [shift('2026-11-01', '08:00', '12:00')])['rest_day@2']).toBe(4);
  });
  it('makes the monthly salary due by the 5th business day', () => {
    expect(
      payDueDate(
        { country: 'BR', payCycle: 'monthly' },
        { start: '2026-10-01', end: '2026-10-31', payDate: '2026-11-05' }
      )
    ).toBe('2026-11-06');
    expect(
      payDueDate(
        { payCycle: 'monthly' },
        { start: '2026-10-01', end: '2026-10-31', payDate: '2026-11-01' }
      )
    ).toBe('2026-11-07');
  });
});

describe('Portugal', () => {
  const pt: WorkplaceHours = { sector: 'office', country: 'PT', payCycle: 'monthly' };
  it('pays the first overtime hour of a day +25% and later ones +37.5%, more after 100 hours a year', () => {
    expect(bands(pt, [shift('2026-11-03', '09:00', '20:00')])).toEqual({
      'overtime@1.25': 1,
      'overtime@1.375': 2,
    });
    // 34 days × 3h = 102h; the last day crosses 100.
    const many = Array.from({ length: 34 }, (_, i) =>
      shift(addDays('2026-01-05', i * 7), '09:00', '20:00')
    );
    const b = bands(pt, many, { start: '2026-08-24', end: '2026-08-24' });
    // The day's first hour is still under 100; the next two are past it.
    expect(b).toEqual({ 'overtime@1.25': 1, 'overtime@1.75': 2 });
  });
  it('gives 2 days per month in the year of hire, up to 20', () => {
    expect(portugalAnnualLeave('2026-03-01', '2026-08-01')).toBe(10);
    expect(portugalAnnualLeave('2025-03-01', '2026-08-01')).toBe(22);
  });
});

describe('United States', () => {
  it('pays 1.5× after 40 hours federally; California adds daily and double time', () => {
    const us: WorkplaceHours = {
      sector: 'construction',
      country: 'US',
      payCycle: 'weekly',
      payDay: 0,
    };
    expect(bands(us, week('2026-11-02', '08:00', '17:00'))).toEqual({ 'overtime@1.5': 5 });
    const ca = { ...us, region: 'CA' };
    expect(bands(ca, [shift('2026-11-03', '06:00', '19:00')])).toEqual({
      'overtime@1.5': 4,
      'overtime@2': 1,
    });
  });
  it('has no comp-off leave (not allowed for private employers)', () => {
    const b = leaveBalances([], '2026', undefined, { sector: 'office', country: 'US' }, 16);
    expect(b.map((x) => x.type)).toEqual(['earned', 'sick']);
  });
});

describe('India stays as it was', () => {
  it('pays overtime at twice the rate after 8 hours', () => {
    const b = bands({ sector: 'construction' }, [shift('2026-11-03', '09:00', '19:00')]);
    expect(b).toEqual({ 'overtime@2': 2 });
  });
});

describe('Japan: five days of annual leave must be taken', () => {
  it('applies only to people with 10 or more days, counting days taken', async () => {
    const { minLeaveTaken } = await import('../../src/shared/rules/leave.js');
    const jp: WorkplaceHours = { sector: 'office', country: 'JP' };
    const req = (days: number) => ({
      id: 'l',
      workplaceId: 'w',
      workerUid: 'u',
      workerName: 'n',
      type: 'earned' as const,
      from: '2026-05-01',
      to: '2026-05-02',
      days,
      reason: 'r',
      status: 'approved' as const,
      createdAt: '2026-04-01',
    });
    const b = leaveBalances([req(2)], '2026', undefined, jp, 0, {
      from: '2024-01-01',
      today: '2026-10-30',
    });
    expect(minLeaveTaken(jp, b)).toEqual({ required: 5, taken: 2 });
    const newcomer = leaveBalances([], '2026', undefined, jp, 0, {
      from: '2026-08-01',
      today: '2026-10-30',
    });
    expect(minLeaveTaken(jp, newcomer)).toBeNull();
    expect(minLeaveTaken({ sector: 'office', country: 'FR' }, b)).toBeNull();
  });
});
