import type { CountryPack } from './types.js';
import { byId, law, policy } from './helpers.js';

export const IN: CountryPack = {
  id: 'IN',
  currency: 'INR',
  phonePrefix: '+91',
  timezone: 'Asia/Kolkata',
  weeklyOff: [0],
  pay: {
    cycles: ['weekly', 'monthly'],
    defaultCycle: { construction: 'weekly', campus: 'weekly', retail: 'weekly', office: 'monthly' },
    deadline: { kind: 'daysAfterEnd', days: 7 },
    deductions: ['pf', 'esi', 'pt', 'tds', 'lwf'],
    annual: [{ code: 'bonus', due: '11-30', rule: 'annual.bonus' }],
  },
  overtime: {
    daily: 8,
    weekly: 48,
    scope: 'week',
    bands: [{ upTo: null, multiplier: 2 }],
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'casual', paid: true, entitlement: 12, rule: 'leave.casual' },
      { type: 'sick', paid: true, entitlement: 12, rule: 'leave.sick' },
      { type: 'earned', paid: true, entitlement: 15, rule: 'leave.earned' },
      { type: 'comp_off', paid: true },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true },
    ],
  },
  complaints: {
    handlersRequiredFrom: 10,
    presiding: true,
    inquiryDays: 90,
    outsideLimitDays: 90,
    external: [{ key: 'localCommittee', url: 'https://shebox.wcd.gov.in' }],
  },
  limits: [{ id: 'week', metric: 'total', window: 'week', cap: 48, rule: 'ot.weekly' }],
  students: { minors: { age: 18, rule: 'minor.hours' } },
  rules: byId(
    law(
      'minor.hours',
      18,
      'years',
      'Child and Adolescent Labour (Prohibition and Regulation) Act, 1986, s.3A: adolescents (14–18) may not work in hazardous occupations or processes'
    ),
    law(
      'hours.daily',
      8,
      'hours/day',
      'Occupational Safety, Health and Working Conditions Code, 2020, s.25: normal daily working hours',
      'Time beyond 8 hours in a day is overtime.'
    ),
    law(
      'ot.weekly',
      48,
      'hours/week',
      'Occupational Safety, Health and Working Conditions Code, 2020, s.25: normal weekly hours',
      'Time beyond 48 normal hours in a week is overtime.'
    ),
    law(
      'ot.multiplier',
      2,
      'x hourly rate',
      'OSH Code, 2020, s.27 and Code on Wages, 2019: overtime at twice the ordinary rate of wages'
    ),
    law('rest.weeklyDays', 1, 'days/week', 'OSH Code, 2020, s.26: a weekly day of rest'),
    law(
      'pay.deadline',
      7,
      'days after the wage period',
      'Code on Wages, 2019, s.17: monthly wages by the seventh day of the following month'
    ),
    policy(
      'pay.monthlyHourlyBasis',
      208,
      'hours/month',
      'Workplace policy: hourly equivalent of a monthly salary (26 days × 8 hours)'
    ),
    policy(
      'leave.casual',
      12,
      'days/year',
      'Workplace leave policy, within the applicable Shops and Establishments Act'
    ),
    policy(
      'leave.sick',
      12,
      'days/year',
      'Workplace leave policy, within the applicable Shops and Establishments Act'
    ),
    policy(
      'leave.earned',
      15,
      'days/year',
      'Workplace leave policy. Minimum by law: 1 day per 20 days worked after 180 days (OSH Code, 2020, s.32)'
    ),
    law(
      'annual.bonus',
      8.33,
      '% of yearly wages',
      'Code on Wages, 2019, Chapter IV (formerly Payment of Bonus Act, 1965): minimum bonus 8.33% for eligible employees, paid within 8 months of the financial year',
      'Applies to employees within the wage ceiling notified by the government.'
    ),
    law(
      'complaints.handlers',
      10,
      'employees',
      'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013, s.4: an Internal Committee where there are 10 or more employees',
      'Smaller workplaces are served by the district Local Committee.'
    ),
    law(
      'complaints.inquiry',
      90,
      'days',
      'POSH Act, 2013, s.11(4): inquiry to be completed within 90 days'
    ),
    law(
      'complaints.window',
      90,
      'days',
      'POSH Act, 2013, s.9(1): complaint within three months of the incident, extendable by three more'
    )
  ),
};
