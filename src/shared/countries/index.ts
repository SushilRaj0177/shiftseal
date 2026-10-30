import type { CountryId, CountryPack, OvertimeModel } from './types.js';
import { addBusinessDays, addDays, type PayPeriod } from '../time.js';
import { IN } from './in.js';
import { JP } from './jp.js';
import { KR } from './kr.js';
import { CN } from './cn.js';
import { FR } from './fr.js';
import { DE } from './de.js';
import { ES } from './es.js';
import { MX } from './mx.js';
import { BR } from './br.js';
import { PT } from './pt.js';
import { GB } from './gb.js';
import { US } from './us.js';

export * from './types.js';

export const COUNTRIES: Record<CountryId, CountryPack> = {
  IN,
  JP,
  KR,
  CN,
  FR,
  DE,
  ES,
  MX,
  BR,
  PT,
  GB,
  US,
};

export function isCountry(v: unknown): v is CountryId {
  return typeof v === 'string' && v in COUNTRIES;
}

/** Where a workplace is: its country, and for the US its state. */
export interface Jurisdiction {
  country?: CountryId;
  region?: string;
}

const cache = new Map<string, CountryPack>();

/**
 * The pack for a workplace, with any state or region overrides applied.
 * Workplaces created before countries existed are in India.
 */
export function countryPack(where: Jurisdiction = {}): CountryPack {
  const id = where.country ?? 'IN';
  const key = `${id}:${where.region ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const base = COUNTRIES[id] ?? IN;
  const region = base.regions?.find((r) => r.id === where.region);
  const pack: CountryPack = region
    ? {
        ...base,
        timezone: region.timezone ?? base.timezone,
        overtime: { ...base.overtime, ...region.overtime },
        leave: { ...base.leave, ...region.leave },
        complaints: { ...base.complaints, ...region.complaints },
        limits: region.limits ? [...region.limits, ...base.limits] : base.limits,
        rules: { ...base.rules, ...region.rules },
      }
    : base;
  cache.set(key, pack);
  return pack;
}

/** Normal weekly hours on a date, for laws that step down over time. */
export function weeklyHoursOn(model: OvertimeModel, date: string): number {
  if (typeof model.weekly === 'number') return model.weekly;
  let hours = model.weekly[0].hours;
  for (const step of model.weekly) if (date >= step.from) hours = step.hours;
  return hours;
}

/** Leave types this country offers, with their settings. */
export function leaveTypesOf(where: Jurisdiction) {
  return countryPack(where).leave.types;
}

/** Whether extra hours may be given back as time off instead of pay. */
export function compOffAllowed(where: Jurisdiction): boolean {
  return countryPack(where).leave.types.some((t) => t.type === 'comp_off');
}

/**
 * The last day pay for a period may arrive without being late, under the
 * country's law: days or business days after the period, or the pay day.
 */
export function payDueDate(wp: Jurisdiction & { payCycle?: string }, period: PayPeriod): string {
  const deadline = countryPack(wp).pay.deadline;
  const monthly = wp.payCycle === 'monthly';
  if (deadline.kind === 'businessDaysAfterEnd' && monthly)
    return addBusinessDays(period.end, deadline.days);
  if (deadline.kind === 'daysAfterEnd' && monthly) return addDays(period.end, deadline.days);
  if (deadline.kind === 'daysAfterEnd' && deadline.days === 0) return period.end;
  return period.payDate;
}
