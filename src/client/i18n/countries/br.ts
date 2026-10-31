import type { CountryStrings } from '../country.js';

/** Brazil: férias + 1/3, 13º salário, banco de horas, adicional noturno and the CIPA channel. */
export const BR_TEXT: CountryStrings = {
  pt: {
    recordBroken:
      'Este registro não confere. Mostre esta tela ao sindicato, ao Ministério do Trabalho ou ao Ministério Público do Trabalho.',
    leaveBody:
      'Peça férias, folgas ou um dia de home office. Cada decisão fica selada no seu registro.',
    balanceCasual: 'Faltas justificadas',
    balanceSick: 'Atestado',
    balanceEarned: 'Férias',
    balanceCompOff: 'Banco de horas',
    typeCasual: 'Falta justificada (CLT, art. 473)',
    typeSick: 'Atestado médico',
    typeEarned: 'Férias',
    typeCompOff: 'Folga do banco de horas',
    typeUnpaid: 'Licença não remunerada',
    typeWfh: 'Home office',
    compOffNote: 'As horas extras aprovadas vão para o banco de horas em vez de serem pagas.',
    leaveLawNote:
      '30 dias corridos de férias a cada 12 meses trabalhados, com o adicional de 1/3 (CLT, art. 130; Constituição, art. 7º, XVII).',
    complaintEntry: 'Denunciar assédio',
    complaintEntrySub: 'Assédio sexual ou moral. Só o canal de denúncias da empresa vê.',
    complaintTitle: 'Denúncia confidencial',
    complaintBody:
      'Vai só para as pessoas do canal de denúncias de assédio da empresa, não para o seu chefe nem para o dono. Você pode excluir pessoas. É proibido retaliar quem denuncia.',
    committeeLabel: 'Canal de denúncias (CIPA)',
    presiding: 'responsável',
    noCommittee:
      'Sua empresa ainda não indicou ninguém para o canal de denúncias. Você pode enviar mesmo assim, e o dono será avisado de que o canal pode ser obrigatório. Também pode procurar o Ministério Público do Trabalho.',
    excludeLabel: 'Pessoas que não devem ver',
    lawNote:
      'Empresas obrigadas a ter CIPA devem manter canal de denúncias de assédio, com sigilo para quem denuncia (Lei 14.457/2022, art. 23).',
    committeeInbox: 'Denúncias recebidas',
    handlerSelf: 'Recebo as denúncias de assédio',
    handlerMember: 'Recebe denúncias de assédio',
    handlerSectionBody:
      'Empresas obrigadas a ter CIPA devem manter um canal de denúncias de assédio, regras de conduta e treinamentos anuais.',
    flagNoHandler: 'Sem canal de denúncias de assédio',
    serviceFromLabel: 'Data de admissão',
    overtimeRule:
      'Hora extra além de 8 horas por dia ou 44 por semana, com adicional de 50% (até 2 por dia). Domingo sem folga em dobro. Das 22h às 5h, adicional noturno de 20% e hora de 52min30s.',
    annual_decimo_terceiro_1: '13º salário – 1ª parcela',
    annual_decimo_terceiro_2: '13º salário – 2ª parcela',
    ded_inss: 'INSS',
    ded_irrf: 'IRRF',
    ded_vale_transporte: 'Vale-transporte (até 6%)',
    ded_plano_saude: 'Plano de saúde',
    ded_contribuicao_sindical: 'Contribuição sindical',
    ext_mpt: 'Ministério Público do Trabalho',
    ext_mte: 'Ministério do Trabalho e Emprego',
    limit_brDay: 'Horas extras hoje (máximo 2)',
    limit_brWeek: 'Horas nesta semana (jornada de 44 h)',
    studentRule:
      'Estagiários: no máximo 6 horas por dia e 30 por semana (Lei 11.788/2008, art. 10). Menores de 18 anos: sem trabalho entre 22h e 5h e sem horas extras (CLT, arts. 404 e 413). Estudantes estrangeiros precisam de autorização para trabalhar.',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to your union, the Ministry of Labour or the Labour Prosecutor’s Office.',
    leaveBody:
      'Ask for vacation, days off or a home-office day. Every decision is sealed into your record.',
    balanceCasual: 'Justified absences',
    balanceSick: 'Medical certificate',
    balanceEarned: 'Vacation',
    balanceCompOff: 'Hour bank',
    typeCasual: 'Justified absence (CLT, art. 473)',
    typeSick: 'Medical certificate (atestado)',
    typeEarned: 'Vacation (férias)',
    typeCompOff: 'Day off from the hour bank',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Home office',
    compOffNote: 'Approved overtime goes into the hour bank instead of being paid.',
    leaveLawNote:
      '30 calendar days of vacation for each 12 months worked, plus a one-third bonus (CLT, art. 130; Constitution, art. 7-XVII).',
    complaintEntry: 'Report harassment',
    complaintEntrySub: 'Sexual or moral harassment. Only the company’s reporting channel sees it.',
    complaintTitle: 'Confidential report',
    complaintBody:
      'This goes only to the people on the company’s harassment reporting channel, not to your boss or the owner. You can exclude people. Retaliating against someone who reports is prohibited.',
    committeeLabel: 'Reporting channel (CIPA)',
    presiding: 'lead',
    noCommittee:
      'Your company has not named anyone for the reporting channel yet. You can still send this, and the owner will be told the channel may be required. You can also go to the Labour Prosecutor’s Office.',
    excludeLabel: 'People who must not see this',
    lawNote:
      'Companies required to have a CIPA must keep a harassment reporting channel that protects the reporter’s identity (Law 14.457/2022, art. 23).',
    committeeInbox: 'Reports received',
    handlerSelf: 'I receive harassment reports',
    handlerMember: 'Receives harassment reports',
    handlerSectionBody:
      'Companies required to have a CIPA must keep a harassment reporting channel, conduct rules and yearly training.',
    flagNoHandler: 'No harassment reporting channel',
    serviceFromLabel: 'Start date',
    overtimeRule:
      'Overtime beyond 8 hours a day or 44 a week, at +50% (up to 2 a day). Sunday work without a day off is paid double. 22:00–5:00 earns a 20% night premium, with a 52½-minute night hour.',
    annual_decimo_terceiro_1: '13th salary – 1st instalment',
    annual_decimo_terceiro_2: '13th salary – 2nd instalment',
    ded_inss: 'Social security (INSS)',
    ded_irrf: 'Income tax withheld (IRRF)',
    ded_vale_transporte: 'Transport voucher (up to 6%)',
    ded_plano_saude: 'Health plan',
    ded_contribuicao_sindical: 'Union contribution',
    ext_mpt: 'Labour Prosecutor’s Office (MPT)',
    ext_mte: 'Ministry of Labour and Employment',
    limit_brDay: 'Overtime today (2 h maximum)',
    limit_brWeek: 'Hours this week (44-hour week)',
    studentRule:
      'Student interns (estágio): at most 6 hours a day and 30 a week (Law 11.788/2008, art. 10). Under 18: no work 22:00–5:00 and no overtime (CLT, arts. 404 and 413). Foreign students need authorisation to work.',
  },
};
