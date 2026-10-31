import type { CountryPack } from './types.js';
import { byId, law, policy, serviceLength } from './helpers.js';

/** 年次有給休暇: 10 days after 6 months, then by years of service (労働基準法第39条). */
export function japanAnnualLeave(serviceFrom: string, today: string): number {
  const { months } = serviceLength(serviceFrom, today);
  if (months < 6) return 0;
  const steps: [number, number][] = [
    [78, 20],
    [66, 18],
    [54, 16],
    [42, 14],
    [30, 12],
    [18, 11],
    [6, 10],
  ];
  return steps.find(([m]) => months >= m)![1];
}

export const JP: CountryPack = {
  id: 'JP',
  currency: 'JPY',
  phonePrefix: '+81',
  timezone: 'Asia/Tokyo',
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
      'health_insurance',
      'pension',
      'employment_insurance',
      'care_insurance',
      'income_tax',
      'resident_tax',
    ],
    annual: [],
  },
  overtime: {
    daily: 8,
    weekly: 40,
    scope: 'month',
    bands: [
      { upTo: 60, multiplier: 1.25 },
      { upTo: null, multiplier: 1.5 },
    ],
    restDay: { which: 'legal', bands: [{ upTo: null, multiplier: 1.35 }] },
    night: { start: '22:00', end: '05:00', premium: 0.25 },
    weekStart: 0,
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
    annualByService: japanAnnualLeave,
    minTaken: { days: 5, ifEntitledAtLeast: 10, rule: 'leave.mustTake5' },
  },
  complaints: {
    handlersRequiredFrom: 1,
    presiding: false,
    external: [
      {
        key: 'soudanCorner',
        url: 'https://www.mhlw.go.jp/general/seido/chihou/kaiketu/soudan.html',
      },
      {
        key: 'kantokusho',
        url: 'https://www.mhlw.go.jp/kouseiroudoushou/shozaiannai/roudoukyoku/',
      },
    ],
  },
  limits: [
    { id: 'jpMonth', metric: 'overtime', window: 'month', cap: 45, rule: 'limit.jpMonth' },
    { id: 'jpYear', metric: 'overtime', window: 'year', cap: 360, rule: 'limit.jpYear' },
    {
      id: 'jpAbsolute',
      metric: 'overtimeAndRestDay',
      window: 'month',
      cap: 100,
      rule: 'limit.jpAbsolute',
    },
  ],
  students: {
    visa: { weekly: 28, breakWeekly: 40, breakDaily: 8, rule: 'student.visa' },
    minors: {
      age: 18,
      daily: 8,
      weekly: 40,
      night: { from: '22:00', to: '05:00' },
      noOvertime: true,
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'student.visa',
      28,
      'hours/week, all jobs combined',
      '出入国管理及び難民認定法 第19条第2項 (資格外活動許可): 週28時間以内、学則で定める長期休業中は1日8時間以内。すべての勤務先の合計'
    ),
    law(
      'minor.hours',
      8,
      'hours/day',
      '労働基準法 第60条・第61条: 18歳未満は1日8時間・週40時間、時間外・休日労働と深夜業 (22時〜5時) の禁止'
    ),
    law('hours.daily', 8, 'hours/day', '労働基準法 第32条第2項 (Labour Standards Act, Art. 32(2))'),
    law('ot.weekly', 40, 'hours/week', '労働基準法 第32条第1項 (Labour Standards Act, Art. 32(1))'),
    law(
      'ot.multiplier',
      1.25,
      'x hourly rate',
      '労働基準法 第37条第1項・割増賃金令 (Art. 37(1)): 時間外労働 25%以上',
      'Overtime beyond 60 hours in a month: 50% or more (Art. 37(1) proviso, all employers since April 2023).'
    ),
    law(
      'ot.restDay',
      1.35,
      'x hourly rate',
      '労働基準法 第37条第1項・割増賃金令: 法定休日労働 35%以上',
      'Applies to the legal weekly rest day. Work on other days off counts as ordinary overtime.'
    ),
    law(
      'ot.night',
      0.25,
      'x hourly rate, extra',
      '労働基準法 第37条第4項 (Art. 37(4)): 深夜労働 (22:00–5:00) 25%以上',
      'Added on top of any overtime or rest-day premium.'
    ),
    law('rest.weeklyDays', 1, 'days/week', '労働基準法 第35条 (Art. 35): 毎週少なくとも1回の休日'),
    policy(
      'rest.minGapHours',
      11,
      'hours',
      '労働時間等設定改善法 第2条 (勤務間インターバル: 努力義務)',
      'An effort obligation, not a hard limit.'
    ),
    law(
      'pay.deadline',
      0,
      'days after pay day',
      '労働基準法 第24条 (Art. 24): 賃金は毎月1回以上、一定の期日に支払う',
      'Pay later than the fixed pay day is late.'
    ),
    policy(
      'pay.monthlyHourlyBasis',
      173,
      'hours/month',
      '就業規則: 月平均所定労働時間 (年間所定労働時間 ÷ 12)',
      'Set this to your own average scheduled hours.'
    ),
    law(
      'leave.earned',
      10,
      'days/year, by service',
      '労働基準法 第39条 (Art. 39): 6か月継続勤務・8割以上出勤で10日、勤続に応じて最大20日',
      'Employers must make sure at least 5 days are taken each year (Art. 39(7)).'
    ),
    law(
      'leave.mustTake5',
      5,
      'days/year',
      '労働基準法 第39条第7項: 年10日以上の年休がある人に、年5日を時季を指定して取得させる義務 (違反は罰則あり)'
    ),
    policy('leave.casual', 0, 'days', '就業規則: 特別休暇 (慶弔休暇など)'),
    policy(
      'leave.sick',
      0,
      'days',
      '就業規則: 病気休暇 (法定の制度なし。4日目以降は健康保険の傷病手当金)'
    ),
    law(
      'leave.comp_off',
      0,
      'days',
      '労働基準法 第35条・第37条第3項: 振替休日・代休、代替休暇',
      'A substitute day off does not remove the premium already owed for legal rest-day work.'
    ),
    law(
      'complaints.handlers',
      1,
      'employees',
      '労働施策総合推進法 第30条の2 (パワハラ)・男女雇用機会均等法 第11条 (セクハラ): 相談窓口の設置 (2022年4月から全事業主)'
    ),
    law(
      'limit.jpMonth',
      45,
      'overtime hours/month',
      '労働基準法 第36条第4項: 36協定の限度時間 (月45時間)'
    ),
    law(
      'limit.jpYear',
      360,
      'overtime hours/year',
      '労働基準法 第36条第4項: 36協定の限度時間 (年360時間)'
    ),
    law(
      'limit.jpAbsolute',
      100,
      'hours/month incl. rest-day work',
      '労働基準法 第36条第6項第2号: 時間外・休日労働の合計は月100時間未満 (特別条項でも)'
    )
  ),
};
