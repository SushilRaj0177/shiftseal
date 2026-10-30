import type { LeaveRequest, LeaveType } from '../model.js';
import type { SectorId } from '../types.js';
import { eachDay, weekdayOf } from '../time.js';
import { getRule } from './index.js';

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
}

/**
 * Balances for one calendar year. Comp-off is earned from approved extra
 * hours (half a working day per half day of extra hours), not a yearly grant.
 */
export function leaveBalances(
  requests: LeaveRequest[],
  year: string,
  policy: { casual: number; sick: number; earned: number } | undefined,
  sector: SectorId,
  compOffHoursEarned: number
): LeaveBalance[] {
  const dailyHours = getRule(sector, 'hours.daily').value;
  const entitlement: Record<BalanceType, number> = {
    casual: policy?.casual ?? getRule(sector, 'leave.casual').value,
    sick: policy?.sick ?? getRule(sector, 'leave.sick').value,
    earned: policy?.earned ?? getRule(sector, 'leave.earned').value,
    comp_off: Math.floor(compOffHoursEarned / (dailyHours / 2)) / 2,
  };
  const inYear = requests.filter((r) => r.from.startsWith(year));
  return BALANCE_TYPES.map((type) => {
    const sum = (status: string) =>
      inYear.filter((r) => r.type === type && r.status === status).reduce((n, r) => n + r.days, 0);
    const used = sum('approved');
    const pending = sum('pending');
    return {
      type,
      entitled: entitlement[type],
      used,
      pending,
      available: entitlement[type] - used - pending,
    };
  });
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
