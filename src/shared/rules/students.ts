import type { ShiftRecord } from '../types.js';
import type { NightWindow, StudentRules } from '../countries/types.js';
import { countryPack } from '../countries/index.js';
import { addDays, weekdayOf } from '../time.js';
import {
  computeShiftDurationHours,
  nightMinutes,
  roundHours,
  type WorkplaceHours,
} from './hours.js';
import { findRule } from './index.js';
import type { LimitReading } from './limits.js';
import type { FlagDraft } from './flags.js';

/** What a person has told us about their studies and age; it travels with them across workplaces. */
export interface StudentProfile {
  /** `international`: studying on a student visa or residence permit. */
  student?: 'student' | 'international';
  /** Last day of an official school break, YYYY-MM-DD; caps for breaks apply until then. */
  breakUntil?: string;
  birthDate?: string;
}

export function ageOn(birthDate: string, date: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [y, m, d] = date.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

function hoursOf(s: ShiftRecord): number {
  return s.checkOutTime ? computeShiftDurationHours(s.checkInTime, s.checkOutTime).hours : 0;
}

/** Hours on each date, adding up every job. */
function hoursByDate(shifts: ShiftRecord[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of shifts) out.set(s.date, (out.get(s.date) ?? 0) + hoursOf(s));
  return out;
}

function sumHours(byDate: Map<string, number>, from: string, to: string, weekdaysOnly = false) {
  let total = 0;
  for (const [date, h] of byDate) {
    if (date < from || date > to) continue;
    const wd = weekdayOf(date);
    if (weekdaysOnly && (wd === 0 || wd === 6)) continue;
    total += h;
  }
  return roundHours(total);
}

function reading(
  wp: WorkplaceHours,
  id: string,
  rule: string,
  window: LimitReading['window'],
  from: string,
  value: number,
  cap: number
): LimitReading {
  const r = findRule(wp, rule);
  return {
    id,
    metric: 'total',
    window,
    weeks: window === 'avgWeeks' ? 1 : undefined,
    cap,
    value: roundHours(value),
    from,
    kind: r?.kind ?? 'law',
    source: r?.source ?? '',
  };
}

/** The under-18 rules that apply on `date`, tightened below 16. */
export function minorRules(rules: StudentRules | undefined, profile: StudentProfile, date: string) {
  const m = rules?.minors;
  if (!m || !profile.birthDate) return null;
  const age = ageOn(profile.birthDate, date);
  if (age >= m.age) return null;
  const onBreak = Boolean(profile.breakUntil && profile.breakUntil >= date);
  const young = age < 16 ? m.under16 : undefined;
  return {
    age,
    daily: young?.daily ?? m.daily,
    weekly: (onBreak ? young?.weeklyBreak : undefined) ?? young?.weekly ?? m.weekly,
    night: young?.night ?? m.night,
    noOvertime: m.noOvertime,
    rule: m.rule,
  };
}

/**
 * Where a student or young worker stands against their own limits, counting
 * every job they hold. `shifts` is everything they worked, at any workplace;
 * `wp` is the workplace whose country's law applies.
 */
export function studentReadings(
  profile: StudentProfile,
  shifts: ShiftRecord[],
  wp: WorkplaceHours,
  today: string
): LimitReading[] {
  const rules = countryPack(wp).students;
  if (!rules) return [];
  const byDate = hoursByDate(shifts);
  const out: LimitReading[] = [];
  const onBreak = Boolean(profile.breakUntil && profile.breakUntil >= today);
  const weekFrom = addDays(today, -6);
  const visa = rules.visa;

  if (profile.student === 'international' && visa) {
    const weekCap = onBreak && visa.breakWeekly !== undefined ? visa.breakWeekly : visa.weekly;
    if (weekCap != null) {
      out.push(
        reading(
          wp,
          'studentWeek',
          visa.rule,
          'avgWeeks',
          weekFrom,
          sumHours(byDate, weekFrom, today, visa.weekdaysOnly),
          weekCap
        )
      );
    }
    if (onBreak && visa.breakDaily) {
      out.push(
        reading(wp, 'studentDay', visa.rule, 'day', today, byDate.get(today) ?? 0, visa.breakDaily)
      );
    }
    const yearFrom = `${today.slice(0, 4)}-01-01`;
    if (visa.yearlyHours) {
      out.push(
        reading(
          wp,
          'studentYear',
          visa.rule,
          'year',
          yearFrom,
          sumHours(byDate, yearFrom, today),
          visa.yearlyHours
        )
      );
    }
    if (visa.yearDays) {
      let days = 0;
      for (const [date, h] of byDate) {
        if (date < yearFrom || date > today || h <= 0) continue;
        days += h <= visa.yearDays.halfMaxHours ? 0.5 : 1;
      }
      out.push(reading(wp, 'studentDays', visa.rule, 'year', yearFrom, days, visa.yearDays.full));
    }
  }

  const minor = minorRules(rules, profile, today);
  if (minor?.daily)
    out.push(
      reading(wp, 'minorDay', minor.rule, 'day', today, byDate.get(today) ?? 0, minor.daily)
    );
  if (minor?.weekly) {
    out.push(
      reading(
        wp,
        'minorWeek',
        minor.rule,
        'avgWeeks',
        weekFrom,
        sumHours(byDate, weekFrom, today),
        minor.weekly
      )
    );
  }
  return out;
}

/** Minutes of a shift inside the night window a young worker must not work in. */
export function minorNightMinutes(shift: ShiftRecord, night: NightWindow | undefined): number {
  if (!night || !shift.checkOutTime) return 0;
  return nightMinutes(shift.checkInTime, shift.checkOutTime, night.from, night.to);
}

/**
 * A check-out that takes a student past their visa cap, or a young worker past
 * their hours, is the employer's to answer: they set the rota.
 */
export function assessStudentLimits(workerUid: string, readings: LimitReading[]): FlagDraft[] {
  return readings
    .filter((r) => r.value > r.cap)
    .map((r) => ({
      code: r.id.startsWith('minor') ? ('MINOR_HOURS' as const) : ('STUDENT_LIMIT' as const),
      severity: 'serious' as const,
      concerns: 'employer' as const,
      subject: { kind: 'workplace' as const, id: `${workerUid}:${r.id}:${r.from}`, workerUid },
      message: `Over the ${r.id.startsWith('minor') ? 'young worker' : 'student visa'} limit: ${r.value} of ${r.cap} (${r.source}).`,
      facts: { value: r.value, cap: r.cap, limit: r.id },
    }));
}

/** A young worker kept on in the hours they must not work. */
export function assessMinorNight(
  workerUid: string,
  shift: ShiftRecord,
  profile: StudentProfile,
  wp: WorkplaceHours
): FlagDraft[] {
  const rules = minorRules(countryPack(wp).students, profile, shift.date);
  const minutes = minorNightMinutes(shift, rules?.night);
  if (!rules || minutes <= 0) return [];
  const r = findRule(wp, rules.rule);
  return [
    {
      code: 'MINOR_NIGHT',
      severity: 'serious',
      concerns: 'employer',
      subject: { kind: 'workplace', id: `${workerUid}:night:${shift.date}`, workerUid },
      message: `A worker aged ${rules.age} worked ${minutes} minutes between ${rules.night!.from} and ${rules.night!.to} (${r?.source ?? ''}).`,
      facts: { minutes, age: rules.age, from: rules.night!.from, to: rules.night!.to },
    },
  ];
}
