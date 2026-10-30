import type {
  ShiftRecord,
  SectorId,
  HoursCalculationResult,
  DayHoursBreakdown,
  PricedHours,
} from '../types.js';
import type { CountryId, Band, OvertimeModel } from '../countries/types.js';
import { countryPack, weeklyHoursOn } from '../countries/index.js';
import { addDays, isWithin, weekdayOf } from '../time.js';
import { findRule } from './index.js';

export function parseTimeMinutes(timeStr: string): number {
  // Accepts "HH:mm" or ISO string containing "THH:mm"
  const match = /(\d{1,2}):(\d{2})/.exec(timeStr);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export function roundHours(val: number): number {
  return Math.round(val * 100) / 100;
}

export function computeShiftDurationHours(
  checkInTime: string,
  checkOutTime: string
): { hours: number; crossesMidnight: boolean } {
  const inMin = parseTimeMinutes(checkInTime);
  const outMin = parseTimeMinutes(checkOutTime);
  let diffMin = outMin - inMin;
  let crossesMidnight = false;
  if (diffMin < 0) {
    diffMin += 24 * 60;
    crossesMidnight = true;
  }
  return {
    hours: roundHours(diffMin / 60),
    crossesMidnight,
  };
}

/** Minutes of a shift that fall inside a nightly window such as 22:00–05:00. */
export function nightMinutes(
  checkIn: string,
  checkOut: string,
  start: string,
  end: string
): number {
  const a = parseTimeMinutes(checkIn);
  let b = parseTimeMinutes(checkOut);
  if (b <= a) b += 1440;
  const s = parseTimeMinutes(start);
  let e = parseTimeMinutes(end);
  if (e <= s) e += 1440;
  let total = 0;
  // The window repeats daily: check the one starting the day before, the same day and the next.
  for (const shift of [-1440, 0, 1440]) {
    total += Math.max(0, Math.min(b, e + shift) - Math.max(a, s + shift));
  }
  return total;
}

/** Everything about a workplace that changes how hours are counted. */
export interface WorkplaceHours {
  sector: SectorId;
  country?: CountryId;
  region?: string;
  weeklyOff?: number[];
  payCycle?: string;
  payDay?: number;
  holidays?: string[];
  overtimeMultiplier?: number;
}

export interface HoursContext {
  model: OvertimeModel;
  weekStart: number;
  weeklyOff: number[];
  restDays: number[];
  holidays: string[];
  otFloor: number;
}

function asWorkplace(where: WorkplaceHours | SectorId): WorkplaceHours {
  return typeof where === 'string' ? { sector: where } : where;
}

export function hoursContext(where: WorkplaceHours | SectorId): HoursContext {
  const wp = asWorkplace(where);
  const pack = countryPack(wp);
  const model = pack.overtime;
  const weeklyOff = wp.weeklyOff ?? pack.weeklyOff;
  // The legal rest day: Sunday when it is a day off, otherwise the last day off.
  const legal = weeklyOff.includes(0) ? 0 : weeklyOff[weeklyOff.length - 1];
  let restDays: number[] = [];
  if (model.restDay)
    restDays = model.restDay.which === 'all' ? weeklyOff : legal === undefined ? [] : [legal];
  const weeklyCycle = wp.payCycle === undefined || wp.payCycle === 'weekly';
  return {
    model,
    // With weekly pay, the pay week is the workweek; otherwise the country's usual week.
    weekStart: weeklyCycle ? (wp.payDay ?? model.weekStart) : model.weekStart,
    weeklyOff,
    restDays,
    holidays: model.holiday ? (wp.holidays ?? []) : [],
    otFloor: wp.overtimeMultiplier ?? 0,
  };
}

interface PricedSplit {
  multiplier: number;
  hours: number;
}

/** Splits `hours` into bands, given how many hours of the band's scope are already counted. */
export function splitBands(hours: number, already: number, bands: Band[]): PricedSplit[] {
  const out: PricedSplit[] = [];
  let left = hours;
  let at = already;
  for (const band of bands) {
    if (left <= 0) break;
    const room = band.upTo === null ? left : Math.max(0, band.upTo - at);
    const take = Math.min(left, room);
    if (take > 0) {
      out.push({ multiplier: band.multiplier, hours: take });
      left -= take;
      at += take;
    }
  }
  if (left > 0) out.push({ multiplier: bands[bands.length - 1].multiplier, hours: left });
  return out;
}

function weekStartOf(date: string, weekStart: number): string {
  return addDays(date, -((weekdayOf(date) - weekStart + 7) % 7));
}

interface DayTotal {
  date: string;
  hours: number;
  nightMinutes: number;
  checkInTime: string;
  checkOutTime: string;
  crossesMidnight: boolean;
  refs: string[];
}

function dayTotals(shifts: ShiftRecord[], model: OvertimeModel): DayTotal[] {
  const byDate = new Map<string, DayTotal>();
  const done = shifts
    .filter((s) => Boolean(s.checkInTime && s.checkOutTime))
    .sort((a, b) => (a.date + a.checkInTime).localeCompare(b.date + b.checkInTime));
  for (const s of done) {
    const out = s.checkOutTime!;
    const { hours, crossesMidnight } = computeShiftDurationHours(s.checkInTime, out);
    const night = model.night
      ? nightMinutes(s.checkInTime, out, model.night.start, model.night.end)
      : 0;
    const refs = [s.checkInEventId, ...(s.checkOutEventId ? [s.checkOutEventId] : [])];
    const prev = byDate.get(s.date);
    if (prev) {
      prev.hours = roundHours(prev.hours + hours);
      prev.nightMinutes += night;
      prev.checkOutTime = out;
      prev.crossesMidnight ||= crossesMidnight;
      prev.refs.push(...refs);
    } else {
      byDate.set(s.date, {
        date: s.date,
        hours,
        nightMinutes: night,
        checkInTime: s.checkInTime,
        checkOutTime: out,
        crossesMidnight,
        refs,
      });
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Counts and prices hours under the workplace's law. Shifts outside `period`
 * still count towards weekly, monthly and yearly thresholds but are not paid
 * in this period; pass the year's shifts so those thresholds are right.
 */
export function calculateHours(
  shifts: ShiftRecord[],
  where: WorkplaceHours | SectorId,
  period?: { start: string; end: string }
): HoursCalculationResult {
  const wp = asWorkplace(where);
  const ctx = hoursContext(wp);
  const { model } = ctx;
  const paid = (d: string) => !period || isWithin(d, period.start, period.end);

  const perDay: DayHoursBreakdown[] = [];
  const priced: PricedHours[] = [];
  const weeks = new Map<string, { start: string; normalHours: number; totalHours: number }>();
  let normal = 0;
  let dailyOtSum = 0;
  let weeklyOtSum = 0;
  let nightHours = 0;
  let sundayHours = 0;

  let week = '';
  let weekNormal = 0;
  let weekOt = 0;
  let worked = new Set<string>();
  const monthOt = new Map<string, number>();
  const yearOt = new Map<string, number>();

  const price = (
    hours: number,
    kind: PricedHours['kind'],
    counter: number,
    bands: Band[],
    date: string
  ) => {
    if (hours <= 0 || !paid(date)) return;
    const esc = model.escalation;
    const parts: { hours: number; bands: Band[] }[] = [];
    if (esc && kind !== 'seventh_day') {
      const before = yearOt.get(date.slice(0, 4)) ?? 0;
      const escBands = kind === 'overtime' ? esc.bands : (esc.restDayBands ?? bands);
      const under = Math.max(0, Math.min(hours, esc.afterYearHours - before));
      parts.push({ hours: under, bands }, { hours: hours - under, bands: escBands });
    } else {
      parts.push({ hours, bands });
    }
    let at = counter;
    for (const part of parts) {
      for (const split of splitBands(part.hours, at, part.bands)) {
        const multiplier =
          kind === 'overtime' ? Math.max(split.multiplier, ctx.otFloor) : split.multiplier;
        priced.push({ kind, multiplier, hours: roundHours(split.hours), date });
      }
      at += part.hours;
    }
  };

  for (const d of dayTotals(shifts, model)) {
    const ws = weekStartOf(d.date, ctx.weekStart);
    if (ws !== week) {
      week = ws;
      weekNormal = 0;
      weekOt = 0;
      worked = new Set();
    }
    worked.add(d.date);
    const ym = d.date.slice(0, 7);
    const year = d.date.slice(0, 4);
    const weekday = weekdayOf(d.date);
    const h = d.hours;
    let dayNormal = 0;
    let dayDailyOt = 0;
    let dayWeeklyOt = 0;
    let special: PricedHours['kind'] | undefined;

    if (model.holiday && ctx.holidays.includes(d.date)) {
      special = 'holiday';
      price(h, 'holiday', 0, model.holiday, d.date);
    } else if (model.restDay && ctx.restDays.includes(weekday)) {
      special = 'rest_day';
      price(h, 'rest_day', 0, model.restDay.bands, d.date);
    } else if (model.seventhDay && worked.size === 7) {
      special = 'seventh_day';
      price(h, 'seventh_day', 0, model.seventhDay, d.date);
    } else {
      const weekly = weeklyHoursOn(model, d.date);
      dayDailyOt = model.daily === null ? 0 : roundHours(Math.max(0, h - model.daily));
      dayNormal = roundHours(h - dayDailyOt);
      weekNormal = roundHours(weekNormal + dayNormal);
      if (weekNormal > weekly) {
        dayWeeklyOt = roundHours(weekNormal - weekly);
        weekNormal = weekly;
        dayNormal = roundHours(dayNormal - dayWeeklyOt);
      }
      const ot = roundHours(dayDailyOt + dayWeeklyOt);
      if (ot > 0) {
        if (model.scope === 'day') {
          price(dayDailyOt, 'overtime', 0, model.bands, d.date);
          price(dayWeeklyOt, 'overtime', 0, [model.bands[0]], d.date);
        } else {
          const counter = model.scope === 'week' ? weekOt : (monthOt.get(ym) ?? 0);
          price(ot, 'overtime', counter, model.bands, d.date);
        }
        weekOt = roundHours(weekOt + ot);
        monthOt.set(ym, roundHours((monthOt.get(ym) ?? 0) + ot));
        yearOt.set(year, roundHours((yearOt.get(year) ?? 0) + ot));
      }
    }

    if (!paid(d.date)) continue;
    const night = model.night ? roundHours(d.nightMinutes / (model.night.hourMinutes ?? 60)) : 0;
    nightHours = roundHours(nightHours + night);
    if (model.sundayPremium && weekday === 0) sundayHours = roundHours(sundayHours + h);
    normal = roundHours(normal + dayNormal);
    dailyOtSum = roundHours(dailyOtSum + dayDailyOt);
    weeklyOtSum = roundHours(weeklyOtSum + dayWeeklyOt);
    const w = weeks.get(ws) ?? { start: ws, normalHours: 0, totalHours: 0 };
    w.normalHours = roundHours(w.normalHours + dayNormal);
    w.totalHours = roundHours(w.totalHours + h);
    weeks.set(ws, w);
    perDay.push({
      date: d.date,
      totalHours: h,
      normalHours: dayNormal,
      dailyOtHours: roundHours(dayDailyOt + dayWeeklyOt),
      special,
      nightHours: night || undefined,
      checkInTime: d.checkInTime,
      checkOutTime: d.checkOutTime,
      crossesMidnight: d.crossesMidnight,
      shiftRefs: d.refs,
    });
  }

  const sumOf = (k: PricedHours['kind']) =>
    roundHours(priced.filter((p) => p.kind === k).reduce((n, p) => n + p.hours, 0));
  return {
    normalHours: normal,
    otHours: roundHours(dailyOtSum + weeklyOtSum),
    dailyOtHours: dailyOtSum,
    weeklyExtraOtHours: weeklyOtSum,
    restDayHours: roundHours(sumOf('rest_day') + sumOf('seventh_day')),
    holidayHours: sumOf('holiday'),
    nightHours,
    sundayHours,
    totalHours: roundHours(perDay.reduce((n, d) => n + d.totalHours, 0)),
    priced,
    weeks: [...weeks.values()],
    perDay,
    ruleRefs: ['hours.daily', 'ot.weekly', 'ot.multiplier']
      .map((id) => findRule(wp, id))
      .filter((r) => r !== undefined),
  };
}

/** Hours for one week of shifts, all of them paid. */
export function calculateWeekHours(
  shifts: ShiftRecord[],
  where: WorkplaceHours | SectorId = 'construction'
): HoursCalculationResult {
  return calculateHours(shifts, where);
}

/** Normal hours in a working day, for turning a daily wage into an hourly rate. */
export function dailyHoursOf(where: WorkplaceHours | SectorId, date = '2026-01-01'): number {
  const model = countryPack(asWorkplace(where)).overtime;
  return model.daily ?? weeklyHoursOn(model, date) / 5;
}

/** Normal weekly hours for a workplace on a date. */
export function weeklyHoursOf(where: WorkplaceHours | SectorId, date: string): number {
  return weeklyHoursOn(countryPack(asWorkplace(where)).overtime, date);
}
