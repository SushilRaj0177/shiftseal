import { describe, it, expect } from 'vitest';
import { findOverlap, leaveBalances, leaveOn, workingDays } from '../../src/shared/rules/leave.js';
import { evaluateBurnout } from '../../src/shared/rules/burnout.js';
import { calculatePayslip } from '../../src/shared/rules/pay.js';
import { calculateWeekHours } from '../../src/shared/rules/hours.js';
import {
  assessCheck,
  assessComplaintCompliance,
  leaveRevoked,
} from '../../src/shared/rules/flags.js';
import { monthlyPeriodFor, periodFor, daysInMonth } from '../../src/shared/time.js';
import type { LeaveRequest } from '../../src/shared/model.js';
import type { ShiftRecord } from '../../src/shared/types.js';

const leave = (p: Partial<LeaveRequest>): LeaveRequest => ({
  id: 'l',
  workplaceId: 'wp',
  workerUid: 'u',
  workerName: 'A',
  type: 'casual',
  from: '2026-11-02',
  to: '2026-11-02',
  days: 1,
  reason: 'x',
  status: 'approved',
  createdAt: '2026-10-01T00:00:00Z',
  ...p,
});

const shift = (date: string, inT: string, outT: string): ShiftRecord => ({
  date,
  workerId: 'u',
  checkInEventId: `${date}i`,
  checkOutEventId: `${date}o`,
  checkInTime: inT,
  checkOutTime: outT,
  originalCheckInTime: inT,
  originalCheckOutTime: outT,
  zoneCode: 'GATE',
  source: 'qr',
  edits: [],
});

describe('monthly pay periods', () => {
  it('covers the calendar month and pays on a day of the next month', () => {
    expect(monthlyPeriodFor('2026-02-14', 1)).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
      payDate: '2026-03-01',
    });
    expect(
      periodFor({ payCycle: 'monthly', payDay: 6, payDayOfMonth: 5 }, '2026-12-31').payDate
    ).toBe('2027-01-05');
    expect(periodFor({ payDay: 6 }, '2026-10-27').start).toBe('2026-10-24');
    expect(daysInMonth('2028-02-10')).toBe(29);
  });
});

describe('leave', () => {
  it('counts working days, skipping weekly offs, and half days', () => {
    // Mon 2 Nov to Sun 8 Nov 2026, Sat and Sun off.
    expect(workingDays('2026-11-02', '2026-11-08', [0, 6])).toBe(5);
    expect(workingDays('2026-11-02', '2026-11-02', [0], true)).toBe(0.5);
    expect(workingDays('2026-11-08', '2026-11-08', [0])).toBe(0);
  });

  it('computes balances, including comp-off earned from extra hours', () => {
    const reqs = [
      leave({ days: 2 }),
      leave({ type: 'sick', days: 1, status: 'pending' }),
      leave({ type: 'casual', days: 3, status: 'rejected' }),
    ];
    const b = leaveBalances(reqs, '2026', undefined, { sector: 'office' }, 9);
    expect(b.find((x) => x.type === 'casual')).toMatchObject({
      entitled: 12,
      used: 2,
      available: 10,
    });
    expect(b.find((x) => x.type === 'sick')).toMatchObject({ pending: 1, available: 11 });
    // 9 extra hours at 8 h a day = one full day plus a half day.
    expect(b.find((x) => x.type === 'comp_off')!.entitled).toBe(1);
  });

  it('finds overlaps and the leave covering a day', () => {
    const reqs = [
      leave({ from: '2026-11-02', to: '2026-11-04' }),
      leave({ id: 'w', type: 'wfh', from: '2026-11-06', to: '2026-11-06' }),
    ];
    expect(findOverlap(reqs, '2026-11-04', '2026-11-05')?.from).toBe('2026-11-02');
    expect(findOverlap(reqs, '2026-11-05', '2026-11-05')).toBeUndefined();
    expect(leaveOn(reqs, '2026-11-06', ['wfh'])?.id).toBe('w');
    expect(leaveOn(reqs, '2026-11-03', ['wfh'])).toBeUndefined();
  });
});

