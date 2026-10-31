import type { CountryStrings } from '../country.js';

/** China: 年休假, 调休, 事假, the 36-hour monthly overtime cap and sexual harassment complaints. */
export const CN_TEXT: CountryStrings = {
  zh: {
    recordBroken: '此记录不一致。请把这个页面给劳动保障监察部门或工会看，也可拨打 12333。',
    leaveBody: '申请休假或居家办公。每个决定都会封存到你的记录中。',
    balanceCasual: '事假',
    balanceSick: '病假',
    balanceEarned: '年休假',
    balanceCompOff: '调休',
    typeCasual: '事假（无薪）',
    typeSick: '病假',
    typeEarned: '带薪年休假',
    typeCompOff: '调休',
    typeUnpaid: '无薪假',
    typeWfh: '居家办公',
    compOffNote: '休息日加班可以安排调休；不能调休的，按不低于 200% 支付加班工资。',
    leaveLawNote:
      '累计工作满 1 年不满 10 年的，年休假 5 天；满 10 年不满 20 年的，10 天；满 20 年的，15 天（《职工带薪年休假条例》第3条）。',
    complaintEntry: '提交性骚扰保密投诉',
    complaintEntrySub: '只有单位指定的投诉处理人员能看到。',
    complaintTitle: '保密投诉',
    complaintBody:
      '投诉只发给单位指定的处理人员，不会发给你的经理或老板。你可以指定不能查看的人员。因投诉而受到不利对待是违法的。',
    committeeLabel: '性骚扰投诉处理人员',
    presiding: '负责人',
    noCommittee:
      '你的单位还没有指定投诉处理人员。你仍然可以提交，老板会收到必须建立投诉机制的提醒。你也可以拨打 12338 妇女维权热线或 12333。',
    excludeLabel: '不能查看的人员',
    lawNote:
      '用人单位应当建立预防和处置性骚扰的制度，畅通投诉渠道，及时处理（《妇女权益保障法》第25条）。',
    committeeInbox: '投诉收件箱',
    handlerSelf: '我负责处理性骚扰投诉',
    handlerMember: '投诉处理人员',
    handlerSectionBody: '所有用人单位都应建立性骚扰投诉处理机制，指定处理人员并告知职工。',
    flagNoHandler: '未建立性骚扰投诉处理机制',
    serviceFromLabel: '累计工作年限起算日',
    overtimeRule:
      '每天超过 8 小时或每周超过 40 小时为加班（150%）；休息日 200%，法定节假日 300%；每月加班不超过 36 小时。',
    ded_pension: '养老保险（个人）',
    ded_medical: '医疗保险（个人）',
    ded_unemployment: '失业保险（个人）',
    ded_housing_fund: '住房公积金（个人）',
    ded_iit: '个人所得税',
    ext_hotline12333: '12333 人社服务热线',
    ext_hotline12338: '12338 妇女维权公益服务热线',
    limit_cnMonth: '本月加班（上限 36 小时）',
    limit_cnDay: '今天加班（上限 3 小时）',
    studentRule:
      '国际学生须经学校同意并在居留许可上注明后才能兼职。非全日制用工平均每天不超过4小时、每周不超过24小时(《劳动合同法》第68条)。16至18岁的未成年工不得从事有毒有害等禁忌劳动。',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to the labour inspection office or your union, or call 12333.',
    leaveBody: 'Ask for leave or a work-from-home day. Every decision is sealed into your record.',
    balanceCasual: 'Personal leave',
    balanceSick: 'Sick leave',
    balanceEarned: 'Annual leave',
    balanceCompOff: 'Time off in lieu',
    typeCasual: 'Personal leave (unpaid)',
    typeSick: 'Sick leave',
    typeEarned: 'Paid annual leave',
    typeCompOff: 'Time off in lieu (tiaoxiu)',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Work from home',
    compOffNote:
      'Rest-day overtime can be given back as time off in lieu; if not, it is paid at no less than 200%.',
    leaveLawNote:
      'Annual leave by total working years: 5 days from 1 to under 10 years, 10 days from 10 to under 20, 15 days from 20 (Regulations on Paid Annual Leave, Art. 3).',
    complaintEntry: 'Raise a confidential harassment complaint',
    complaintEntrySub: 'Only the people your employer has named to handle complaints see it.',
    complaintTitle: 'Confidential complaint',
    complaintBody:
      'This goes only to the named complaint handlers, not to your manager or the owner. You can choose handlers who must not see it. Unfavourable treatment for complaining is unlawful.',
    committeeLabel: 'Sexual harassment complaint handlers',
    presiding: 'lead',
    noCommittee:
      'Your employer has not named complaint handlers yet. You can still send this, and the owner will be told a complaint channel is required. You can also call the 12338 women’s rights hotline or 12333.',
    excludeLabel: 'Handlers who must not see this',
    lawNote:
      'Employers must have rules to prevent and deal with sexual harassment and a working complaint channel (Women’s Rights Protection Law, Art. 25).',
    committeeInbox: 'Complaints inbox',
    handlerSelf: 'I handle harassment complaints',
    handlerMember: 'Handles harassment complaints',
    handlerSectionBody:
      'Every employer must have a way to receive and handle sexual harassment complaints, name who handles them and tell employees.',
    flagNoHandler: 'No harassment complaint channel',
    serviceFromLabel: 'Started working (total years count)',
    overtimeRule:
      'Overtime beyond 8 hours a day or 40 a week (150%); rest days 200%; public holidays 300%; no more than 36 overtime hours a month.',
    ded_pension: 'Pension insurance (employee)',
    ded_medical: 'Medical insurance (employee)',
    ded_unemployment: 'Unemployment insurance (employee)',
    ded_housing_fund: 'Housing provident fund (employee)',
    ded_iit: 'Individual income tax',
    ext_hotline12333: '12333 human resources and social security hotline',
    ext_hotline12338: '12338 women’s rights hotline',
    limit_cnMonth: 'Overtime this month (cap: 36 h)',
    limit_cnDay: 'Overtime today (cap: 3 h)',
    studentRule:
      'International students need their university’s approval, noted on their residence permit, before working. Part-time employment is at most 4 hours a day on average and 24 a week (Labour Contract Law, Art. 68). Workers aged 16–18 are kept from hazardous work.',
  },
};
