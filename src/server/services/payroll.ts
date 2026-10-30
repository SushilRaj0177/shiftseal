import type {
  DeductionItem,
  OvertimeClaim,
  PayslipCalculationResult,
  ShiftRecord,
  WorkerProfile,
} from '../../shared/types.js';
import type { LeaveRequest, MemberRecord, WorkplaceRecord } from '../../shared/model.js';
import { calculateHours } from '../../shared/rules/hours.js';
import { calculatePayslip } from '../../shared/rules/pay.js';
import { unpaidTypes } from '../../shared/rules/leave.js';
import { countryPack } from '../../shared/countries/index.js';
import {
  addDays,
  daysInMonth,
  eachDay,
  isWithin,
  periodFor,
  weekdayOf,
  type PayPeriod,
} from '../../shared/time.js';
import type { HoursCalculationResult } from '../../shared/types.js';

export interface StoredDeduction extends DeductionItem {
  workerUid: string;
  periodStart: string;
  createdBy: string;
  createdAt: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function periodLabel(p: PayPeriod): string {
  const fmt = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
  return `${fmt(p.start)} – ${fmt(p.end)}`;
}

/** Days in the last 14 (after joining, Sundays excluded) with no shift at all. */
export function missedShifts14d(shifts: ShiftRecord[], today: string, joinedDate: string): number {
  const worked = new Set(shifts.map((s) => s.date));
  let missed = 0;
  for (let back = 1; back <= 14; back++) {
    const d = addDays(today, -back);
    if (d < joinedDate || weekdayOf(d) === 0) continue;
    if (!worked.has(d)) missed += 1;
  }
  return missed;
}

/** Overtime hours in each of the last three pay periods, oldest first. */
export function overtimeTrend(
  shifts: ShiftRecord[],
  wp: WorkplaceRecord,
  today: string
): [number, number, number] {
  const current = periodFor(wp, today);
  const prev = periodFor(wp, addDays(current.start, -1));
  const periods = [periodFor(wp, addDays(prev.start, -1)), prev, current];
  const ot = periods.map((p) => hoursForPeriod(shifts, wp, p).otHours);
  return [ot[0], ot[1], ot[2]];
}

/** The rules engine's worker shape, built from a membership record and real shift history. */
export function memberAsProfile(
  m: MemberRecord,
  wp: WorkplaceRecord,
  shifts: ShiftRecord[] = [],
  today?: string
): WorkerProfile {
  return {
    id: m.uid,
    name: m.name,
    nameTa: m.name,
    nameHi: m.name,
    workplaceId: wp.id,
    sector: wp.sector,
    country: wp.country,
    region: wp.region,
    role: m.title,
    roleTa: m.title,
    roleHi: m.title,
    team: m.team,
    hourlyRate: m.hourlyRate,
    dailyWage: m.dailyWage,
    preferredLanguage: m.language,
    missedShifts14d: today ? missedShifts14d(shifts, today, m.joinedAt.slice(0, 10)) : undefined,
    otTrend3Weeks: today ? overtimeTrend(shifts, wp, today) : undefined,
  };
}

export function approvedClaimHours(claims: OvertimeClaim[], period: PayPeriod): number {
  return claims
    .filter((c) => c.kind === 'overtime_claim' && isWithin(c.date, period.start, period.end))
    .filter((c) => c.resolutionStatus === 'approved')
    .reduce((sum, c) => sum + (c.supportedHours > 0 ? c.supportedHours : c.extraHours), 0);
}

/**
 * Hours for a pay period under the workplace's law. Earlier shifts in the same
 * year are passed as context, so weekly, monthly and yearly thresholds count
 * them without paying them again.
 */
export function hoursForPeriod(
  shifts: ShiftRecord[],
  wp: WorkplaceRecord,
  period: PayPeriod
): HoursCalculationResult {
  const from = period.start.slice(0, 4) + '-01-01';
  const context = shifts.filter((s) => s.date >= addDays(from, -7) && s.date <= period.end);
  return calculateHours(context, wp, period);
}

/** Approved unpaid leave days that fall inside a period (weekly offs excluded). */
export function unpaidLeaveDays(
  leave: LeaveRequest[],
  period: PayPeriod,
  weeklyOff: number[],
  unpaid: LeaveRequest['type'][] = ['unpaid']
): number {
  let days = 0;
  for (const r of leave) {
    if (r.status !== 'approved' || !unpaid.includes(r.type)) continue;
    const inside = eachDay(r.from, r.to).filter(
      (d) => isWithin(d, period.start, period.end) && !weeklyOff.includes(weekdayOf(d))
    ).length;
    days += r.halfDay ? Math.min(inside, 0.5) : inside;
  }
  return days;
}

export function payTypeOf(m: MemberRecord): 'hourly' | 'daily' | 'monthly' {
  return m.payType ?? (m.hourlyRate > 0 ? 'hourly' : 'daily');
}

export function weeklyOffOf(wp: WorkplaceRecord): number[] {
  return wp.weeklyOff ?? countryPack(wp).weeklyOff;
}

/** Share of a monthly salary paid in one period of the workplace's pay cycle. */
export function monthShareOf(wp: WorkplaceRecord): number {
  switch (wp.payCycle) {
    case 'semimonthly':
      return 0.5;
    case 'biweekly':
      return 12 / 26;
    case 'weekly':
      return 12 / 52;
    default:
      return 1;
  }
}

/**
 * The payslip for one pay period, or null when the employer has not set a
 * wage yet (we never guess someone's pay).
 */
export function payslipFor(
  member: MemberRecord,
  wp: WorkplaceRecord,
  shifts: ShiftRecord[],
  claims: OvertimeClaim[],
  deductions: StoredDeduction[],
  period: PayPeriod,
  leave: LeaveRequest[] = []
): PayslipCalculationResult | null {
  const type = payTypeOf(member);
  const salary = member.monthlySalary ?? 0;
  if (type === 'monthly' ? salary <= 0 : member.hourlyRate <= 0 && member.dailyWage <= 0)
    return null;
  const hoursResult = hoursForPeriod(shifts, wp, period);
  const recurring = (member.recurringDeductions ?? []).map((d, i) => ({
    id: `recurring-${i}`,
    type: d.type,
    amount: d.amount,
    reason: d.reason,
  }));
  const oneOff = deductions
    .filter((d) => d.workerUid === member.uid && d.periodStart === period.start)
    .map(({ id, type: t, amount, reason }) => ({ id, type: t, amount, reason }));
  const paidClaims = claims.filter((c) => c.compensation !== 'comp_off');
  return calculatePayslip({
    workerId: member.uid,
    weekLabel: periodLabel(period),
    workplace: wp,
    hourlyRate: type === 'hourly' ? member.hourlyRate : undefined,
    dailyWage: type === 'daily' ? member.dailyWage : undefined,
    monthlySalary: type === 'monthly' ? salary : undefined,
    monthShare: monthShareOf(wp),
    daysInPeriod:
      type === 'monthly'
        ? wp.payCycle === 'monthly' || !wp.payCycle
          ? daysInMonth(period.start)
          : eachDay(period.start, period.end).length
        : undefined,
    unpaidLeaveDays:
      type === 'monthly'
        ? unpaidLeaveDays(leave, period, weeklyOffOf(wp), unpaidTypes(wp))
        : undefined,
    overtimePaid: type === 'monthly' ? member.overtime === 'paid' : undefined,
    hoursResult,
    approvedClaimHours: approvedClaimHours(paidClaims, period),
    deductions: [...recurring, ...oneOff],
  });
}

/** Comp-off hours earned from approved extra-hours claims. */
export function compOffHours(claims: OvertimeClaim[]): number {
  return claims
    .filter((c) => c.compensation === 'comp_off' && c.resolutionStatus === 'approved')
    .reduce((n, c) => n + (c.supportedHours > 0 ? c.supportedHours : c.extraHours), 0);
}

/**
 * Yearly payments the country's law requires (aguinaldo, 13º salário,
 * subsídio de Natal, ...), with the next due date and, for salaried staff, a
 * rough amount from the monthly salary.
 */
export function annualPaymentsFor(wp: WorkplaceRecord, member: MemberRecord, today: string) {
  const salary = payTypeOf(member) === 'monthly' ? (member.monthlySalary ?? 0) : 0;
  return countryPack(wp).pay.annual.map((a) => {
    let due: string | null = null;
    if (a.due) {
      due = `${today.slice(0, 4)}-${a.due}`;
      if (due < today) due = `${Number(today.slice(0, 4)) + 1}-${a.due}`;
    }
    let estimate: number | null = null;
    if (salary > 0 && a.estimate) {
      estimate =
        'monthlySalary' in a.estimate
          ? salary * a.estimate.monthlySalary
          : (salary / 30) * a.estimate.days;
      estimate = Math.round(estimate);
    }
    return { code: a.code, due, estimate, rule: a.rule };
  });
}
