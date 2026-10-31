import type { CountryPack } from './types.js';
import { byId, law, policy } from './helpers.js';

export const DE: CountryPack = {
  id: 'DE',
  currency: 'EUR',
  phonePrefix: '+49',
  timezone: 'Europe/Berlin',
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
    deductions: [
      'lohnsteuer',
      'soli',
      'kirchensteuer',
      'rentenversicherung',
      'krankenversicherung',
      'pflegeversicherung',
      'arbeitslosenversicherung',
    ],
    annual: [],
  },
  overtime: {
    daily: null,
    weekly: 40,
    scope: 'week',
    bands: [{ upTo: null, multiplier: 1 }],
    night: { start: '23:00', end: '06:00', premium: 0.25 },
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 20, rule: 'leave.earned' },
      { type: 'sick', paid: true, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'comp_off', paid: true },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true },
    ],
  },
  complaints: {
    handlersRequiredFrom: 1,
    presiding: false,
    outsideLimitDays: 60,
    external: [{ key: 'ads', url: 'https://www.antidiskriminierungsstelle.de' }],
  },
  limits: [
    { id: 'deDay', metric: 'total', window: 'day', cap: 10, rule: 'limit.deDay' },
    { id: 'deAvg', metric: 'total', window: 'avgWeeks', weeks: 24, cap: 48, rule: 'limit.deAvg' },
  ],
  students: {
    visa: { yearDays: { full: 140, halfMaxHours: 4 }, rule: 'student.visa' },
    minors: {
      age: 18,
      daily: 8,
      weekly: 40,
      night: { from: '20:00', to: '06:00' },
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'student.visa',
      140,
      'days/year',
      '§ 16b Abs. 3 AufenthG: 140 ganze oder 280 halbe Tage (bis 4 Stunden) im Kalenderjahr'
    ),
    law(
      'minor.hours',
      8,
      'hours/day',
      '§§ 8, 14 JArbSchG: höchstens 8 Stunden täglich und 40 wöchentlich, keine Arbeit zwischen 20 und 6 Uhr (ab 16 in Gaststätten bis 22 Uhr)'
    ),
    policy(
      'ot.weekly',
      40,
      'hours/week',
      'Arbeits- oder Tarifvertrag: vereinbarte Wochenarbeitszeit',
      'Stunden darüber sind Überstunden.'
    ),
    policy(
      'ot.multiplier',
      1,
      'x Stundenlohn',
      'Kein gesetzlicher Überstundenzuschlag; Arbeits- oder Tarifvertrag regeln Zuschlag oder Freizeitausgleich'
    ),
    law(
      'ot.night',
      0.25,
      'x Stundenlohn, Zuschlag',
      '§ 6 Abs. 5 ArbZG: angemessener Nachtzuschlag (23–6 Uhr) oder bezahlte freie Tage',
      'Nach der Rechtsprechung des BAG sind 25 % in der Regel angemessen.'
    ),
    law('rest.minGapHours', 11, 'hours', '§ 5 ArbZG: ununterbrochene Ruhezeit von 11 Stunden'),
    law('rest.weeklyDays', 1, 'days/week', '§ 9 ArbZG: Sonn- und Feiertagsruhe'),
    law(
      'pay.deadline',
      0,
      'days after pay day',
      '§ 614 BGB: Vergütung nach Ablauf des Zeitabschnitts; Fälligkeit laut Vertrag'
    ),
    policy('pay.monthlyHourlyBasis', 173.33, 'hours/month', 'Arbeitsvertrag: 40 Stunden × 13 / 3'),
    law(
      'leave.earned',
      20,
      'Arbeitstage/Jahr',
      '§ 3 BUrlG: mindestens 24 Werktage (20 Arbeitstage bei einer 5-Tage-Woche)',
      'Viele Verträge gewähren mehr; tragen Sie den vereinbarten Urlaub ein.'
    ),
    law(
      'leave.sick',
      0,
      'days',
      '§ 3 EntgFG: Entgeltfortzahlung bis zu 6 Wochen; § 5 EntgFG: Arbeitsunfähigkeitsbescheinigung ab dem 4. Tag'
    ),
    law(
      'leave.casual',
      0,
      'days',
      '§ 616 BGB: bezahlte Freistellung aus persönlichem Grund (Sonderurlaub)'
    ),
    law(
      'complaints.handlers',
      1,
      'employees',
      '§ 13 AGG: Beschwerdestelle im Betrieb; § 12 AGG: Schutzpflichten des Arbeitgebers'
    ),
    law(
      'complaints.window',
      60,
      'days',
      '§ 15 Abs. 4 AGG: Ansprüche innerhalb von 2 Monaten schriftlich geltend machen'
    ),
    law('limit.deDay', 10, 'hours/day', '§ 3 ArbZG: höchstens 10 Stunden am Tag'),
    law(
      'limit.deAvg',
      48,
      'hours/week over 24 weeks',
      '§ 3 ArbZG: im Durchschnitt 8 Stunden je Werktag (48 Stunden/Woche) innerhalb von 6 Monaten',
      'Arbeitszeit muss erfasst werden (BAG, 13.09.2022, 1 ABR 22/21).'
    )
  ),
};
