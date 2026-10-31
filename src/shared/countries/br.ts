import type { CountryPack } from './types.js';
import { byId, law, serviceLength } from './helpers.js';

/** Férias: 30 days once each 12-month acquisition period is complete (CLT, art. 130). */
export function brazilAnnualLeave(serviceFrom: string, today: string): number {
  return serviceLength(serviceFrom, today).years >= 1 ? 30 : 0;
}

export const BR: CountryPack = {
  id: 'BR',
  currency: 'BRL',
  phonePrefix: '+55',
  timezone: 'America/Sao_Paulo',
  timezones: [
    'America/Sao_Paulo',
    'America/Bahia',
    'America/Fortaleza',
    'America/Recife',
    'America/Belem',
    'America/Manaus',
    'America/Cuiaba',
    'America/Porto_Velho',
    'America/Rio_Branco',
    'America/Noronha',
  ],
  weeklyOff: [0],
  pay: {
    cycles: ['monthly'],
    defaultCycle: {
      construction: 'monthly',
      campus: 'monthly',
      retail: 'monthly',
      office: 'monthly',
    },
    deadline: { kind: 'businessDaysAfterEnd', days: 5 },
    deductions: ['inss', 'irrf', 'vale_transporte', 'plano_saude', 'contribuicao_sindical'],
    annual: [
      {
        code: 'decimo_terceiro_1',
        due: '11-30',
        rule: 'annual.decimo',
        estimate: { monthlySalary: 0.5 },
      },
      {
        code: 'decimo_terceiro_2',
        due: '12-20',
        rule: 'annual.decimo',
        estimate: { monthlySalary: 0.5 },
      },
    ],
  },
  overtime: {
    daily: 8,
    weekly: 44,
    scope: 'week',
    bands: [{ upTo: null, multiplier: 1.5 }],
    restDay: { which: 'legal', bands: [{ upTo: null, multiplier: 2 }] },
    holiday: [{ upTo: null, multiplier: 2 }],
    night: { start: '22:00', end: '05:00', premium: 0.2, hourMinutes: 52.5 },
    weekStart: 0,
  },
  leave: {
    types: [
      {
        type: 'earned',
        paid: true,
        entitlement: 'service',
        calendarDays: true,
        rule: 'leave.earned',
      },
      { type: 'sick', paid: true, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'comp_off', paid: true, rule: 'leave.comp_off' },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true, rule: 'leave.wfh' },
    ],
    annualByService: brazilAnnualLeave,
  },
  complaints: {
    handlersRequiredFrom: 20,
    presiding: false,
    external: [
      { key: 'mpt', url: 'https://mpt.mp.br' },
      { key: 'mte', url: 'https://www.gov.br/trabalho-e-emprego/pt-br' },
    ],
  },
  limits: [
    { id: 'brDay', metric: 'overtime', window: 'day', cap: 2, rule: 'limit.brDay' },
    { id: 'brWeek', metric: 'total', window: 'week', cap: 44, rule: 'ot.weekly' },
  ],
  students: {
    minors: {
      age: 18,
      night: { from: '22:00', to: '05:00' },
      noOvertime: true,
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'minor.hours',
      18,
      'years',
      'CLT, arts. 404 e 413: menores de 18 anos não trabalham entre 22h e 5h nem fazem horas extras (salvo compensação)'
    ),
    law('hours.daily', 8, 'hours/day', 'Constituição Federal, art. 7º, XIII; CLT, art. 58'),
    law('ot.weekly', 44, 'hours/week', 'Constituição Federal, art. 7º, XIII: 44 horas semanais'),
    law(
      'ot.multiplier',
      1.5,
      'x hora normal',
      'Constituição Federal, art. 7º, XVI; CLT, art. 59, § 1º: hora extra com adicional de no mínimo 50%'
    ),
    law(
      'ot.restDay',
      2,
      'x hora normal',
      'Lei 605/1949, art. 9º; Súmula 146 do TST: trabalho no repouso semanal sem folga compensatória pago em dobro'
    ),
    law(
      'ot.holiday',
      2,
      'x hora normal',
      'Lei 605/1949, art. 9º: feriado trabalhado sem folga, pagamento em dobro'
    ),
    law(
      'ot.night',
      0.2,
      'x hora normal, adicional',
      'CLT, art. 73: adicional noturno de 20% (22h às 5h); hora noturna de 52 minutos e 30 segundos'
    ),
    law('rest.minGapHours', 11, 'hours', 'CLT, art. 66: 11 horas consecutivas entre jornadas'),
    law('rest.weeklyDays', 1, 'days/week', 'CLT, art. 67: descanso semanal remunerado de 24 horas'),
    law(
      'pay.deadline',
      5,
      'dias úteis após o mês',
      'CLT, art. 459, § 1º: salário pago até o 5º dia útil do mês seguinte'
    ),
    law(
      'pay.monthlyHourlyBasis',
      220,
      'hours/month',
      'CLT, art. 64, e jurisprudência do TST: divisor 220 para 44 horas semanais'
    ),
    law(
      'annual.decimo',
      1,
      'salário',
      'Lei 4.749/1965: 13º salário, 1ª parcela até 30 de novembro e 2ª até 20 de dezembro'
    ),
    law(
      'leave.earned',
      30,
      'dias corridos/ano',
      'CLT, arts. 129–130: 30 dias de férias a cada 12 meses de trabalho',
      'Com o terço constitucional (Constituição Federal, art. 7º, XVII).'
    ),
    law(
      'leave.sick',
      0,
      'days',
      'Lei 8.213/1991, art. 60, § 3º: os primeiros 15 dias de afastamento são pagos pela empresa'
    ),
    law('leave.casual', 0, 'days', 'CLT, art. 473: faltas justificadas'),
    law('leave.comp_off', 0, 'days', 'CLT, art. 59, §§ 2º e 5º: banco de horas'),
    law('leave.wfh', 0, 'days', 'CLT, art. 75-A e seguintes: teletrabalho'),
    law(
      'complaints.handlers',
      20,
      'employees',
      'Lei 14.457/2022, art. 23: empresas obrigadas a ter CIPA (NR-5) devem manter canal de denúncias de assédio',
      'A obrigação depende do dimensionamento da CIPA pela NR-5.'
    ),
    law(
      'record.required',
      20,
      'employees',
      'CLT, art. 74, § 2º; Portaria MTP 671/2021: registro de ponto obrigatório para mais de 20 empregados'
    ),
    law('limit.brDay', 2, 'overtime hours/day', 'CLT, art. 59: no máximo 2 horas extras por dia')
  ),
};
