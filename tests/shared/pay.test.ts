import { describe, it, expect } from 'vitest';
import { calculateWeekHours } from '../../src/shared/rules/hours.js';
import { calculatePayslip, roundMoney } from '../../src/shared/rules/pay.js';
import type { ShiftRecord } from '../../src/shared/types.js';

function makeShift(date: string, checkInTime: string, checkOutTime: string): ShiftRecord {
  return {
    date,
    workerId: 'w-murugan',
    checkInEventId: `in-${date}`,
    checkOutEventId: `out-${date}`,
    checkInTime,
    checkOutTime,
    originalCheckInTime: checkInTime,
    originalCheckOutTime: checkOutTime,
    zoneCode: 'TB-GATE',
    source: 'qr',
    edits: [],
  };
}

describe('pay.ts', () => {
  it('rounds money to paisa accurately', () => {
    expect(roundMoney(123.456)).toBe(123.46);
    expect(roundMoney(100)).toBe(100);
  });

  it('calculates overtime at 2x hourly rate', () => {
    const hoursResult = calculateWeekHours(
      [makeShift('2026-10-20', '09:00', '19:00')], // 8h normal + 2h OT
      'construction'
    );
    const slip = calculatePayslip({
      workerId: 'w-murugan',
      weekLabel: 'Test Week',
      workplace: { sector: 'construction' },
      hourlyRate: 100,
      hoursResult,
    });
    expect(slip.normalHours).toBe(8);
    expect(slip.otHours).toBe(2);
    expect(slip.grossPay).toBe(8 * 100 + 2 * 200);
    expect(slip.netPay).toBe(1200);
  });

  it('derives hourly rate from dailyWage / 8 when hourlyRate is omitted', () => {
    const hoursResult = calculateWeekHours([makeShift('2026-10-20', '09:00', '17:00')], 'campus');
    const slip = calculatePayslip({
      workerId: 'w-lakshmi',
      weekLabel: 'Test Week',
      workplace: { sector: 'campus' },
      dailyWage: 720,
      hoursResult,
    });
    expect(slip.hourlyRate).toBe(90);
    expect(slip.netPay).toBe(720);
  });

  it('includes approved claim overtime at 2x rate', () => {
    const hoursResult = calculateWeekHours(
      [makeShift('2026-10-20', '09:00', '17:00')],
      'construction'
    );
    const slip = calculatePayslip({
      workerId: 'w-murugan',
      weekLabel: 'Test Week',
      workplace: { sector: 'construction' },
      hourlyRate: 100,
      hoursResult,
      approvedClaimHours: 2.5,
      approvedClaimRefs: ['claim-1'],
    });
    const claimLine = slip.lines.find((l) => l.kind === 'claim_overtime');
    expect(claimLine).toBeDefined();
    expect(claimLine?.amount).toBe(500);
    expect(slip.grossPay).toBe(1300);
  });

  it('flags deductions without a written reason and leaves explained deductions unflagged', () => {
    const hoursResult = calculateWeekHours(
      [makeShift('2026-10-20', '09:00', '17:00')],
      'construction'
    );
    const slip = calculatePayslip({
      workerId: 'w-murugan',
      weekLabel: 'Test Week',
      workplace: { sector: 'construction' },
      hourlyRate: 100,
      hoursResult,
      deductions: [
        { id: 'd1', type: 'Canteen', amount: 120, reason: 'Weekly meals' },
        { id: 'd2', type: 'Equipment', amount: 200, reason: '   ' },
      ],
    });
    expect(slip.totalDeductions).toBe(320);
    expect(slip.flaggedDeductionsCount).toBe(1);
    const flagged = slip.lines.find((l) => l.id === 'line-ded-d2');
    expect(flagged?.flagged).toBe(true);
    expect(flagged?.flagReason).toBeTruthy();
    expect(flagged?.ruleRef?.kind).toBe('policy');
    const netLine = slip.lines.find((l) => l.kind === 'net');
    expect(netLine?.ruleRef).toBeUndefined();
  });
});
