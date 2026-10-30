import type { ShiftRecord } from '../types.js';
import type { LimitMeter } from '../countries/types.js';
import { countryPack } from '../countries/index.js';
import { addDays, weekdayOf } from '../time.js';
import { calculateHours, hoursContext, type WorkplaceHours } from './hours.js';
import { findRule } from './index.js';

export interface LimitReading {
  id: string;
  metric: LimitMeter['metric'];
  window: LimitMeter['window'];
  weeks?: number;
  cap: number;
  value: number;
  /** Start of the window the reading covers. */
  from: string;
  kind: 'law' | 'policy';
  source: string;
}

function windowStart(meter: LimitMeter, today: string, weekStart: number): string {
  switch (meter.window) {
    case 'day':
      return today;
    case 'week':
      return addDays(today, -((weekdayOf(today) - weekStart + 7) % 7));
    case 'month':
      return `${today.slice(0, 7)}-01`;
    case 'year':
      return `${today.slice(0, 4)}-01-01`;
    case 'avgWeeks':
      return addDays(today, -7 * (meter.weeks ?? 1) + 1);
  }
}

/**
 * Where a worker stands against each legal limit of the workplace's country
 * (Japan's 36 agreement caps, Korea's 52-hour week, the EU's 48-hour average,
 * and so on), up to and including `today`.
 */
export function limitReadings(
  shifts: ShiftRecord[],
  wp: WorkplaceHours,
  today: string
): LimitReading[] {
  const pack = countryPack(wp);
  const { weekStart } = hoursContext(wp);
  const context = shifts.filter((s) => s.date >= addDays(today, -400) && s.date <= today);
  return pack.limits.map((meter) => {
    const from = windowStart(meter, today, weekStart);
    const h = calculateHours(context, wp, { start: from, end: today });
    let value =
      meter.metric === 'total'
        ? h.totalHours
        : meter.metric === 'overtime'
          ? h.otHours
          : h.otHours + h.restDayHours + h.holidayHours;
    if (meter.window === 'avgWeeks') value = value / (meter.weeks ?? 1);
    const rule = findRule(wp, meter.rule);
    return {
      id: meter.id,
      metric: meter.metric,
      window: meter.window,
      weeks: meter.weeks,
      cap: meter.cap,
      value: Math.round(value * 100) / 100,
      from,
      kind: rule?.kind ?? 'law',
      source: rule?.source ?? '',
    };
  });
}
