import type {
  HoursCalculationResult,
  DeductionItem,
  PayslipCalculationResult,
  PayslipLine,
  SectorId,
} from '../types.js';
import { getRule } from './index.js';

export function roundMoney(val: number): number {
  return Math.round(val * 100) / 100;
}

export interface CalculatePayslipInput {
  workerId: string;
  weekLabel: string;
  sector: SectorId;
  hourlyRate?: number;
  dailyWage?: number;
  hoursResult: HoursCalculationResult;
  approvedClaimHours?: number;
  approvedClaimRefs?: string[];
  deductions?: DeductionItem[];
}

export function calculatePayslip(input: CalculatePayslipInput): PayslipCalculationResult {
  const dailyRule = getRule(input.sector, 'hours.daily');
  const otMultiplierRule = getRule(input.sector, 'ot.multiplier');
  const deductionRule = getRule(input.sector, 'pay.deductionReasonRequired');

  const rate =
    input.hourlyRate !== undefined
      ? input.hourlyRate
      : roundMoney((input.dailyWage ?? 640) / dailyRule.value);

  const otRate = roundMoney(rate * otMultiplierRule.value);

  const allShiftRefs = input.hoursResult.perDay.flatMap((d) => d.shiftRefs);
  const otShiftRefs = input.hoursResult.perDay
    .filter((d) => d.dailyOtHours > 0)
    .flatMap((d) => d.shiftRefs);

  const normalAmount = roundMoney(input.hoursResult.normalHours * rate);
  const otAmount = roundMoney(input.hoursResult.otHours * otRate);
  const claimedHours = input.approvedClaimHours ?? 0;
  const claimedAmount = roundMoney(claimedHours * otRate);

  const lines: PayslipLine[] = [
    {
      id: 'line-normal',
      kind: 'normal',
      labelKey: 'Normal shift pay',
      hours: input.hoursResult.normalHours,
      rate,
      amount: normalAmount,
      ruleRef: dailyRule,
      shiftRefs: allShiftRefs,
    },
    {
      id: 'line-ot',
      kind: 'overtime',
      labelKey: 'Overtime pay (2x rate)',
      hours: input.hoursResult.otHours,
      rate: otRate,
      amount: otAmount,
      ruleRef: otMultiplierRule,
      shiftRefs: otShiftRefs.length > 0 ? otShiftRefs : allShiftRefs,
    },
  ];

  if (claimedHours > 0) {
    lines.push({
      id: 'line-claim-ot',
      kind: 'claim_overtime',
      labelKey: 'Approved overtime claim (2x rate)',
      hours: claimedHours,
      rate: otRate,
      amount: claimedAmount,
      ruleRef: otMultiplierRule,
      shiftRefs: input.approvedClaimRefs ?? [],
    });
  }

  let totalDeductions = 0;
  let flaggedDeductionsCount = 0;

  for (const ded of input.deductions ?? []) {
    const missingReason = !ded.reason || ded.reason.trim().length === 0;
    if (missingReason) {
      flaggedDeductionsCount += 1;
    }
    const dedAmount = roundMoney(Math.abs(ded.amount));
    totalDeductions = roundMoney(totalDeductions + dedAmount);

    lines.push({
      id: `line-ded-${ded.id}`,
      kind: 'deduction',
      labelKey: ded.reason && ded.reason.trim().length > 0 ? `${ded.type}: ${ded.reason}` : `${ded.type} (Unexplained deduction)`,
      amount: -dedAmount,
      flagged: missingReason,
      flagReason: missingReason
        ? 'Deduction lacks an explicit written reason as required by workplace policy.'
        : undefined,
      ruleRef: deductionRule,
      shiftRefs: [],
    });
  }

  const grossPay = roundMoney(normalAmount + otAmount + claimedAmount);
  const netPay = roundMoney(grossPay - totalDeductions);

  lines.push({
    id: 'line-net',
    kind: 'net',
    labelKey: 'Net payable wage',
    amount: netPay,
    shiftRefs: allShiftRefs,
  });

  return {
    workerId: input.workerId,
    weekLabel: input.weekLabel,
    hourlyRate: rate,
    normalHours: input.hoursResult.normalHours,
    otHours: input.hoursResult.otHours,
    claimedOtHours: claimedHours,
    grossPay,
    totalDeductions,
    netPay,
    flaggedDeductionsCount,
    lines,
  };
}
