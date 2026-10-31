import type { CountryPack } from './types.js';
import { byId, law, policy, serviceLength } from './helpers.js';

/** 연차유급휴가: 1 a month in the first year, then 15 plus 1 every 2 years, up to 25 (근로기준법 제60조). */
export function koreaAnnualLeave(serviceFrom: string, today: string): number {
  const { months, years } = serviceLength(serviceFrom, today);
  if (years < 1) return Math.min(11, months);
  return Math.min(25, 15 + Math.floor((years - 1) / 2));
}

export const KR: CountryPack = {
  id: 'KR',
  currency: 'KRW',
  phonePrefix: '+82',
  timezone: 'Asia/Seoul',
  weeklyOff: [0, 6],
  pay: {
    cycles: ['monthly', 'weekly'],
    defaultCycle: {
      construction: 'monthly',
      campus: 'monthly',
      retail: 'monthly',
      office: 'monthly',
    },
    deadline: { kind: 'payDay' },
    deductions: [
      'national_pension',
      'health_insurance',
      'long_term_care',
      'employment_insurance',
      'income_tax',
      'local_income_tax',
    ],
    annual: [],
    weeklyRestPay: { minWeeklyHours: 15 },
  },
  overtime: {
    daily: 8,
    weekly: 40,
    scope: 'week',
    bands: [{ upTo: null, multiplier: 1.5 }],
    restDay: {
      which: 'legal',
      bands: [
        { upTo: 8, multiplier: 1.5 },
        { upTo: null, multiplier: 2 },
      ],
    },
    holiday: [
      { upTo: 8, multiplier: 1.5 },
      { upTo: null, multiplier: 2 },
    ],
    night: { start: '22:00', end: '06:00', premium: 0.5 },
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 'service', rule: 'leave.earned' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'sick', paid: false, rule: 'leave.sick' },
      { type: 'comp_off', paid: true, rule: 'leave.comp_off' },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true },
    ],
    annualByService: koreaAnnualLeave,
  },
  complaints: {
    handlersRequiredFrom: 5,
    presiding: false,
    external: [{ key: 'moel', url: 'https://minwon.moel.go.kr' }],
  },
  limits: [{ id: 'krWeek', metric: 'total', window: 'week', cap: 52, rule: 'limit.krWeek' }],
  students: {
    visa: { weekly: 25, weekdaysOnly: true, breakWeekly: null, rule: 'student.visa' },
    minors: {
      age: 18,
      daily: 7,
      weekly: 35,
      night: { from: '22:00', to: '06:00' },
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'student.visa',
      25,
      'weekday hours/week',
      '출입국관리법 제20조 및 시간제취업 허가 기준: 학부생 TOPIK 3급(3·4학년 4급) 이상 주중 25시간(미달 시 10시간, 대학원생 30시간), 주말·방학 제한 없음'
    ),
    law(
      'minor.hours',
      7,
      'hours/day',
      '근로기준법 제69조·제70조: 18세 미만 1일 7시간·주 35시간, 야간(22시~6시)·휴일근로는 본인 동의와 고용노동부 인가 필요'
    ),
    law('hours.daily', 8, 'hours/day', '근로기준법 제50조제2항 (Labor Standards Act, Art. 50(2))'),
    law('ot.weekly', 40, 'hours/week', '근로기준법 제50조제1항 (Art. 50(1))'),
    law(
      'ot.multiplier',
      1.5,
      'x ordinary wage',
      '근로기준법 제56조제1항 (Art. 56(1)): 연장근로 통상임금의 50% 이상 가산',
      'Premiums apply to workplaces with 5 or more employees (Art. 11).'
    ),
    law(
      'ot.restDay',
      1.5,
      'x ordinary wage',
      '근로기준법 제56조제2항 (Art. 56(2)): 휴일근로 8시간 이내 50%, 8시간 초과 100% 가산'
    ),
    law(
      'ot.night',
      0.5,
      'x ordinary wage, extra',
      '근로기준법 제56조제3항 (Art. 56(3)): 야간근로 (22:00–06:00) 50% 가산'
    ),
    law(
      'rest.weeklyDays',
      1,
      'paid day/week',
      '근로기준법 제55조 (Art. 55): 1주 소정근로일 개근 시 유급 주휴일'
    ),
    law(
      'pay.weeklyRest',
      15,
      'hours/week',
      '근로기준법 제55조·제18조제3항: 주 15시간 이상 근로자에게 주휴수당',
      'For hourly and daily paid workers: one day’s scheduled pay for each qualifying week.'
    ),
    law(
      'pay.deadline',
      0,
      'days after pay day',
      '근로기준법 제43조 (Art. 43): 임금은 매월 1회 이상 일정한 날짜에 지급'
    ),
    law(
      'pay.monthlyHourlyBasis',
      209,
      'hours/month',
      '고용노동부 통상임금 산정 기준: 월 소정근로시간 209시간 (주 40시간 + 주휴 8시간)'
    ),
    law(
      'leave.earned',
      15,
      'days/year, by service',
      '근로기준법 제60조 (Art. 60): 1년 80% 이상 출근 시 15일, 1년 미만은 매월 1일, 3년차부터 2년마다 1일 가산 (최대 25일)',
      'Applies to workplaces with 5 or more employees.'
    ),
    policy('leave.casual', 0, 'days', '취업규칙: 경조사 휴가'),
    policy('leave.sick', 0, 'days', '취업규칙: 병가 (법정 유급 병가 없음)'),
    law(
      'leave.comp_off',
      0,
      'days',
      '근로기준법 제57조 (Art. 57): 보상휴가제 (근로자대표와 서면 합의)'
    ),
    law(
      'complaints.handlers',
      5,
      'employees',
      '근로기준법 제76조의2·제76조의3 (직장 내 괴롭힘 신고 시 지체 없이 조사), 남녀고용평등법 제14조 (직장 내 성희롱)'
    ),
    law(
      'limit.krWeek',
      52,
      'hours/week',
      '근로기준법 제53조제1항 (Art. 53(1)): 1주 연장근로 12시간 한도 (주 52시간, 휴일 포함)'
    )
  ),
};
