import type { CountryStrings } from '../country.js';

/** Germany: Urlaub, Freizeitausgleich, the ArbZG limits and the AGG Beschwerdestelle. */
export const DE_TEXT: CountryStrings = {
  de: {
    recordBroken:
      'Dieser Nachweis stimmt nicht überein. Zeigen Sie diesen Bildschirm dem Betriebsrat, Ihrer Gewerkschaft oder dem Amt für Arbeitsschutz.',
    leaveBody:
      'Beantragen Sie Urlaub oder mobiles Arbeiten. Jede Entscheidung wird in Ihrem Nachweis versiegelt.',
    balanceCasual: 'Sonderurlaub',
    balanceSick: 'Krankheit',
    balanceEarned: 'Urlaub',
    balanceCompOff: 'Freizeitausgleich',
    typeCasual: 'Sonderurlaub (§ 616 BGB)',
    typeSick: 'Krankmeldung',
    typeEarned: 'Erholungsurlaub',
    typeCompOff: 'Freizeitausgleich',
    typeUnpaid: 'Unbezahlter Urlaub',
    typeWfh: 'Mobiles Arbeiten',
    compOffNote:
      'Genehmigte Mehrarbeit wird als Freizeitausgleich gutgeschrieben statt ausgezahlt.',
    leaveLawNote:
      'Gesetzlich mindestens 20 Urlaubstage bei einer 5-Tage-Woche (§ 3 BUrlG). Bei Krankheit ab dem 4. Tag eine Arbeitsunfähigkeitsbescheinigung.',
    complaintEntry: 'Belästigung oder Diskriminierung melden',
    complaintEntrySub: 'Nur die Beschwerdestelle Ihres Arbeitgebers sieht die Meldung.',
    complaintTitle: 'Vertrauliche Beschwerde',
    complaintBody:
      'Die Beschwerde geht nur an die Beschwerdestelle nach § 13 AGG, nicht an Ihre Vorgesetzten oder die Geschäftsführung. Sie können Mitglieder ausschließen. Benachteiligung wegen einer Beschwerde ist verboten (§ 16 AGG).',
    committeeLabel: 'AGG-Beschwerdestelle',
    presiding: 'Leitung',
    noCommittee:
      'Ihr Arbeitgeber hat noch keine Beschwerdestelle benannt. Sie können die Beschwerde trotzdem senden; die Geschäftsführung erfährt, dass eine Beschwerdestelle Pflicht ist. Die Antidiskriminierungsstelle des Bundes berät ebenfalls.',
    excludeLabel: 'Mitglieder, die die Beschwerde nicht sehen dürfen',
    lawNote:
      'Ansprüche nach dem AGG müssen innerhalb von 2 Monaten schriftlich geltend gemacht werden (§ 15 Abs. 4 AGG).',
    committeeInbox: 'Eingang der Beschwerdestelle',
    handlerSelf: 'Ich gehöre zur AGG-Beschwerdestelle',
    handlerMember: 'AGG-Beschwerdestelle',
    handlerSectionBody:
      'Jeder Arbeitgeber muss eine Beschwerdestelle einrichten, Beschwerden prüfen und das Ergebnis mitteilen (§ 13 AGG).',
    flagNoHandler: 'Keine AGG-Beschwerdestelle',
    serviceFromLabel: 'Eintrittsdatum',
    overtimeRule:
      'Höchstens 10 Stunden am Tag und im Schnitt 48 pro Woche (ArbZG). Ein Überstundenzuschlag gilt nur nach Vertrag oder Tarif; Nachtarbeit (23–6 Uhr) wird mit Zuschlag ausgeglichen.',
    ded_lohnsteuer: 'Lohnsteuer',
    ded_soli: 'Solidaritätszuschlag',
    ded_kirchensteuer: 'Kirchensteuer',
    ded_rentenversicherung: 'Rentenversicherung',
    ded_krankenversicherung: 'Krankenversicherung',
    ded_pflegeversicherung: 'Pflegeversicherung',
    ded_arbeitslosenversicherung: 'Arbeitslosenversicherung',
    ext_ads: 'Antidiskriminierungsstelle des Bundes',
    limit_deDay: 'Heute (höchstens 10 Stunden)',
    limit_deAvg: 'Durchschnitt über 6 Monate (höchstens 48 Stunden/Woche)',
    studentRule:
      'Internationale Studierende: 140 ganze oder 280 halbe Tage im Jahr (§ 16b Abs. 3 AufenthG); wer in der Vorlesungszeit bei 20 Stunden pro Woche bleibt, behält die günstige Sozialversicherung für Studierende. Unter 18: 8 Stunden am Tag, 40 pro Woche, keine Arbeit zwischen 20 und 6 Uhr (JArbSchG).',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to the works council, your union or the occupational safety authority.',
    leaveBody: 'Ask for leave or a day of mobile work. Every decision is sealed into your record.',
    balanceCasual: 'Special leave',
    balanceSick: 'Sick leave',
    balanceEarned: 'Holiday',
    balanceCompOff: 'Time off in lieu',
    typeCasual: 'Special leave (BGB § 616)',
    typeSick: 'Sick leave',
    typeEarned: 'Annual holiday (Urlaub)',
    typeCompOff: 'Time off in lieu (Freizeitausgleich)',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Mobile work',
    compOffNote: 'Approved extra hours are credited as time off in lieu instead of being paid out.',
    leaveLawNote:
      'At least 20 days a year on a 5-day week by law (Federal Holiday Act, § 3). A doctor’s certificate is needed from the 4th day of sickness.',
    complaintEntry: 'Report harassment or discrimination',
    complaintEntrySub: 'Only your employer’s complaints office sees it.',
    complaintTitle: 'Confidential complaint',
    complaintBody:
      'This goes only to the complaints office under the General Equal Treatment Act (AGG § 13), not to your manager or management. You can exclude members. Disadvantaging you for complaining is prohibited (AGG § 16).',
    committeeLabel: 'AGG complaints office',
    presiding: 'head',
    noCommittee:
      'Your employer has not named a complaints office yet. You can still send this, and management will be told one is required. The Federal Anti-Discrimination Agency also gives advice.',
    excludeLabel: 'Members who must not see this',
    lawNote: 'Claims under the AGG must be made in writing within 2 months (AGG § 15(4)).',
    committeeInbox: 'Complaints office inbox',
    handlerSelf: 'I am on the AGG complaints office',
    handlerMember: 'AGG complaints office',
    handlerSectionBody:
      'Every employer must set up a complaints office, examine complaints and report the outcome (AGG § 13).',
    flagNoHandler: 'No AGG complaints office',
    serviceFromLabel: 'Start date',
    overtimeRule:
      'At most 10 hours a day and 48 a week on average (Working Hours Act). Any overtime premium comes from the contract or collective agreement; night work (23:00–6:00) earns a supplement.',
    ded_lohnsteuer: 'Wage tax',
    ded_soli: 'Solidarity surcharge',
    ded_kirchensteuer: 'Church tax',
    ded_rentenversicherung: 'Pension insurance',
    ded_krankenversicherung: 'Health insurance',
    ded_pflegeversicherung: 'Long-term care insurance',
    ded_arbeitslosenversicherung: 'Unemployment insurance',
    ext_ads: 'Federal Anti-Discrimination Agency',
    limit_deDay: 'Today (10 h maximum)',
    limit_deAvg: 'Average over 6 months (48 h/week maximum)',
    studentRule:
      'International students: 140 full or 280 half days a year (Residence Act, s.16b(3)); staying at 20 hours a week during lectures keeps student social insurance rates. Under 18: 8 hours a day, 40 a week, no work 20:00–6:00 (Youth Employment Protection Act).',
  },
};
