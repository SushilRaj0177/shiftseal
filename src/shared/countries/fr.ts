import type { CountryPack } from './types.js';
import { byId, law, policy } from './helpers.js';

export const FR: CountryPack = {
  id: 'FR',
  currency: 'EUR',
  phonePrefix: '+33',
  timezone: 'Europe/Paris',
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
      'csg_crds',
      'social_security',
      'complementary_pension',
      'withholding_tax',
      'mutuelle',
    ],
    annual: [],
  },
  overtime: {
    daily: null,
    weekly: 35,
    scope: 'week',
    bands: [
      { upTo: 8, multiplier: 1.25 },
      { upTo: null, multiplier: 1.5 },
    ],
    weekStart: 1,
  },
  leave: {
    types: [
      { type: 'earned', paid: true, entitlement: 25, rule: 'leave.earned' },
      { type: 'sick', paid: true, rule: 'leave.sick' },
      { type: 'casual', paid: true, rule: 'leave.casual' },
      { type: 'comp_off', paid: true, rule: 'leave.comp_off' },
      { type: 'unpaid', paid: false },
      { type: 'wfh', paid: true, rule: 'leave.wfh' },
    ],
  },
  complaints: {
    handlersRequiredFrom: 11,
    presiding: false,
    external: [
      {
        key: 'inspection',
        url: 'https://code.travail.gouv.fr/contribution/comment-contacter-linspection-du-travail',
      },
      { key: 'defenseur', url: 'https://www.defenseurdesdroits.fr' },
    ],
  },
  limits: [
    { id: 'frWeek', metric: 'total', window: 'week', cap: 48, rule: 'limit.frWeek' },
    { id: 'frDay', metric: 'total', window: 'day', cap: 10, rule: 'limit.frDay' },
    { id: 'frAvg', metric: 'total', window: 'avgWeeks', weeks: 12, cap: 44, rule: 'limit.frAvg' },
    { id: 'frYear', metric: 'overtime', window: 'year', cap: 220, rule: 'limit.frYear' },
  ],
  students: {
    visa: { yearlyHours: 964, rule: 'student.visa' },
    minors: {
      age: 18,
      daily: 8,
      weekly: 35,
      night: { from: '22:00', to: '06:00' },
      under16: { night: { from: '20:00', to: '06:00' } },
      rule: 'minor.hours',
    },
  },
  rules: byId(
    law(
      'student.visa',
      964,
      'hours/year',
      'Code du travail, art. R5221-26 : 964 heures par an pour un titre de séjour « étudiant » (60 % de la durée légale)'
    ),
    law(
      'minor.hours',
      8,
      'hours/day',
      'Code du travail, art. L3162-1, L3163-1 et L3163-2 : 8 h par jour, 35 h par semaine, pas de travail de nuit (22 h–6 h ; 20 h–6 h avant 16 ans)'
    ),
    law(
      'ot.weekly',
      35,
      'hours/week',
      'Code du travail, art. L3121-27 : durée légale de 35 heures'
    ),
    law(
      'ot.multiplier',
      1.25,
      'x taux horaire',
      'Code du travail, art. L3121-36 : +25 % pour les 8 premières heures supplémentaires, +50 % au-delà',
      'Un accord collectif peut prévoir un autre taux, au moins 10 %.'
    ),
    law(
      'rest.minGapHours',
      11,
      'hours',
      'Code du travail, art. L3131-1 : repos quotidien de 11 heures'
    ),
    law(
      'rest.weeklyDays',
      1,
      'days/week',
      'Code du travail, art. L3132-2 : repos hebdomadaire de 35 heures consécutives'
    ),
    law(
      'pay.deadline',
      0,
      'days after pay day',
      'Code du travail, art. L3242-1 : salaire versé une fois par mois'
    ),
    law(
      'pay.monthlyHourlyBasis',
      151.67,
      'hours/month',
      'Code du travail, art. L3242-1 (mensualisation) : 35 h × 52 / 12'
    ),
    law(
      'leave.earned',
      25,
      'jours ouvrés/an',
      'Code du travail, art. L3141-3 : 2,5 jours ouvrables par mois (30 ouvrables, soit 25 jours ouvrés)'
    ),
    law(
      'leave.sick',
      0,
      'days',
      'Code de la sécurité sociale, art. L321-1 (indemnités journalières) ; Code du travail, art. L1226-1 (maintien de salaire)'
    ),
    law(
      'leave.casual',
      0,
      'days',
      'Code du travail, art. L3142-4 : congés pour événements familiaux'
    ),
    law(
      'leave.comp_off',
      0,
      'days',
      'Code du travail, art. L3121-30 et L3121-33 : repos compensateur, contrepartie obligatoire en repos'
    ),
    law('leave.wfh', 0, 'days', 'Code du travail, art. L1222-9 : télétravail'),
    law(
      'complaints.handlers',
      11,
      'employees',
      'Code du travail, art. L2314-1 : référent harcèlement sexuel désigné par le CSE (11 salariés et plus) ; art. L1153-5-1 : référent employeur (250 salariés et plus)'
    ),
    law(
      'limit.frDay',
      10,
      'hours/day',
      'Code du travail, art. L3121-18 : 10 heures par jour au maximum'
    ),
    law(
      'limit.frWeek',
      48,
      'hours/week',
      'Code du travail, art. L3121-20 : 48 heures par semaine au maximum'
    ),
    law(
      'limit.frAvg',
      44,
      'hours/week over 12 weeks',
      'Code du travail, art. L3121-22 : 44 heures en moyenne sur 12 semaines'
    ),
    policy(
      'limit.frYear',
      220,
      'overtime hours/year',
      'Code du travail, art. D3121-24 : contingent annuel de 220 heures, sauf accord collectif',
      'Au-delà, chaque heure ouvre droit à une contrepartie obligatoire en repos.'
    )
  ),
};
