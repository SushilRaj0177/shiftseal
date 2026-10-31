import type { CountryStrings } from '../country.js';

/** France: congés payés, RTT, the 35-hour week and the référent harcèlement. */
export const FR_TEXT: CountryStrings = {
  fr: {
    recordBroken:
      'Ce registre ne correspond pas. Montrez cet écran à l’inspection du travail, à un délégué du CSE ou à votre syndicat.',
    leaveBody:
      'Posez un congé ou un jour de télétravail. Chaque décision est scellée dans votre registre.',
    balanceCasual: 'Événements familiaux',
    balanceSick: 'Maladie',
    balanceEarned: 'Congés payés',
    balanceCompOff: 'Repos compensateur',
    typeCasual: 'Congé pour événement familial',
    typeSick: 'Arrêt maladie',
    typeEarned: 'Congés payés',
    typeCompOff: 'Repos compensateur (RTT)',
    typeUnpaid: 'Congé sans solde',
    typeWfh: 'Télétravail',
    compOffNote:
      'Les heures supplémentaires approuvées sont converties en repos compensateur au lieu d’être payées.',
    leaveLawNote:
      '2,5 jours ouvrables par mois de travail, soit 5 semaines par an (Code du travail, art. L3141-3). Un arrêt maladie se transmet sous 48 heures.',
    complaintEntry: 'Signaler un harcèlement',
    complaintEntrySub:
      'Harcèlement sexuel ou moral, agissements sexistes. Seuls les référents le voient.',
    complaintTitle: 'Signalement confidentiel',
    complaintBody:
      'Votre signalement va uniquement aux référents harcèlement de votre entreprise, pas à votre responsable ni à la direction. Vous pouvez exclure certains référents. Aucune sanction ne peut être prise parce que vous avez signalé.',
    committeeLabel: 'Référents harcèlement',
    presiding: 'référent principal',
    noCommittee:
      'Votre entreprise n’a pas encore désigné de référent. Vous pouvez quand même envoyer ce signalement ; la direction sera informée qu’un référent est obligatoire. Vous pouvez aussi saisir l’inspection du travail ou le Défenseur des droits.',
    excludeLabel: 'Référents qui ne doivent pas le voir',
    lawNote:
      'L’employeur doit prévenir le harcèlement, enquêter sur tout signalement et protéger la personne qui signale (Code du travail, art. L1153-5 et L1152-4).',
    committeeInbox: 'Signalements reçus',
    handlerSelf: 'Je suis référent harcèlement',
    handlerMember: 'Référent harcèlement',
    handlerSectionBody:
      'Dès 11 salariés, le CSE désigne un référent harcèlement sexuel et agissements sexistes ; dès 250 salariés, l’employeur en désigne aussi un.',
    flagNoHandler: 'Aucun référent harcèlement',
    serviceFromLabel: 'Date d’entrée',
    overtimeRule:
      'Heures supplémentaires au-delà de 35 heures par semaine : +25 % pour les 8 premières, +50 % ensuite. 10 heures par jour et 48 par semaine au maximum.',
    ded_csg_crds: 'CSG / CRDS',
    ded_social_security: 'Sécurité sociale (vieillesse)',
    ded_complementary_pension: 'Retraite complémentaire (Agirc-Arrco)',
    ded_withholding_tax: 'Prélèvement à la source',
    ded_mutuelle: 'Mutuelle',
    ext_inspection: 'Inspection du travail',
    ext_defenseur: 'Défenseur des droits',
    limit_frWeek: 'Cette semaine (48 h au maximum)',
    limit_frDay: 'Aujourd’hui (10 h au maximum)',
    limit_frAvg: 'Moyenne sur 12 semaines (44 h au maximum)',
    limit_frYear: 'Heures supplémentaires cette année (contingent de 220 h)',
    studentRule:
      'Étudiants internationaux : 964 heures par an au total (Code du travail, art. R5221-26). Moins de 18 ans : 8 heures par jour, 35 par semaine, pas de travail de nuit (22 h–6 h ; 20 h–6 h avant 16 ans).',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to the labour inspectorate, a CSE representative or your union.',
    leaveBody: 'Ask for leave or a work-from-home day. Every decision is sealed into your record.',
    balanceCasual: 'Family events',
    balanceSick: 'Sick leave',
    balanceEarned: 'Paid holiday',
    balanceCompOff: 'Time off in lieu',
    typeCasual: 'Family event leave',
    typeSick: 'Sick leave (arrêt maladie)',
    typeEarned: 'Paid holiday (congés payés)',
    typeCompOff: 'Time off in lieu (RTT)',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Remote work',
    compOffNote: 'Approved extra hours become time off in lieu instead of being paid.',
    leaveLawNote:
      '2.5 working days for each month worked, 5 weeks a year (Labour Code, art. L3141-3). A sick note must be sent within 48 hours.',
    complaintEntry: 'Report harassment',
    complaintEntrySub:
      'Sexual or moral harassment, sexist behaviour. Only the harassment referents see it.',
    complaintTitle: 'Confidential report',
    complaintBody:
      'This goes only to your company’s harassment referents, not to your manager or management. You can exclude referents. You cannot be penalised for reporting.',
    committeeLabel: 'Harassment referents',
    presiding: 'lead referent',
    noCommittee:
      'Your company has not named a referent yet. You can still send this, and management will be told a referent is required. You can also go to the labour inspectorate or the Défenseur des droits.',
    excludeLabel: 'Referents who must not see this',
    lawNote:
      'The employer must prevent harassment, investigate every report and protect the person reporting (Labour Code, arts. L1153-5 and L1152-4).',
    committeeInbox: 'Reports received',
    handlerSelf: 'I am a harassment referent',
    handlerMember: 'Harassment referent',
    handlerSectionBody:
      'From 11 employees the CSE names a sexual harassment referent; from 250 the employer names one too.',
    flagNoHandler: 'No harassment referent',
    serviceFromLabel: 'Start date',
    overtimeRule:
      'Overtime beyond 35 hours a week: +25% for the first 8 hours, +50% after. At most 10 hours a day and 48 a week.',
    ded_csg_crds: 'CSG / CRDS',
    ded_social_security: 'Social security (old age)',
    ded_complementary_pension: 'Complementary pension (Agirc-Arrco)',
    ded_withholding_tax: 'Income tax withheld',
    ded_mutuelle: 'Health cover (mutuelle)',
    ext_inspection: 'Labour inspectorate',
    ext_defenseur: 'Défenseur des droits',
    limit_frWeek: 'This week (48 h maximum)',
    limit_frDay: 'Today (10 h maximum)',
    limit_frAvg: 'Average over 12 weeks (44 h maximum)',
    limit_frYear: 'Overtime this year (220 h allowance)',
    studentRule:
      'International students: 964 hours a year in total (Labour Code, art. R5221-26). Under 18: 8 hours a day, 35 a week, no night work (22:00–6:00; 20:00–6:00 under 16).',
  },
};
