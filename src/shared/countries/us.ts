import type { CountryPack } from './types.js';
import { byId, law, policy } from './helpers.js';

export const US: CountryPack = {
  id: 'US',
  currency: 'USD',
  phonePrefix: '+1',
  timezone: 'America/New_York',
  timezones: [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
  ],
  weeklyOff: [0, 6],
  pay: {
    cycles: ['weekly', 'biweekly', 'semimonthly', 'monthly'],
    defaultCycle: {
      construction: 'weekly',
      campus: 'biweekly',
      retail: 'biweekly',
      office: 'biweekly',
    },
    deadline: { kind: 'payDay' },
    deductions: [
      'federal_income_tax',
      'social_security',
      'medicare',
      'state_income_tax',
      'retirement_401k',
      'health_insurance',
    ],
    annual: [],
  },
  overtime: {
    daily: null,
    weekly: 40,
    scope: 'week',
    bands: [{ upTo: null, multiplier: 1.5 }],
    weekStart: 0,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 10, rule: 'leave.earned' },
      { type: 'sick', paid: true, entitlement: 5, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'unpaid', paid: false, rule: 'leave.unpaid' },
      { type: 'wfh', paid: true },
    ],
  },
  complaints: {
    handlersRequiredFrom: 15,
    presiding: false,
    outsideLimitDays: 180,
    external: [{ key: 'eeoc', url: 'https://www.eeoc.gov/filing-charge-discrimination' }],
  },
  limits: [{ id: 'usWeek', metric: 'total', window: 'week', cap: 40, rule: 'ot.weekly' }],
  students: {
    visa: { weekly: 20, breakWeekly: null, rule: 'student.visa' },
    minors: {
      age: 16,
      under16: { daily: 8, weekly: 18, weeklyBreak: 40, night: { from: '19:00', to: '07:00' } },
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'student.visa',
      20,
      'hours/week',
      '8 CFR 214.2(f)(9)(i): F-1 students may work on campus up to 20 hours a week while school is in session, full-time during breaks; off-campus work needs CPT or OPT'
    ),
    law(
      'minor.hours',
      18,
      'hours/school week',
      '29 CFR 570.35 (FLSA): under 16, at most 3 hours on a school day and 18 in a school week (8 and 40 when school is out), between 7 a.m. and 7 p.m. (9 p.m. from 1 June to Labor Day)'
    ),
    law(
      'ot.weekly',
      40,
      'hours/week',
      'Fair Labor Standards Act, 29 U.S.C. § 207(a): overtime after 40 hours in a workweek',
      'Applies to non-exempt employees.'
    ),
    law(
      'ot.multiplier',
      1.5,
      'x regular rate',
      'Fair Labor Standards Act, 29 U.S.C. § 207(a): one and one-half times the regular rate'
    ),
    policy('pay.deadline', 0, 'days after pay day', 'State wage payment law and your pay schedule'),
    policy('pay.monthlyHourlyBasis', 173.33, 'hours/month', 'Pay policy: 40 hours × 52 / 12'),
    policy(
      'leave.earned',
      10,
      'days/year',
      'Company policy: paid time off (no federal requirement)'
    ),
    policy('leave.sick', 5, 'days/year', 'Company policy, or your state’s paid sick leave law'),
    policy('leave.casual', 0, 'days', 'Company policy: personal days'),
    law(
      'leave.unpaid',
      0,
      'days',
      'Family and Medical Leave Act, 29 U.S.C. § 2612: up to 12 weeks unpaid, employers with 50+ employees'
    ),
    law(
      'complaints.handlers',
      15,
      'employees',
      'Title VII of the Civil Rights Act of 1964, 42 U.S.C. § 2000e: employers with 15 or more employees'
    ),
    law(
      'complaints.window',
      180,
      'days',
      '42 U.S.C. § 2000e-5(e)(1): charge with the EEOC within 180 days (300 where a state agency also covers it)'
    )
  ),
  regions: [
    {
      id: 'CA',
      name: 'California',
      timezone: 'America/Los_Angeles',
      overtime: {
        daily: 8,
        scope: 'day',
        bands: [
          { upTo: 4, multiplier: 1.5 },
          { upTo: null, multiplier: 2 },
        ],
        seventhDay: [
          { upTo: 8, multiplier: 1.5 },
          { upTo: null, multiplier: 2 },
        ],
      },
      leave: {
        types: [
          { type: 'earned', paid: true, entitlement: 10, rule: 'leave.earned' },
          { type: 'sick', paid: true, entitlement: 5, rule: 'leave.sick' },
          { type: 'casual', paid: true, rule: 'leave.casual' },
          { type: 'unpaid', paid: false, rule: 'leave.unpaid' },
          { type: 'wfh', paid: true },
        ],
      },
      complaints: {
        handlersRequiredFrom: 5,
        outsideLimitDays: 1095,
        external: [{ key: 'crd', url: 'https://calcivilrights.ca.gov/complaintprocess/' }],
      },
      limits: [{ id: 'caDay', metric: 'total', window: 'day', cap: 8, rule: 'hours.daily' }],
      rules: byId(
        law(
          'hours.daily',
          8,
          'hours/day',
          'California Labor Code § 510: overtime after 8 hours in a workday; double time after 12'
        ),
        law(
          'ot.seventhDay',
          1.5,
          'x regular rate',
          'California Labor Code § 510: seventh consecutive day in a workweek, 1.5× for the first 8 hours and 2× after'
        ),
        law(
          'leave.sick',
          5,
          'days/year',
          'California Labor Code § 246 (SB 616): at least 40 hours or 5 days of paid sick leave a year'
        ),
        law(
          'complaints.handlers',
          5,
          'employees',
          'California Government Code § 12940(j)–(k) and § 12950.1 (FEHA): prevent harassment; training at 5+ employees'
        ),
        law(
          'complaints.window',
          1095,
          'days',
          'California Government Code § 12960(e): complaint with the Civil Rights Department within 3 years'
        )
      ),
    },
    {
      id: 'NY',
      name: 'New York',
      timezone: 'America/New_York',
      leave: {
        types: [
          { type: 'earned', paid: true, entitlement: 10, rule: 'leave.earned' },
          { type: 'sick', paid: true, entitlement: 5, rule: 'leave.sick' },
          { type: 'casual', paid: true, rule: 'leave.casual' },
          { type: 'unpaid', paid: false, rule: 'leave.unpaid' },
          { type: 'wfh', paid: true },
        ],
      },
      complaints: {
        handlersRequiredFrom: 1,
        outsideLimitDays: 1095,
        external: [{ key: 'nydhr', url: 'https://dhr.ny.gov/complaint' }],
      },
      rules: byId(
        law(
          'ot.multiplier',
          1.5,
          'x regular rate',
          '12 NYCRR § 142-2.2: overtime at 1.5× the regular rate after 40 hours'
        ),
        law(
          'leave.sick',
          5,
          'days/year',
          'New York Labor Law § 196-b: 40 hours of paid sick leave (56 hours at 100+ employees)'
        ),
        law(
          'complaints.handlers',
          1,
          'employees',
          'New York Labor Law § 201-g: every employer must have a sexual harassment policy and complaint form'
        ),
        law(
          'complaints.window',
          1095,
          'days',
          'New York Executive Law § 297(5): complaint with the Division of Human Rights within 3 years'
        )
      ),
    },
  ],
};
