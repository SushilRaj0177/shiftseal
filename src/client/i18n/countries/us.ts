import type { CountryStrings } from '../country.js';

/** United States: PTO, paid sick leave, FLSA overtime, Title VII and the EEOC (plus California and New York). */
export const US_TEXT: CountryStrings = {
  en: {
    recordBroken:
      'This record does not match. Show this screen to the Department of Labor’s Wage and Hour Division, your state labor department or your union.',
    leaveBody:
      'Request PTO, sick time or a work-from-home day. Every decision is sealed into your record.',
    balanceCasual: 'Personal',
    balanceSick: 'Sick time',
    balanceEarned: 'PTO',
    balanceCompOff: 'Comp time',
    typeCasual: 'Personal day',
    typeSick: 'Paid sick time',
    typeEarned: 'Paid time off (PTO)',
    typeCompOff: 'Comp time',
    typeUnpaid: 'Unpaid leave (FMLA)',
    typeWfh: 'Work from home',
    compOffNote:
      'Private employers must pay overtime to non-exempt employees; it cannot be swapped for comp time.',
    leaveLawNote:
      'There is no federal paid vacation; PTO is company policy. Many states require paid sick time (California: at least 40 hours or 5 days). FMLA gives up to 12 weeks unpaid at employers with 50+ employees.',
    complaintEntry: 'Report harassment',
    complaintEntrySub:
      'Sexual harassment or discrimination. Only the people named to receive reports see it.',
    complaintTitle: 'Confidential report',
    complaintBody:
      'This goes only to the people your employer has named to receive harassment reports, not to your manager or the owner. You can exclude people. Retaliation for reporting is illegal.',
    committeeLabel: 'Harassment reporting contacts',
    presiding: 'lead',
    noCommittee:
      'Your employer has not named anyone yet. You can still send this, and the owner will be told a reporting path is expected. You can also file a charge with the EEOC or your state agency.',
    excludeLabel: 'Contacts who must not see this',
    lawNote:
      'A charge with the EEOC is generally due within 180 days of the incident (300 days in many states). California and New York allow 3 years with their state agencies.',
    committeeInbox: 'Reports received',
    handlerSelf: 'I receive harassment reports',
    handlerMember: 'Receives harassment reports',
    handlerSectionBody:
      'Employers covered by Title VII (15+ employees) should give a clear way to report harassment. California (5+) and New York (all employers) require a written policy and training.',
    flagNoHandler: 'No harassment reporting contacts',
    serviceFromLabel: 'Hire date',
    overtimeRule:
      'Non-exempt employees get 1.5× their regular rate after 40 hours in a workweek. In California also after 8 hours a day, and 2× after 12.',
    ded_federal_income_tax: 'Federal income tax',
    ded_social_security: 'Social Security',
    ded_medicare: 'Medicare',
    ded_state_income_tax: 'State income tax',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: 'Health insurance',
    ext_eeoc: 'U.S. Equal Employment Opportunity Commission (EEOC)',
    ext_crd: 'California Civil Rights Department',
    ext_nydhr: 'New York State Division of Human Rights',
    limit_usWeek: 'This workweek (overtime after 40 h)',
    limit_caDay: 'Today (overtime after 8 h)',
    studentRule:
      'F-1 students: on-campus work up to 20 hours a week during term, full-time in breaks; off-campus work needs CPT or OPT. Under 16: 3 hours on a school day, 18 in a school week, 7 a.m.–7 p.m. (FLSA). Many states add their own rules.',
  },
};
