import type { LeaveRequest, LeaveType } from '../model.js';
import type { LeaveTypeConfig } from '../countries/types.js';
import { countryPack } from '../countries/index.js';
import { eachDay, weekdayOf } from '../time.js';
import { dailyHoursOf, type WorkplaceHours } from './hours.js';
import { findRule } from './index.js';

/** Leave types that are paid and come out of a yearly balance. */
export const BALANCE_TYPES = ['casual', 'sick', 'earned', 'comp_off'] as const;
export type BalanceType = (typeof BALANCE_TYPES)[number];

/** Working days between two dates, inclusive, skipping weekly offs. A half day counts 0.5. */
export function workingDays(
  from: string,
  to: string,
  weeklyOff: number[],
  halfDay = false
): number {
  if (to < from) return 0;
  const n = eachDay(from, to).filter((d) => !weeklyOff.includes(weekdayOf(d))).length;
  return halfDay && from === to && n === 1 ? 0.5 : n;
}

export function overlaps(
  a: { from: string; to: string },
  b: { from: string; to: string }
): boolean {
  return a.from <= b.to && b.from <= a.to;
}

const ACTIVE = new Set(['pending', 'approved']);

/** An existing pending or approved request that overlaps the new dates, if any. */
export function findOverlap(
  requests: LeaveRequest[],
  from: string,
  to: string
): LeaveRequest | undefined {
  return requests.find((r) => ACTIVE.has(r.status) && overlaps(r, { from, to }));
}

export interface LeaveBalance {
  type: BalanceType;
  entitled: number;
  used: number;
  pending: number;
  available: number;
  /** Whether the entitlement is set by law or by workplace policy. */
  kind?: 'law' | 'policy';
}

/** Leave types the workplace's country offers, with their settings. */
export function leaveTypes(where: WorkplaceHours): LeaveTypeConfig[] {
  return countryPack(where).leave.types;
}

/** Days a request uses: working days, or calendar days where the law counts those (Spain, Brazil). */
export function leaveDays(
  where: WorkplaceHours,
  type: LeaveType,
  from: string,
  to: string,
  weeklyOff: number[],
  halfDay = false
): number {
  const cfg = leaveTypes(where).find((t) => t.type === type);
  if (cfg?.calendarDays) return to < from ? 0 : eachDay(from, to).length;
  return workingDays(from, to, weeklyOff, halfDay);
}

/**
 * Balances for one calendar year, for the leave types that have a yearly
 * allowance in this country. The employer's policy can give more than the
 * law, never less. Comp-off is earned from approved extra hours (half a
 * working day per half day of extra hours), not granted yearly.
 */
export function leaveBalances(
  requests: LeaveRequest[],
  year: string,
  policy: { casual: number; sick: number; earned: number } | undefined,
  where: WorkplaceHours,
  compOffHoursEarned: number,
  service?: { from: string; today: string }
): LeaveBalance[] {
  const pack = countryPack(where);
  const dailyHours = dailyHoursOf(where);
  const inYear = requests.filter((r) => r.from.startsWith(year));
  const out: LeaveBalance[] = [];
  for (const cfg of pack.leave.types) {
    if (!(BALANCE_TYPES as readonly string[]).includes(cfg.type)) continue;
    const type = cfg.type as BalanceType;
    const rule = cfg.rule ? findRule(where, cfg.rule) : undefined;
    let entitled: number;
    if (type === 'comp_off') {
      entitled = Math.floor(compOffHoursEarned / (dailyHours / 2)) / 2;
    } else if (cfg.entitlement === 'service') {
      const legal =
        service && pack.leave.annualByService
          ? pack.leave.annualByService(service.from, service.today)
          : 0;
      entitled = Math.max(legal, policy?.[type as 'earned'] ?? 0);
    } else if (typeof cfg.entitlement === 'number') {
      const own = policy?.[type as 'casual' | 'sick' | 'earned'];
      entitled =
        rule?.kind === 'law' ? Math.max(cfg.entitlement, own ?? 0) : (own ?? cfg.entitlement);
    } else {
      // Taken as needed (with a certificate, for a family event, ...): no yearly allowance.
      continue;
    }
    const sum = (status: string) =>
      inYear.filter((r) => r.type === type && r.status === status).reduce((n, r) => n + r.days, 0);
    const used = sum('approved');
    const pending = sum('pending');
    out.push({
      type,
      entitled,
      used,
      pending,
      available: entitled - used - pending,
      kind: type === 'comp_off' ? undefined : rule?.kind,
    });
  }
  return out;
}

/** Leave types that do not pay salary in this country (unpaid leave, and e.g. sick days paid by social security). */
export function unpaidTypes(where: WorkplaceHours): LeaveType[] {
  return leaveTypes(where)
    .filter((t) => !t.paid)
    .map((t) => t.type);
}

/** Approved leave of a type covering a date, if any. */
export function leaveOn(
  requests: LeaveRequest[],
  date: string,
  types?: LeaveType[]
): LeaveRequest | undefined {
  return requests.find(
    (r) =>
      r.status === 'approved' &&
      r.from <= date &&
      date <= r.to &&
      (!types || types.includes(r.type))
  );
}

/**
 * Where the law makes the employer ensure some annual leave is actually
 * taken (Japan: 5 of the year's days), how much has been taken so far.
 */
export function minLeaveTaken(
  where: WorkplaceHours,
  balances: LeaveBalance[]
): { required: number; taken: number } | null {
  const rule = countryPack(where).leave.minTaken;
  const annual = balances.find((b) => b.type === 'earned');
  if (!rule || !annual || annual.entitled < rule.ifEntitledAtLeast) return null;
  return { required: rule.days, taken: annual.used };
}
