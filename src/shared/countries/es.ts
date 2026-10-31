import type { CountryPack } from './types.js';
import { byId, law, policy } from './helpers.js';

export const ES: CountryPack = {
  id: 'ES',
  currency: 'EUR',
  phonePrefix: '+34',
  timezone: 'Europe/Madrid',
  timezones: ['Europe/Madrid', 'Atlantic/Canary'],
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
    deductions: ['contingencias_comunes', 'desempleo', 'formacion_profesional', 'mei', 'irpf'],
    annual: [
      { code: 'paga_navidad', due: '12-22', rule: 'annual.pagas', estimate: { monthlySalary: 1 } },
      { code: 'paga_verano', due: '07-15', rule: 'annual.pagas', estimate: { monthlySalary: 1 } },
    ],
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
      { type: 'earned', paid: true, entitlement: 30, calendarDays: true, rule: 'leave.earned' },
      { type: 'sick', paid: true, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'comp_off', paid: true, rule: 'leave.comp_off' },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true, rule: 'leave.wfh' },
    ],
  },
  complaints: {
    handlersRequiredFrom: 1,
    presiding: false,
    external: [{ key: 'itss', url: 'https://www.mites.gob.es/itss/web/' }],
  },
  limits: [
    { id: 'esYear', metric: 'overtime', window: 'year', cap: 80, rule: 'limit.esYear' },
    { id: 'esDay', metric: 'total', window: 'day', cap: 9, rule: 'limit.esDay' },
  ],
  students: {
    visa: { weekly: 30, rule: 'student.visa' },
    minors: {
      age: 18,
      daily: 8,
      night: { from: '22:00', to: '06:00' },
      noOvertime: true,
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'student.visa',
      30,
      'hours/week',
      'Real Decreto 1155/2024 (Reglamento de Extranjería): la autorización de estancia por estudios permite trabajar hasta 30 horas semanales'
    ),
    law(
      'minor.hours',
      8,
      'hours/day',
      'Estatuto de los Trabajadores, arts. 6 y 34.3: máximo 8 horas diarias, sin horas extraordinarias ni trabajo nocturno'
    ),
    law(
      'ot.weekly',
      40,
      'hours/week',
      'Estatuto de los Trabajadores, art. 34.1: 40 horas semanales de promedio en cómputo anual',
      'El convenio colectivo puede fijar menos.'
    ),
    law(
      'ot.multiplier',
      1,
      'x hora ordinaria',
      'Estatuto de los Trabajadores, art. 35.1: la hora extraordinaria no puede pagarse por debajo de la ordinaria, o se compensa con descanso en 4 meses',
      'El convenio puede fijar un recargo.'
    ),
    law(
      'rest.minGapHours',
      12,
      'hours',
      'Estatuto de los Trabajadores, art. 34.3: 12 horas entre jornadas'
    ),
    law(
      'rest.weeklyDays',
      1.5,
      'days/week',
      'Estatuto de los Trabajadores, art. 37.1: día y medio de descanso semanal'
    ),
    law(
      'pay.deadline',
      0,
      'days after pay day',
      'Estatuto de los Trabajadores, art. 29.1: pago puntual en la fecha convenida, en periodos no superiores a un mes'
    ),
    policy(
      'pay.monthlyHourlyBasis',
      173.33,
      'hours/month',
      'Convenio colectivo: 40 horas × 52 / 12'
    ),
    law(
      'annual.pagas',
      2,
      'pagas/año',
      'Estatuto de los Trabajadores, art. 31: dos gratificaciones extraordinarias al año, una en Navidad',
      'El convenio fija la otra fecha y puede prorratearlas en 12 pagos.'
    ),
    law(
      'leave.earned',
      30,
      'días naturales/año',
      'Estatuto de los Trabajadores, art. 38.1: vacaciones de al menos 30 días naturales'
    ),
    law(
      'leave.sick',
      0,
      'days',
      'Ley General de la Seguridad Social, arts. 169–176: incapacidad temporal (baja médica)'
    ),
    law('leave.casual', 0, 'days', 'Estatuto de los Trabajadores, art. 37.3: permisos retribuidos'),
    law(
      'leave.comp_off',
      0,
      'days',
      'Estatuto de los Trabajadores, art. 35.1: compensación por descanso'
    ),
    law('leave.wfh', 0, 'days', 'Ley 10/2021, de trabajo a distancia'),
    law(
      'complaints.handlers',
      1,
      'employees',
      'Ley Orgánica 3/2007, art. 48, y Ley Orgánica 10/2022: protocolo frente al acoso sexual y por razón de sexo en todas las empresas'
    ),
    law(
      'record.required',
      1,
      'boolean',
      'Estatuto de los Trabajadores, art. 34.9 (Real Decreto-ley 8/2019): registro diario de jornada, conservado 4 años'
    ),
    law(
      'limit.esYear',
      80,
      'overtime hours/year',
      'Estatuto de los Trabajadores, art. 35.2: máximo 80 horas extraordinarias al año'
    ),
    law(
      'limit.esDay',
      9,
      'hours/day',
      'Estatuto de los Trabajadores, art. 34.3: máximo 9 horas ordinarias al día, salvo convenio'
    )
  ),
};
