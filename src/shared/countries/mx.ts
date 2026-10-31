import type { CountryPack } from './types.js';
import { byId, law, policy, serviceLength } from './helpers.js';

/** Vacaciones by years of service (Ley Federal del Trabajo, art. 76, reformed 2023). */
export function mexicoAnnualLeave(serviceFrom: string, today: string): number {
  const { years } = serviceLength(serviceFrom, today);
  if (years < 1) return 0;
  if (years <= 5) return 10 + years * 2;
  return 20 + Math.ceil((years - 5) / 5) * 2;
}

export const MX: CountryPack = {
  id: 'MX',
  currency: 'MXN',
  phonePrefix: '+52',
  timezone: 'America/Mexico_City',
  timezones: [
    'America/Mexico_City',
    'America/Monterrey',
    'America/Merida',
    'America/Cancun',
    'America/Chihuahua',
    'America/Mazatlan',
    'America/Hermosillo',
    'America/Tijuana',
  ],
  weeklyOff: [0],
  pay: {
    cycles: ['weekly', 'semimonthly'],
    defaultCycle: {
      construction: 'weekly',
      campus: 'semimonthly',
      retail: 'semimonthly',
      office: 'semimonthly',
    },
    deadline: { kind: 'daysAfterEnd', days: 0 },
    deductions: ['isr', 'imss', 'infonavit', 'fonacot'],
    annual: [
      { code: 'aguinaldo', due: '12-20', rule: 'annual.aguinaldo', estimate: { days: 15 } },
      { code: 'ptu', due: '05-30', rule: 'annual.ptu' },
    ],
  },
  overtime: {
    daily: 8,
    weekly: [
      { from: '1970-01-01', hours: 48 },
      { from: '2027-01-01', hours: 46 },
      { from: '2028-01-01', hours: 44 },
      { from: '2029-01-01', hours: 42 },
      { from: '2030-01-01', hours: 40 },
    ],
    scope: 'week',
    bands: [
      { upTo: 9, multiplier: 2 },
      { upTo: null, multiplier: 3 },
    ],
    restDay: { which: 'legal', bands: [{ upTo: null, multiplier: 3 }] },
    holiday: [{ upTo: null, multiplier: 3 }],
    sundayPremium: 0.25,
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 'service', rule: 'leave.earned' },
      { type: 'sick', paid: false, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true, rule: 'leave.wfh' },
    ],
    annualByService: mexicoAnnualLeave,
  },
  complaints: {
    handlersRequiredFrom: 1,
    presiding: false,
    external: [
      { key: 'profedet', url: 'https://www.gob.mx/profedet' },
      { key: 'cfcrl', url: 'https://centrolaboral.gob.mx' },
    ],
  },
  limits: [
    { id: 'mxWeek', metric: 'overtime', window: 'week', cap: 9, rule: 'limit.mxWeek' },
    { id: 'mxDay', metric: 'overtime', window: 'day', cap: 3, rule: 'limit.mxDay' },
  ],
  students: { minors: { age: 18, noOvertime: true, under16: { daily: 6 }, rule: 'minor.hours' } },
  rules: byId(
    law(
      'minor.hours',
      6,
      'hours/day under 16',
      'Ley Federal del Trabajo, arts. 175, 177 y 178: menores de 18 años sin horas extraordinarias; menores de 16 años, máximo 6 horas diarias'
    ),
    law(
      'hours.daily',
      8,
      'hours/day',
      'Ley Federal del Trabajo, art. 61: jornada diurna de 8 horas'
    ),
    law(
      'ot.weekly',
      48,
      'hours/week',
      'Constitución, art. 123 A, fr. IV (reforma 2026): 48 horas en 2026, 46 en 2027, 44 en 2028, 42 en 2029 y 40 desde 2030',
      'La reducción no puede disminuir el salario.'
    ),
    law(
      'ot.multiplier',
      2,
      'x salario',
      'Ley Federal del Trabajo, art. 67: las primeras 9 horas extra a la semana se pagan dobles; art. 68: el excedente, triple'
    ),
    law(
      'ot.restDay',
      3,
      'x salario',
      'Ley Federal del Trabajo, art. 73: trabajar en el día de descanso se paga con salario doble además del ordinario'
    ),
    law(
      'ot.holiday',
      3,
      'x salario',
      'Ley Federal del Trabajo, art. 75: día de descanso obligatorio trabajado, salario doble adicional'
    ),
    law(
      'ot.sunday',
      0.25,
      'x salario, prima',
      'Ley Federal del Trabajo, art. 71: prima dominical de al menos 25 %'
    ),
    law(
      'rest.weeklyDays',
      1,
      'days/week',
      'Ley Federal del Trabajo, art. 69: un día de descanso por cada seis de trabajo'
    ),
    law(
      'pay.deadline',
      0,
      'days after the pay period',
      'Ley Federal del Trabajo, art. 88: pago cada semana (trabajo material) o cada 15 días como máximo'
    ),
    law(
      'pay.monthlyHourlyBasis',
      240,
      'hours/month',
      'Ley Federal del Trabajo, art. 89: salario diario = mensual / 30; jornada de 8 horas'
    ),
    law(
      'annual.aguinaldo',
      15,
      'días de salario',
      'Ley Federal del Trabajo, art. 87: aguinaldo de al menos 15 días de salario antes del 20 de diciembre'
    ),
    law(
      'annual.ptu',
      10,
      '% de la utilidad',
      'Ley Federal del Trabajo, arts. 117 y 122: reparto de utilidades (PTU) dentro de los 60 días siguientes a la declaración anual',
      'Para empresas, a más tardar el 30 de mayo.'
    ),
    law(
      'leave.earned',
      12,
      'días/año, por antigüedad',
      'Ley Federal del Trabajo, art. 76 (reforma 2023): 12 días el primer año, 2 más por año hasta 20, luego 2 más cada 5 años',
      'Con prima vacacional de al menos 25 % (art. 80).'
    ),
    law(
      'leave.sick',
      0,
      'days',
      'Ley del Seguro Social, art. 96: incapacidad pagada por el IMSS desde el cuarto día'
    ),
    policy('leave.casual', 0, 'days', 'Reglamento interior: permisos con goce de sueldo'),
    law(
      'leave.wfh',
      0,
      'days',
      'Ley Federal del Trabajo, art. 330-A: teletrabajo; NOM-037-STPS-2023'
    ),
    law(
      'complaints.handlers',
      1,
      'employees',
      'Ley Federal del Trabajo, art. 132, fr. XXXI: protocolo contra la violencia y el acoso; NOM-035-STPS-2018: mecanismo de quejas'
    ),
    law(
      'limit.mxWeek',
      9,
      'overtime hours/week',
      'Ley Federal del Trabajo, art. 66: no más de 3 horas al día ni 3 veces a la semana'
    ),
    law(
      'limit.mxDay',
      3,
      'overtime hours/day',
      'Ley Federal del Trabajo, art. 66: no más de 3 horas extra al día'
    )
  ),
};
