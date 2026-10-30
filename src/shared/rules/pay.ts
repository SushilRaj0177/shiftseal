import type {
  HoursCalculationResult,
  DeductionItem,
  PayslipCalculationResult,
  PayslipLine,
  PricedHours,
  RuleDefinition,
} from '../types.js';
import { countryPack } from '../countries/index.js';
import { dailyHoursOf, type WorkplaceHours } from './hours.js';
import { findRule, getRule } from './index.js';

/** Digits after the decimal point for a currency (0 for yen and won). */
export function currencyDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function roundMoney(val: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(val * f) / f;
}

export interface CalculatePayslipInput {
  workerId: string;
  weekLabel: string;
  /** The workplace: its sector, country and agreed overtime rate. */
  workplace: WorkplaceHours;
  hourlyRate?: number;
  dailyWage?: number;
  hoursResult: HoursCalculationResult;
  approvedClaimHours?: number;
  approvedClaimRefs?: string[];
  deductions?: DeductionItem[];
  /** Salaried staff: the monthly salary, replacing hourly or daily wages. */
  monthlySalary?: number;
  /** Share of a month this pay period covers (1 for monthly, 0.5 for semimonthly). */
  monthShare?: number;
  /** Calendar days in the pay period, for pro-rating unpaid leave. */
  daysInPeriod?: number;
  /** Approved unpaid leave days in the period. */
  unpaidLeaveDays?: number;
  /** Salaried staff only: whether extra hours are paid. */
  overtimePaid?: boolean;
}

const RULE_FOR: Record<PricedHours['kind'], string> = {
  overtime: 'ot.multiplier',
  rest_day: 'ot.restDay',
  holiday: 'ot.holiday',
  seventh_day: 'ot.seventhDay',
};

const LABEL: Record<PricedHours['kind'], string> = {
  overtime: 'Overtime',
  rest_day: 'Rest-day work',
  holiday: 'Public holiday work',
  seventh_day: 'Seventh consecutive day',
};

