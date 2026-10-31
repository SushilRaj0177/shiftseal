import type { CountryStrings } from '../country.js';

/** Portugal: férias, faltas justificadas, banco de horas and the código de conduta. */
export const PT_TEXT: CountryStrings = {
  pt: {
    recordBroken:
      'Este registo não corresponde. Mostre este ecrã à ACT (Autoridade para as Condições do Trabalho) ou ao seu sindicato.',
    leaveBody:
      'Peça férias, faltas ou um dia de teletrabalho. Cada decisão fica selada no seu registo.',
    balanceCasual: 'Faltas justificadas',
    balanceSick: 'Doença',
    balanceEarned: 'Férias',
    balanceCompOff: 'Descanso compensatório',
    typeCasual: 'Falta justificada (art. 249.º)',
    typeSick: 'Baixa médica',
    typeEarned: 'Férias',
    typeCompOff: 'Descanso compensatório',
    typeUnpaid: 'Licença sem retribuição',
    typeWfh: 'Teletrabalho',
    compOffNote: 'O trabalho suplementar aprovado é compensado com descanso em vez de ser pago.',
    leaveLawNote:
      '22 dias úteis de férias por ano; no ano de admissão, 2 dias por mês até 20 (Código do Trabalho, arts. 238.º e 239.º).',
    complaintEntry: 'Comunicar uma situação de assédio',
    complaintEntrySub: 'Só as pessoas designadas no código de conduta veem a comunicação.',
    complaintTitle: 'Queixa confidencial',
    complaintBody:
      'Vai apenas para as pessoas designadas no código de conduta contra o assédio, não para a sua chefia nem para a gerência. Pode excluir pessoas. É proibido sancionar quem denuncia.',
    committeeLabel: 'Responsáveis pelo código de conduta',
    presiding: 'responsável',
    noCommittee:
      'A sua empresa ainda não designou ninguém. Pode enviar na mesma, e a gerência será informada de que é obrigatório. Também pode recorrer à ACT ou à CITE.',
    excludeLabel: 'Pessoas que não devem ver',
    lawNote:
      'Empresas com 7 ou mais trabalhadores devem ter um código de conduta contra o assédio e abrir processo disciplinar quando tenham conhecimento de casos (art. 127.º).',
    committeeInbox: 'Queixas recebidas',
    handlerSelf: 'Sou responsável pelas queixas de assédio',
    handlerMember: 'Responsável pelas queixas de assédio',
    handlerSectionBody:
      'Com 7 ou mais trabalhadores, a empresa deve adotar um código de conduta contra o assédio e indicar quem recebe as queixas.',
    flagNoHandler: 'Sem responsável pelas queixas de assédio',
    serviceFromLabel: 'Data de admissão',
    overtimeRule:
      'Trabalho suplementar além de 8 horas por dia ou 40 por semana: +25% na 1.ª hora, +37,5% nas seguintes (mais acima de 100 horas por ano); dias de descanso +50%.',
    annual_subsidio_ferias: 'Subsídio de férias',
    annual_subsidio_natal: 'Subsídio de Natal',
    ded_seguranca_social: 'Segurança Social (11%)',
    ded_irs: 'Retenção na fonte de IRS',
    ded_sindicato: 'Quota sindical',
    ext_act: 'ACT – Autoridade para as Condições do Trabalho',
    ext_cite: 'CITE – Comissão para a Igualdade no Trabalho e no Emprego',
    limit_ptYear: 'Trabalho suplementar este ano (150 h)',
    limit_ptDay: 'Trabalho suplementar hoje (máximo 2 h)',
    studentRule:
      'Os estudantes internacionais podem trabalhar durante os estudos; o limite mais citado é de 20 horas por semana em período letivo e tempo inteiro nas férias, mas confirme com a AIMA. Menores de 18: 8 horas por dia, 40 por semana, sem trabalho noturno (Código do Trabalho, arts. 73 e 76).',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to the ACT (Working Conditions Authority) or your union.',
    leaveBody:
      'Ask for holiday, leave or a day of remote work. Every decision is sealed into your record.',
    balanceCasual: 'Justified absences',
    balanceSick: 'Sick leave',
    balanceEarned: 'Holiday',
    balanceCompOff: 'Time off in lieu',
    typeCasual: 'Justified absence (art. 249)',
    typeSick: 'Sick leave',
    typeEarned: 'Holiday (férias)',
    typeCompOff: 'Time off in lieu',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Remote work',
    compOffNote: 'Approved overtime is given back as rest instead of being paid.',
    leaveLawNote:
      '22 working days of holiday a year; in the year you start, 2 days a month up to 20 (Labour Code, arts. 238–239).',
    complaintEntry: 'Report harassment',
    complaintEntrySub: 'Only the people named in the code of conduct see it.',
    complaintTitle: 'Confidential complaint',
    complaintBody:
      'This goes only to the people named in the anti-harassment code of conduct, not to your manager or management. You can exclude people. Penalising someone for reporting is prohibited.',
    committeeLabel: 'Code of conduct contacts',
    presiding: 'lead',
    noCommittee:
      'Your company has not named anyone yet. You can still send this, and management will be told it is required. You can also go to the ACT or CITE.',
    excludeLabel: 'People who must not see this',
    lawNote:
      'Companies with 7 or more workers must have an anti-harassment code of conduct and open disciplinary proceedings when they learn of cases (art. 127).',
    committeeInbox: 'Complaints received',
    handlerSelf: 'I receive harassment complaints',
    handlerMember: 'Receives harassment complaints',
    handlerSectionBody:
      'With 7 or more workers, the company must adopt an anti-harassment code of conduct and say who receives complaints.',
    flagNoHandler: 'No one to receive harassment complaints',
    serviceFromLabel: 'Start date',
    overtimeRule:
      'Overtime beyond 8 hours a day or 40 a week: +25% for the first hour, +37.5% after (more beyond 100 hours a year); rest days +50%.',
    annual_subsidio_ferias: 'Holiday allowance',
    annual_subsidio_natal: 'Christmas allowance',
    ded_seguranca_social: 'Social security (11%)',
    ded_irs: 'Income tax withheld (IRS)',
    ded_sindicato: 'Union dues',
    ext_act: 'ACT – Working Conditions Authority',
    ext_cite: 'CITE – Commission for Equality in Labour and Employment',
    limit_ptYear: 'Overtime this year (150 h)',
    limit_ptDay: 'Overtime today (2 h maximum)',
    studentRule:
      'International students may work alongside their studies; the most cited limit is 20 hours a week in term and full-time in holidays, but confirm with AIMA. Under 18: 8 hours a day, 40 a week, no night work (Labour Code, arts. 73 and 76).',
  },
};
