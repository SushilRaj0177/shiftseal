import type { CountryPack } from './types.js';
import { byId, law, policy } from './helpers.js';

/** Férias: 22 working days; in the year of hire, 2 per full month up to 20 (Código do Trabalho, arts. 238–239). */
export function portugalAnnualLeave(serviceFrom: string, today: string): number {
  if (serviceFrom.slice(0, 4) !== today.slice(0, 4)) return 22;
  const [, fm, fd] = serviceFrom.split('-').map(Number);
  const [, tm, td] = today.split('-').map(Number);
  const months = Math.max(0, tm - fm - (td < fd ? 1 : 0));
  return Math.min(20, months * 2);
}

export const PT: CountryPack = {
  id: 'PT',
  currency: 'EUR',
  phonePrefix: '+351',
  timezone: 'Europe/Lisbon',
  timezones: ['Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores'],
  weeklyOff: [0, 6],
  pay: {
    cycles: ['monthly'],
    defaultCycle: {
      construction: 'monthly',
      campus: 'monthly',
      retail: 'monthly',
      office: 'monthly',
    },
    deadline: { kind: 'daysAfterEnd', days: 0 },
    deductions: ['seguranca_social', 'irs', 'sindicato'],
    annual: [
      { code: 'subsidio_ferias', rule: 'annual.subsidioFerias', estimate: { monthlySalary: 1 } },
      {
        code: 'subsidio_natal',
        due: '12-15',
        rule: 'annual.subsidioNatal',
        estimate: { monthlySalary: 1 },
      },
    ],
  },
  overtime: {
    daily: 8,
    weekly: 40,
    scope: 'day',
    bands: [
      { upTo: 1, multiplier: 1.25 },
      { upTo: null, multiplier: 1.375 },
    ],
    escalation: {
      afterYearHours: 100,
      bands: [
        { upTo: 1, multiplier: 1.5 },
        { upTo: null, multiplier: 1.75 },
      ],
      restDayBands: [{ upTo: null, multiplier: 2 }],
    },
    restDay: { which: 'all', bands: [{ upTo: null, multiplier: 1.5 }] },
    holiday: [{ upTo: null, multiplier: 1.5 }],
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 'service', rule: 'leave.earned' },
      { type: 'sick', paid: false, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'comp_off', paid: true, rule: 'leave.comp_off' },
      { type: 'unpaid', paid: false, rule: 'leave.unpaid' },
      { type: 'wfh', paid: true, rule: 'leave.wfh' },
    ],
    annualByService: portugalAnnualLeave,
  },
  complaints: {
    handlersRequiredFrom: 7,
    presiding: false,
    external: [
      { key: 'act', url: 'https://portal.act.gov.pt' },
      { key: 'cite', url: 'https://cite.gov.pt' },
    ],
  },
  limits: [
    { id: 'ptYear', metric: 'overtime', window: 'year', cap: 150, rule: 'limit.ptYear' },
    { id: 'ptDay', metric: 'overtime', window: 'day', cap: 2, rule: 'limit.ptDay' },
  ],
  students: {
    minors: {
      age: 18,
      daily: 8,
      weekly: 40,
      night: { from: '22:00', to: '07:00' },
      under16: { night: { from: '20:00', to: '07:00' } },
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'minor.hours',
      8,
      'hours/day',
      'Código do Trabalho, arts. 73 e 76: menores até 8 h por dia e 40 h por semana; sem trabalho noturno (22h–7h; 20h–7h abaixo de 16 anos)'
    ),
    law('hours.daily', 8, 'hours/day', 'Código do Trabalho, art. 203.º, n.º 1: 8 horas por dia'),
    law(
      'ot.weekly',
      40,
      'hours/week',
      'Código do Trabalho, art. 203.º, n.º 1: 40 horas por semana'
    ),
    law(
      'ot.multiplier',
      1.25,
      'x retribuição horária',
      'Código do Trabalho, art. 268.º (Lei 13/2023): em dia útil, +25% na 1.ª hora e +37,5% nas seguintes; acima de 100 horas por ano, +50% e +75%'
    ),
    law(
      'ot.restDay',
      1.5,
      'x retribuição horária',
      'Código do Trabalho, art. 268.º: dia de descanso semanal ou feriado, +50% (+100% acima de 100 horas por ano)'
    ),
    law(
      'rest.minGapHours',
      11,
      'hours',
      'Código do Trabalho, art. 214.º: descanso diário de 11 horas'
    ),
    law('rest.weeklyDays', 1, 'days/week', 'Código do Trabalho, art. 232.º: descanso semanal'),
    law(
      'pay.deadline',
      0,
      'days after the period',
      'Código do Trabalho, art. 278.º, n.º 4: retribuição paga até ao último dia útil do período'
    ),
    law(
      'pay.monthlyHourlyBasis',
      173.33,
      'hours/month',
      'Código do Trabalho, art. 271.º: (retribuição mensal × 12) / (52 × 40)'
    ),
    law(
      'annual.subsidioFerias',
      1,
      'retribuição mensal',
      'Código do Trabalho, art. 264.º: subsídio de férias pago antes do início das férias'
    ),
    law(
      'annual.subsidioNatal',
      1,
      'retribuição mensal',
      'Código do Trabalho, art. 263.º: subsídio de Natal pago até 15 de dezembro'
    ),
    law(
      'leave.earned',
      22,
      'dias úteis/ano',
      'Código do Trabalho, arts. 238.º e 239.º: 22 dias úteis; no ano de admissão, 2 dias por mês até 20'
    ),
    law(
      'leave.sick',
      0,
      'days',
      'Decreto-Lei 28/2004: subsídio de doença pago pela Segurança Social a partir do 4.º dia'
    ),
    law('leave.casual', 0, 'days', 'Código do Trabalho, art. 249.º: faltas justificadas'),
    law(
      'leave.comp_off',
      0,
      'days',
      'Código do Trabalho, arts. 208.º-B e 229.º: banco de horas, descanso compensatório'
    ),
    law('leave.unpaid', 0, 'days', 'Código do Trabalho, art. 317.º: licença sem retribuição'),
    law('leave.wfh', 0, 'days', 'Código do Trabalho, art. 165.º e seguintes: teletrabalho'),
    law(
      'complaints.handlers',
      7,
      'employees',
      'Código do Trabalho, art. 127.º, n.º 1, al. k) e l): código de conduta contra o assédio e processo disciplinar (7 ou mais trabalhadores)'
    ),
    policy(
      'limit.ptYear',
      150,
      'overtime hours/year',
      'Código do Trabalho, art. 228.º, n.º 1, al. b): 150 horas por ano (175 em micro e pequenas empresas)'
    ),
    law(
      'limit.ptDay',
      2,
      'overtime hours/day',
      'Código do Trabalho, art. 228.º, n.º 1, al. d): 2 horas por dia útil'
    )
  ),
};
