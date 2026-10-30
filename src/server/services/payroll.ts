import type {
  DeductionItem,
  OvertimeClaim,
  PayslipCalculationResult,
  ShiftRecord,
  WorkerProfile,
} from '../../shared/types.js';
import type { MemberRecord, WorkplaceRecord } from '../../shared/model.js';
import { calculateWeekHours } from '../../shared/rules/hours.js';
import { calculatePayslip } from '../../shared/rules/pay.js';
import { addDays, isWithin, payPeriodFor, weekdayOf, type PayPeriod } from '../../shared/time.js';

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
  const current = payPeriodFor(today, wp.payDay);
  const periods = [2, 1, 0].map((n) => payPeriodFor(addDays(current.start, -7 * n), wp.payDay));
  const ot = periods.map(
    (p) =>
      calculateWeekHours(
        shifts.filter((s) => isWithin(s.date, p.start, p.end)),
        wp.sector
      ).otHours
  );
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
 * The payslip for one pay period, or null when the employer has not set a
 * wage yet (we never guess someone's pay).
 */
export function payslipFor(
  member: MemberRecord,
  wp: WorkplaceRecord,
  shifts: ShiftRecord[],
  claims: OvertimeClaim[],
  deductions: StoredDeduction[],
  period: PayPeriod
): PayslipCalculationResult | null {
  if (member.hourlyRate <= 0 && member.dailyWage <= 0) return null;
  const inPeriod = shifts.filter((s) => isWithin(s.date, period.start, period.end));
  const hoursResult = calculateWeekHours(inPeriod, wp.sector);
  return calculatePayslip({
    workerId: member.uid,
    weekLabel: periodLabel(period),
    sector: wp.sector,
    hourlyRate: member.hourlyRate > 0 ? member.hourlyRate : undefined,
    dailyWage: member.dailyWage > 0 ? member.dailyWage : undefined,
    hoursResult,
    approvedClaimHours: approvedClaimHours(claims, period),
    deductions: deductions
      .filter((d) => d.workerUid === member.uid && d.periodStart === period.start)
      .map(({ id, type, amount, reason }) => ({ id, type, amount, reason })),
  });
}
