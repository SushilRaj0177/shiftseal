import type { CountryPack } from './types.js';
import { byId, law, policy, serviceLength } from './helpers.js';

/** 带薪年休假 by cumulative working years (职工带薪年休假条例 第3条). */
export function chinaAnnualLeave(serviceFrom: string, today: string): number {
  const { years } = serviceLength(serviceFrom, today);
  if (years < 1) return 0;
  if (years < 10) return 5;
  if (years < 20) return 10;
  return 15;
}

export const CN: CountryPack = {
  id: 'CN',
  currency: 'CNY',
  phonePrefix: '+86',
  timezone: 'Asia/Shanghai',
  weeklyOff: [0, 6],
  pay: {
    cycles: ['monthly'],
    defaultCycle: {
      construction: 'monthly',
      campus: 'monthly',
      retail: 'monthly',
      office: 'monthly',
    },
    deadline: { kind: 'payDay' },
    deductions: ['pension', 'medical', 'unemployment', 'housing_fund', 'iit'],
    annual: [],
  },
  overtime: {
    daily: 8,
    weekly: 40,
    scope: 'week',
    bands: [{ upTo: null, multiplier: 1.5 }],
    restDay: { which: 'all', bands: [{ upTo: null, multiplier: 2 }] },
    holiday: [{ upTo: null, multiplier: 3 }],
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 'service', rule: 'leave.earned' },
      { type: 'sick', paid: true, rule: 'leave.sick' },
      { type: 'casual', paid: false, rule: 'leave.casual' },
      { type: 'comp_off', paid: true, rule: 'leave.comp_off' },
      { type: 'wfh', paid: true },
    ],
    annualByService: chinaAnnualLeave,
  },
  complaints: {
    handlersRequiredFrom: 1,
    presiding: false,
    external: [
      { key: 'hotline12333', url: 'https://www.12333.gov.cn' },
      { key: 'hotline12338', url: 'https://www.women.org.cn' },
    ],
  },
  limits: [
    { id: 'cnMonth', metric: 'overtime', window: 'month', cap: 36, rule: 'limit.cnMonth' },
    { id: 'cnDay', metric: 'overtime', window: 'day', cap: 3, rule: 'limit.cnDay' },
  ],
  students: { minors: { age: 18, rule: 'minor.hours' } },
  rules: byId(
    law(
      'minor.hours',
      18,
      'years',
      '《劳动法》第58、64、65条:未成年工(16–18岁)不得从事有毒有害和四级体力劳动强度的劳动,用人单位应定期为其体检'
    ),
    law('hours.daily', 8, 'hours/day', '《劳动法》第36条、《国务院关于职工工作时间的规定》第3条'),
    law('ot.weekly', 40, 'hours/week', '《国务院关于职工工作时间的规定》第3条: 每周40小时'),
    law('ot.multiplier', 1.5, 'x wage', '《劳动法》第44条(一): 延长工作时间 不低于150%'),
    law(
      'ot.restDay',
      2,
      'x wage',
      '《劳动法》第44条(二): 休息日工作又不能安排补休的 不低于200%',
      'If a day off in lieu (调休) is given instead, no premium is owed.'
    ),
    law('ot.holiday', 3, 'x wage', '《劳动法》第44条(三): 法定休假日工作 不低于300%'),
    law('rest.weeklyDays', 1, 'days/week', '《劳动法》第38条: 每周至少休息一日'),
    law(
      'pay.deadline',
      0,
      'days after pay day',
      '《工资支付暂行规定》第7条: 工资必须在约定的日期支付, 至少每月支付一次'
    ),
    law(
      'pay.monthlyHourlyBasis',
      174,
      'hours/month',
      '劳社部发〔2008〕3号: 月计薪天数21.75天 × 8小时'
    ),
    law(
      'leave.earned',
      5,
      'days/year, by working years',
      '《职工带薪年休假条例》第3条: 累计工作满1年不满10年5天, 满10年不满20年10天, 满20年15天'
    ),
    policy(
      'leave.sick',
      0,
      'days',
      '医疗期按《企业职工患病或非因工负伤医疗期规定》; 病假工资不低于当地最低工资的80%'
    ),
    policy('leave.casual', 0, 'days', '规章制度: 事假 (无薪)'),
    law('leave.comp_off', 0, 'days', '《劳动法》第44条(二): 休息日加班可安排补休 (调休)'),
    law(
      'complaints.handlers',
      1,
      'employees',
      '《妇女权益保障法》(2022) 第25条: 用人单位应当建立预防和处置性骚扰的制度及投诉处理机制; 《民法典》第1010条'
    ),
    law(
      'limit.cnMonth',
      36,
      'overtime hours/month',
      '《劳动法》第41条: 每月延长工作时间不得超过36小时'
    ),
    law(
      'limit.cnDay',
      3,
      'overtime hours/day',
      '《劳动法》第41条: 一般每日不得超过1小时, 特殊原因每日不得超过3小时'
    )
  ),
};
