import type { CountryStrings } from '../country.js';

/** Mexico: vacaciones dignas, aguinaldo, PTU, horas extra dobles y triples, NOM-035. */
export const MX_TEXT: CountryStrings = {
  es: {
    recordBroken:
      'Este registro no coincide. Muestra esta pantalla a la PROFEDET, a la Inspección del Trabajo o a tu sindicato.',
    leaveBody:
      'Pide vacaciones, permisos o home office. Cada decisión queda sellada en tu registro.',
    balanceCasual: 'Permisos con goce',
    balanceSick: 'Incapacidad',
    balanceEarned: 'Vacaciones',
    balanceCompOff: 'Descanso compensatorio',
    typeCasual: 'Permiso con goce de sueldo',
    typeSick: 'Incapacidad IMSS',
    typeEarned: 'Vacaciones',
    typeCompOff: 'Descanso compensatorio',
    typeUnpaid: 'Permiso sin goce de sueldo',
    typeWfh: 'Home office',
    compOffNote: 'En México las horas extra se pagan; no se cambian por días de descanso.',
    leaveLawNote:
      '12 días de vacaciones al cumplir el primer año, 2 más por año hasta 20, y luego 2 más cada 5 años, con prima vacacional de al menos 25 % (LFT, arts. 76 y 80).',
    complaintEntry: 'Presentar una queja por acoso',
    complaintEntrySub:
      'Acoso sexual, hostigamiento o violencia laboral. Solo la ven las personas del protocolo.',
    complaintTitle: 'Queja confidencial',
    complaintBody:
      'Llega solo a las personas designadas en el protocolo contra la violencia y el acoso de tu centro de trabajo, no a tu jefe ni al dueño. Puedes excluir a alguien. Está prohibido tomar represalias por quejarte.',
    committeeLabel: 'Responsables del protocolo de acoso',
    presiding: 'responsable',
    noCommittee:
      'Tu centro de trabajo aún no ha designado responsables. Puedes enviarla de todos modos y el dueño sabrá que el protocolo es obligatorio. También puedes acudir a la PROFEDET.',
    excludeLabel: 'Personas que no deben verla',
    lawNote:
      'Todo patrón debe tener un protocolo para prevenir la discriminación y atender casos de violencia y acoso (LFT, art. 132, fr. XXXI; NOM-035-STPS-2018).',
    committeeInbox: 'Quejas recibidas',
    handlerSelf: 'Soy responsable del protocolo de acoso',
    handlerMember: 'Responsable del protocolo de acoso',
    handlerSectionBody:
      'Todo patrón debe implementar, con los trabajadores, un protocolo contra la violencia y el acoso, con personas que reciban y atiendan las quejas.',
    flagNoHandler: 'Sin responsables del protocolo de acoso',
    serviceFromLabel: 'Fecha de ingreso',
    overtimeRule:
      'Jornada de 8 horas diarias y 48 a la semana en 2026 (baja a 40 hacia 2030). Las primeras 9 horas extra de la semana se pagan dobles y las siguientes triples. El domingo tiene prima dominical del 25 %.',
    annual_aguinaldo: 'Aguinaldo (al menos 15 días de salario)',
    annual_ptu: 'Reparto de utilidades (PTU)',
    ded_isr: 'ISR',
    ded_imss: 'Cuota obrera IMSS',
    ded_infonavit: 'Crédito INFONAVIT',
    ded_fonacot: 'Crédito FONACOT',
    ext_profedet: 'PROFEDET (Procuraduría Federal de la Defensa del Trabajo)',
    ext_cfcrl: 'Centro Federal de Conciliación y Registro Laboral',
    limit_mxWeek: 'Horas extra esta semana (máximo 9)',
    limit_mxDay: 'Horas extra hoy (máximo 3)',
    studentRule:
      'Los estudiantes internacionales necesitan un permiso de trabajo del INM. Menores de 18: sin horas extra; menores de 16: como máximo 6 horas al día (Ley Federal del Trabajo, arts. 175–178).',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to PROFEDET, the labour inspectorate or your union.',
    leaveBody:
      'Ask for vacation, leave or a home-office day. Every decision is sealed into your record.',
    balanceCasual: 'Paid leave',
    balanceSick: 'Sick leave (IMSS)',
    balanceEarned: 'Vacation',
    balanceCompOff: 'Time off in lieu',
    typeCasual: 'Paid leave',
    typeSick: 'Sick leave (IMSS incapacity)',
    typeEarned: 'Vacation',
    typeCompOff: 'Time off in lieu',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Home office',
    compOffNote: 'In Mexico overtime is paid; it is not swapped for days off.',
    leaveLawNote:
      '12 vacation days after the first year, 2 more each year up to 20, then 2 more every 5 years, with a vacation premium of at least 25% (Federal Labour Law, arts. 76 and 80).',
    complaintEntry: 'File a harassment complaint',
    complaintEntrySub:
      'Sexual harassment, bullying or workplace violence. Only the protocol contacts see it.',
    complaintTitle: 'Confidential complaint',
    complaintBody:
      'This goes only to the people named in your workplace’s protocol against violence and harassment, not to your boss or the owner. You can exclude someone. Retaliation for complaining is prohibited.',
    committeeLabel: 'Harassment protocol contacts',
    presiding: 'lead',
    noCommittee:
      'Your workplace has not named protocol contacts yet. You can still send this, and the owner will be told the protocol is required. You can also go to PROFEDET.',
    excludeLabel: 'People who must not see this',
    lawNote:
      'Every employer must have a protocol to prevent discrimination and handle violence and harassment (Federal Labour Law, art. 132-XXXI; NOM-035).',
    committeeInbox: 'Complaints received',
    handlerSelf: 'I am a harassment protocol contact',
    handlerMember: 'Harassment protocol contact',
    handlerSectionBody:
      'Every employer must put in place, with its workers, a protocol against violence and harassment, with people to receive and handle complaints.',
    flagNoHandler: 'No harassment protocol contacts',
    serviceFromLabel: 'Start date',
    overtimeRule:
      '8 hours a day and 48 a week in 2026 (falling to 40 by 2030). The first 9 overtime hours of the week are paid double, the rest triple. Sunday work earns a 25% Sunday premium.',
    annual_aguinaldo: 'Christmas bonus (aguinaldo, at least 15 days’ pay)',
    annual_ptu: 'Profit sharing (PTU)',
    ded_isr: 'Income tax (ISR)',
    ded_imss: 'IMSS employee contribution',
    ded_infonavit: 'INFONAVIT loan',
    ded_fonacot: 'FONACOT loan',
    ext_profedet: 'PROFEDET (Federal Labour Defence Office)',
    ext_cfcrl: 'Federal Centre for Labour Conciliation and Registration',
    limit_mxWeek: 'Overtime this week (9 h maximum)',
    limit_mxDay: 'Overtime today (3 h maximum)',
    studentRule:
      'International students need a work permit from the National Migration Institute (INM). Under 18: no overtime; under 16: at most 6 hours a day (Federal Labour Law, arts. 175–178).',
  },
};