export function calculatePayslip(input: CalculatePayslipInput): PayslipCalculationResult {
  const wp = input.workplace;
  const pack = countryPack(wp);
  const digits = currencyDigits(pack.currency);
  const money = (v: number) => roundMoney(v, digits);
  const rule = (id: string): RuleDefinition | undefined => findRule(wp, id);
  const otRule = getRule(wp, 'ot.multiplier');
  const deductionRule = rule('pay.deductionReasonRequired');
  const basisRule = getRule(wp, 'pay.monthlyHourlyBasis');

  const salaried = input.monthlySalary !== undefined;
  const rate = salaried
    ? roundMoney(input.monthlySalary! / basisRule.value, 4)
    : input.hourlyRate !== undefined
      ? input.hourlyRate
      : roundMoney((input.dailyWage ?? 0) / dailyHoursOf(wp), 4);
  const payExtra = !salaried || input.overtimePaid === true;
  const hr = input.hoursResult;
  const allShiftRefs = hr.perDay.flatMap((d) => d.shiftRefs);
  const refsFor = (dates: string[]) =>
    hr.perDay.filter((d) => dates.includes(d.date)).flatMap((d) => d.shiftRefs);

  const lines: PayslipLine[] = [];
  let gross = 0;

  if (salaried) {
    const share = input.monthShare ?? 1;
    const salary = money(input.monthlySalary! * share);
    const days = input.daysInPeriod ?? 30;
    const lopDays = input.unpaidLeaveDays ?? 0;
    const lopAmount = money((salary / days) * lopDays);
    lines.push({
      id: 'line-salary',
      kind: 'salary',
      labelKey: 'Monthly salary',
      amount: salary,
      shiftRefs: allShiftRefs,
    });
    gross += salary;
    if (lopDays > 0) {
      lines.push({
        id: 'line-unpaid-leave',
        kind: 'unpaid_leave',
        labelKey: `Unpaid leave (${lopDays} of ${days} days)`,
        hours: lopDays,
        rate: money(salary / days),
        amount: -lopAmount,
        shiftRefs: [],
      });
      gross -= lopAmount;
    }
  } else {
    const base = money(hr.normalHours * rate);
    lines.push({
      id: 'line-normal',
      kind: 'normal',
      labelKey: 'Normal hours',
      hours: hr.normalHours,
      rate,
      amount: base,
      ruleRef: rule('hours.daily') ?? rule('ot.weekly'),
      shiftRefs: allShiftRefs,
    });
    gross += base;
  }

  // Overtime and premium work, one line per kind and multiplier.
  if (payExtra) {
    const groups = new Map<
      string,
      { kind: PricedHours['kind']; multiplier: number; hours: number; dates: string[] }
    >();
    for (const p of hr.priced) {
      const key = `${p.kind}:${p.multiplier}`;
      const g = groups.get(key) ?? { kind: p.kind, multiplier: p.multiplier, hours: 0, dates: [] };
      g.hours = roundMoney(g.hours + p.hours);
      g.dates.push(p.date);
      groups.set(key, g);
    }
    for (const g of groups.values()) {
      const amount = money(g.hours * rate * g.multiplier);
      lines.push({
        id: `line-${g.kind}-${g.multiplier}`,
        kind: g.kind,
        labelKey: `${LABEL[g.kind]} (×${g.multiplier})`,
        hours: g.hours,
        rate: money(rate * g.multiplier),
        multiplier: g.multiplier,
        amount,
        ruleRef: rule(RULE_FOR[g.kind]) ?? otRule,
        shiftRefs: refsFor(g.dates),
      });
      gross += amount;
    }
  }

  // Night premium is owed even where overtime is not (it is about when, not how long).
  const night = pack.overtime.night;
  if (night && hr.nightHours > 0) {
    const amount = money(hr.nightHours * rate * night.premium);
    lines.push({
      id: 'line-night',
      kind: 'night',
      labelKey: `Night work premium (+${Math.round(night.premium * 100)}%)`,
      hours: hr.nightHours,
      rate: money(rate * night.premium),
      multiplier: night.premium,
      amount,
      ruleRef: rule('ot.night'),
      shiftRefs: hr.perDay.filter((d) => d.nightHours).flatMap((d) => d.shiftRefs),
    });
    gross += amount;
  }

  const sunday = pack.overtime.sundayPremium;
  if (sunday && hr.sundayHours > 0) {
    const amount = money(hr.sundayHours * rate * sunday);
    lines.push({
      id: 'line-sunday',
      kind: 'sunday',
      labelKey: `Sunday premium (+${Math.round(sunday * 100)}%)`,
      hours: hr.sundayHours,
      rate: money(rate * sunday),
      multiplier: sunday,
      amount,
      ruleRef: rule('ot.sunday'),
      shiftRefs: [],
    });
    gross += amount;
  }

  // Korea: a paid weekly rest day for hourly and daily workers who work 15+ hours a week.
  const restPay = pack.pay.weeklyRestPay;
  if (restPay && !salaried) {
    const qualifying = hr.weeks.filter((w) => w.normalHours >= restPay.minWeeklyHours);
    const hours = roundMoney(
      qualifying.reduce((n, w) => n + (Math.min(w.normalHours, 40) / 40) * 8, 0)
    );
    if (hours > 0) {
      const amount = money(hours * rate);
      lines.push({
        id: 'line-weekly-rest',
        kind: 'weekly_rest',
        labelKey: 'Paid weekly rest day',
        hours,
        rate,
        amount,
        ruleRef: rule('pay.weeklyRest'),
        shiftRefs: [],
      });
      gross += amount;
    }
  }

  const firstBand = Math.max(pack.overtime.bands[0].multiplier, wp.overtimeMultiplier ?? 0);
  const claimedHours = payExtra ? (input.approvedClaimHours ?? 0) : 0;
  if (claimedHours > 0) {
    const amount = money(claimedHours * rate * firstBand);
    lines.push({
      id: 'line-claim-ot',
      kind: 'claim_overtime',
      labelKey: 'Approved overtime claim',
      hours: claimedHours,
      rate: money(rate * firstBand),
      multiplier: firstBand,
      amount,
      ruleRef: otRule,
      shiftRefs: input.approvedClaimRefs ?? [],
    });
    gross += amount;
  }

  let totalDeductions = 0;
  let flaggedDeductionsCount = 0;
  for (const ded of input.deductions ?? []) {
    const missingReason = !ded.reason || ded.reason.trim().length === 0;
    if (missingReason) flaggedDeductionsCount += 1;
    const dedAmount = money(Math.abs(ded.amount));
    totalDeductions = money(totalDeductions + dedAmount);
    lines.push({
      id: `line-ded-${ded.id}`,
      kind: 'deduction',
      labelKey: missingReason
        ? `${ded.type} (Unexplained deduction)`
        : `${ded.type}: ${ded.reason}`,
      amount: -dedAmount,
      flagged: missingReason,
      flagReason: missingReason
        ? 'Deduction lacks an explicit written reason as required by workplace policy.'
        : undefined,
      ruleRef: deductionRule,
      shiftRefs: [],
    });
  }

  const grossPay = money(gross);
  const netPay = money(grossPay - totalDeductions);
  lines.push({
    id: 'line-net',
    kind: 'net',
    labelKey: 'Net pay',
    amount: netPay,
    shiftRefs: allShiftRefs,
  });

  return {
    workerId: input.workerId,
    weekLabel: input.weekLabel,
    hourlyRate: roundMoney(rate, Math.max(2, digits)),
    normalHours: hr.normalHours,
    otHours: payExtra ? hr.otHours : 0,
    claimedOtHours: claimedHours,
    currency: pack.currency,
    grossPay,
    totalDeductions,
    netPay,
    flaggedDeductionsCount,
    lines,
  };
}
