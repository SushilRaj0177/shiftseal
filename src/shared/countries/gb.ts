import type { CountryPack } from './types.js';
import { byId, law, policy } from './helpers.js';

export const GB: CountryPack = {
  id: 'GB',
  currency: 'GBP',
  phonePrefix: '+44',
  timezone: 'Europe/London',
  weeklyOff: [0, 6],
  pay: {
    cycles: ['monthly', 'weekly', 'biweekly'],
    defaultCycle: {
      construction: 'weekly',
      campus: 'monthly',
      retail: 'monthly',
      office: 'monthly',
    },
    deadline: { kind: 'payDay' },
    deductions: ['paye', 'national_insurance', 'pension', 'student_loan'],
    annual: [],
  },
  overtime: {
    daily: null,
    weekly: 40,
    scope: 'week',
    bands: [{ upTo: null, multiplier: 1 }],
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 28, rule: 'leave.earned' },
      { type: 'sick', paid: true, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'comp_off', paid: true, rule: 'leave.comp_off' },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true },
    ],
  },
  complaints: {
    handlersRequiredFrom: 1,
    presiding: false,
    outsideLimitDays: 182,
    external: [
      { key: 'acas', url: 'https://www.acas.org.uk' },
      { key: 'eass', url: 'https://www.equalityadvisoryservice.com' },
    ],
  },
  limits: [
    { id: 'gbAvg', metric: 'total', window: 'avgWeeks', weeks: 17, cap: 48, rule: 'limit.gbAvg' },
  ],
  students: {
    visa: { weekly: 20, breakWeekly: null, rule: 'student.visa' },
    minors: {
      age: 18,
      daily: 8,
      weekly: 40,
      night: { from: '22:00', to: '06:00' },
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'student.visa',
      20,
      'hours/week',
      'Immigration Rules, Appendix Student: up to 20 hours a week in term time for degree-level study; full-time in official vacations'
    ),
    law(
      'minor.hours',
      8,
      'hours/day',
      'Working Time Regulations 1998, regs. 5A and 6A: young workers 8 hours a day, 40 a week, no work 22:00–06:00'
    ),
    policy('ot.weekly', 40, 'hours/week', 'Contract of employment: contracted weekly hours'),
    policy(
      'ot.multiplier',
      1,
      'x hourly rate',
      'No statutory overtime premium in the UK; the contract decides',
      'Average pay for all hours worked must not fall below the National Minimum Wage.'
    ),
    law(
      'rest.minGapHours',
      11,
      'hours',
      'Working Time Regulations 1998, reg. 10: 11 hours’ daily rest'
    ),
    law(
      'rest.weeklyDays',
      1,
      'days/week',
      'Working Time Regulations 1998, reg. 11: 24 hours’ weekly rest'
    ),
    law(
      'pay.deadline',
      0,
      'days after pay day',
      'Employment Rights Act 1996, s.8 and s.13: itemised payslip; pay on the contractual pay day'
    ),
    policy('pay.monthlyHourlyBasis', 173.33, 'hours/month', 'Contract: 40 hours × 52 / 12'),
    law(
      'leave.earned',
      28,
      'days/year',
      'Working Time Regulations 1998, regs. 13 and 13A: 5.6 weeks (28 days on a 5-day week), which may include bank holidays'
    ),
    law(
      'leave.sick',
      0,
      'days',
      'Social Security Contributions and Benefits Act 1992, as amended by the Employment Rights Act 2025: Statutory Sick Pay from the first day of sickness (from 6 April 2026)'
    ),
    policy('leave.casual', 0, 'days', 'Workplace policy: compassionate and special leave'),
    policy('leave.comp_off', 0, 'days', 'Workplace policy: time off in lieu (TOIL)'),
    law(
      'complaints.handlers',
      1,
      'employees',
      'Equality Act 2010, s.40A (Worker Protection Act 2023): duty to take reasonable steps to prevent sexual harassment; ACAS Code of Practice on grievances'
    ),
    law(
      'complaints.window',
      182,
      'days',
      'Employment Rights Act 2025, s.152 and Sch. 12: six months to start a tribunal claim, for acts from 1 October 2026 (ACAS early conciliation first)'
    ),
    law(
      'limit.gbAvg',
      48,
      'hours/week over 17 weeks',
      'Working Time Regulations 1998, reg. 4: average 48 hours a week over 17 weeks',
      'A worker may opt out in writing.'
    )
  ),
};
