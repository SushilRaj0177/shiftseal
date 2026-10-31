import type { CountryStrings } from '../country.js';

/** Spain: vacaciones, permisos retribuidos, registro de jornada and the protocolo de acoso. */
export const ES_TEXT: CountryStrings = {
  es: {
    recordBroken:
      'Este registro no coincide. Muestra esta pantalla a la Inspección de Trabajo, al comité de empresa o a tu sindicato.',
    leaveBody:
      'Solicita vacaciones, permisos o un día de teletrabajo. Cada decisión queda sellada en tu registro.',
    balanceCasual: 'Permisos',
    balanceSick: 'Baja médica',
    balanceEarned: 'Vacaciones',
    balanceCompOff: 'Descanso compensatorio',
    typeCasual: 'Permiso retribuido (art. 37.3 ET)',
    typeSick: 'Baja por incapacidad temporal',
    typeEarned: 'Vacaciones',
    typeCompOff: 'Descanso compensatorio',
    typeUnpaid: 'Permiso no retribuido',
    typeWfh: 'Teletrabajo',
    compOffNote:
      'Las horas extra aprobadas se compensan con descanso en los 4 meses siguientes en lugar de pagarse.',
    leaveLawNote:
      'Al menos 30 días naturales de vacaciones al año (art. 38 ET). Tu jornada se registra cada día, como exige el art. 34.9 ET.',
    complaintEntry: 'Comunicar un caso de acoso',
    complaintEntrySub:
      'Acoso sexual, por razón de sexo o laboral. Solo lo ve la comisión del protocolo.',
    complaintTitle: 'Denuncia confidencial',
    complaintBody:
      'Solo la recibe la comisión de instrucción del protocolo de acoso de tu empresa, no tu responsable ni la dirección. Puedes excluir a miembros. Está prohibida cualquier represalia por denunciar.',
    committeeLabel: 'Comisión del protocolo de acoso',
    presiding: 'instructor/a',
    noCommittee:
      'Tu empresa aún no ha nombrado a nadie para el protocolo. Puedes enviarlo igualmente y la dirección sabrá que el protocolo es obligatorio. También puedes acudir a la Inspección de Trabajo.',
    excludeLabel: 'Miembros que no deben verlo',
    lawNote:
      'Todas las empresas deben tener un protocolo frente al acoso sexual y por razón de sexo (Ley Orgánica 3/2007, art. 48).',
    committeeInbox: 'Denuncias recibidas',
    handlerSelf: 'Formo parte de la comisión del protocolo de acoso',
    handlerMember: 'Comisión del protocolo de acoso',
    handlerSectionBody:
      'Todas las empresas deben aprobar un protocolo de acoso, con personas designadas para recibir e instruir las denuncias.',
    flagNoHandler: 'Sin comisión del protocolo de acoso',
    serviceFromLabel: 'Fecha de alta',
    overtimeRule:
      'Jornada de 40 horas semanales de promedio; como máximo 9 horas ordinarias al día y 80 horas extra al año. Las horas extra se pagan al menos como ordinarias o se compensan con descanso.',
    annual_paga_navidad: 'Paga extra de Navidad',
    annual_paga_verano: 'Paga extra de verano',
    ded_contingencias_comunes: 'Contingencias comunes',
    ded_desempleo: 'Desempleo',
    ded_formacion_profesional: 'Formación profesional',
    ded_mei: 'Mecanismo de Equidad Intergeneracional',
    ded_irpf: 'Retención de IRPF',
    ext_itss: 'Inspección de Trabajo y Seguridad Social',
    limit_esYear: 'Horas extra este año (máximo 80)',
    limit_esDay: 'Hoy (máximo 9 horas ordinarias)',
    studentRule:
      'Estudiantes internacionales: hasta 30 horas a la semana (Real Decreto 1155/2024). Menores de 18: como máximo 8 horas al día, sin horas extra ni trabajo nocturno (Estatuto de los Trabajadores, arts. 6 y 34.3).',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to the Labour Inspectorate, the works council or your union.',
    leaveBody:
      'Ask for holiday, leave or a day of remote work. Every decision is sealed into your record.',
    balanceCasual: 'Paid leave',
    balanceSick: 'Sick leave',
    balanceEarned: 'Holiday',
    balanceCompOff: 'Time off in lieu',
    typeCasual: 'Paid leave (art. 37.3 Workers’ Statute)',
    typeSick: 'Sick leave (incapacidad temporal)',
    typeEarned: 'Holiday (vacaciones)',
    typeCompOff: 'Time off in lieu',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Remote work',
    compOffNote: 'Approved overtime is given back as rest within 4 months instead of being paid.',
    leaveLawNote:
      'At least 30 calendar days of holiday a year (Workers’ Statute, art. 38). Your hours are recorded daily, as art. 34.9 requires.',
    complaintEntry: 'Report harassment',
    complaintEntrySub:
      'Sexual, sex-based or workplace harassment. Only the protocol committee sees it.',
    complaintTitle: 'Confidential complaint',
    complaintBody:
      'This goes only to your company’s harassment protocol committee, not to your manager or management. You can exclude members. Retaliation for reporting is prohibited.',
    committeeLabel: 'Harassment protocol committee',
    presiding: 'investigator',
    noCommittee:
      'Your company has not named anyone under the protocol yet. You can still send this, and management will be told the protocol is required. You can also go to the Labour Inspectorate.',
    excludeLabel: 'Members who must not see this',
    lawNote:
      'Every company must have a protocol against sexual and sex-based harassment (Organic Law 3/2007, art. 48).',
    committeeInbox: 'Complaints received',
    handlerSelf: 'I am on the harassment protocol committee',
    handlerMember: 'Harassment protocol committee',
    handlerSectionBody:
      'Every company must adopt a harassment protocol with people named to receive and investigate complaints.',
    flagNoHandler: 'No harassment protocol committee',
    serviceFromLabel: 'Start date',
    overtimeRule:
      '40 hours a week on average; at most 9 ordinary hours a day and 80 overtime hours a year. Overtime is paid at least at the ordinary rate or given back as rest.',
    annual_paga_navidad: 'Christmas extra payment',
    annual_paga_verano: 'Summer extra payment',
    ded_contingencias_comunes: 'Social security (common contingencies)',
    ded_desempleo: 'Unemployment',
    ded_formacion_profesional: 'Vocational training',
    ded_mei: 'Intergenerational equity mechanism',
    ded_irpf: 'Income tax withheld (IRPF)',
    ext_itss: 'Labour and Social Security Inspectorate',
    limit_esYear: 'Overtime this year (80 h maximum)',
    limit_esDay: 'Today (9 ordinary hours maximum)',
    studentRule:
      'International students: up to 30 hours a week (Royal Decree 1155/2024). Under 18: at most 8 hours a day, no overtime and no night work (Workers’ Statute, arts. 6 and 34.3).',
  },
};