describe('salaried payslips', () => {
  const hoursResult = calculateWeekHours([shift('2026-11-02', '09:00', '20:00')], 'office');

  it('pays the monthly salary less unpaid leave, with no overtime when exempt', () => {
    const slip = calculatePayslip({
      workerId: 'u',
      weekLabel: 'Nov',
      workplace: { sector: 'office' },
      monthlySalary: 30000,
      daysInPeriod: 30,
      unpaidLeaveDays: 2,
      overtimePaid: false,
      hoursResult,
      deductions: [{ id: 'pf', type: 'PF', amount: 1800, reason: 'Employee PF 12% of basic' }],
    });
    expect(slip.lines.map((l) => l.kind)).toEqual(['salary', 'unpaid_leave', 'deduction', 'net']);
    expect(slip.netPay).toBe(30000 - 2000 - 1800);
  });

  it('prices overtime from the monthly salary when overtime is paid', () => {
    const slip = calculatePayslip({
      workerId: 'u',
      weekLabel: 'Nov',
      workplace: { sector: 'office' },
      monthlySalary: 20800,
      daysInPeriod: 30,
      overtimePaid: true,
      hoursResult,
    });
    // 20800 / 208 h = 100 an hour; 3 h overtime at 2x.
    expect(slip.lines.find((l) => l.kind === 'overtime')!.amount).toBe(600);
  });
});

describe('office evidence', () => {
  it('does not flag a work-from-home check for being away from the office', () => {
    const r = assessCheck({
      eventId: 'e',
      workerUid: 'u',
      fence: { center: { lat: 13, lng: 80 }, radiusM: 100 },
      fix: { lat: 12.9, lng: 80.2, accuracyM: 20, at: '2026-11-02T04:00:00Z' },
      qr: 'none',
      qrValid: false,
      device: 'bound',
      signatureValid: true,
      integrity: 'unavailable',
      clientTime: '2026-11-02T04:00:00Z',
      serverTime: '2026-11-02T04:00:00Z',
      remote: true,
    });
    expect(r.flags).toEqual([]);
    expect(r.evidence.remote).toBe(true);
  });

  it('flags revoked leave and complaint-handling non-compliance, with counts only', () => {
    expect(leaveRevoked('l', 'u', 'Selvam', '2026-11-02', '2026-11-03', 'Busy').concerns).toBe(
      'employer'
    );
    expect(assessComplaintCompliance('wp', 12, 0, 10, 0).map((f) => f.code)).toEqual([
      'COMPLAINTS_NO_HANDLER',
    ]);
    expect(assessComplaintCompliance('wp', 8, 0, 10, 0)).toEqual([]);
    const overdue = assessComplaintCompliance('wp', 12, 3, 10, 2, 90);
    expect(overdue.map((f) => f.code)).toEqual(['COMPLAINT_OVERDUE']);
    expect(JSON.stringify(overdue)).not.toMatch(/respondent|description/i);
  });

  it('spots burnout from late nights, days off worked and no leave', () => {
    const shifts = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map((d) =>
      shift(d, '09:30', '22:15')
    );
    shifts.push(
      shift('2026-10-24', '10:00', '14:00'),
      shift('2026-10-25', '10:00', '14:00'),
      shift('2026-10-18', '10:00', '14:00')
    );
    const b = evaluateBurnout(shifts, [], '2026-10-27', [0, 6], { sector: 'office' }, '2026-06-01');
    expect(b.lateNights14d).toBe(4);
    expect(b.weeklyOffDaysWorked28d).toBe(3);
    expect(b.level).toBe('high');
    expect(b.reasons.join(' ')).toContain('no leave in');
    const rested = evaluateBurnout(
      [],
      [leave({ from: '2026-10-10', to: '2026-10-12' })],
      '2026-10-27',
      [0],
      { sector: 'office' },
      '2026-06-01'
    );
    expect(rested.level).toBe('low');
  });
});
