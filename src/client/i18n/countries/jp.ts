import type { CountryStrings } from '../country.js';

/** Japan: 年次有給休暇, 代休, the 36 agreement, and the harassment 相談窓口. */
export const JP_TEXT: CountryStrings = {
  ja: {
    recordBroken:
      'この記録は一致しません。この画面を労働基準監督署または労働組合に見せてください。',
    leaveBody: '休暇や在宅勤務を申請できます。承認・却下はすべてあなたの記録に封印されます。',
    balanceCasual: '特別休暇',
    balanceSick: '病気休暇',
    balanceEarned: '年休',
    balanceCompOff: '代休',
    typeCasual: '特別休暇(慶弔など)',
    typeSick: '病気休暇',
    typeEarned: '年次有給休暇',
    typeCompOff: '代休・振替休日',
    typeUnpaid: '欠勤(無給)',
    typeWfh: '在宅勤務',
    compOffNote:
      '承認された時間外労働は代休になります。法定休日に働いた分の割増(35%)は、代休を取っても支払われます。',
    leaveLawNote:
      '年次有給休暇は6か月勤務で10日、勤続に応じて最大20日です。会社には年5日以上を確実に取得させる義務があります(労働基準法第39条)。',
    complaintEntry: 'ハラスメントの相談',
    complaintEntrySub: 'パワハラ・セクハラなど。相談窓口の担当者だけが見られます。',
    complaintTitle: '相談・申し立て(秘密厳守)',
    complaintBody:
      '職場のハラスメント相談窓口の担当者にだけ届き、上司やオーナーには届きません。見せたくない担当者を選べます。相談したことを理由とする不利益な取扱いは法律で禁止されています。',
    committeeLabel: 'ハラスメント相談窓口',
    presiding: '責任者',
    noCommittee:
      'この職場ではまだ相談窓口の担当者が決まっていません。このまま送ることができ、窓口の設置が義務であることがオーナーに伝わります。都道府県労働局の総合労働相談コーナーにも相談できます。',
    excludeLabel: 'この相談を見せない担当者',
    lawNote:
      '事業主には、相談に応じて適切に対応する体制を整える義務があります(労働施策総合推進法第30条の2、男女雇用機会均等法第11条)。',
    committeeInbox: '相談窓口の受信箱',
    handlerSelf: '私は相談窓口の担当者です',
    handlerMember: '相談窓口の担当者',
    handlerSectionBody:
      'すべての事業主は、パワハラ・セクハラの相談窓口を設け、担当者を決めて従業員に周知する必要があります(2022年4月から中小企業も義務)。',
    flagNoHandler: 'ハラスメント相談窓口が未設置',
    serviceFromLabel: '入社日',
    overtimeRule:
      '1日8時間・週40時間を超えると時間外労働(25%増、月60時間超は50%増)。22時〜5時は深夜割増25%。',
    ded_health_insurance: '健康保険',
    ded_pension: '厚生年金保険',
    ded_employment_insurance: '雇用保険',
    ded_care_insurance: '介護保険',
    ded_income_tax: '所得税(源泉徴収)',
    ded_resident_tax: '住民税',
    ext_soudanCorner: '総合労働相談コーナー(都道府県労働局)',
    ext_kantokusho: '労働基準監督署',
    limit_jpMonth: '今月の残業(36協定の上限 45時間)',
    limit_jpYear: '今年の残業(上限 360時間)',
    limit_jpAbsolute: '残業+休日労働(月100時間未満)',
    studentRule:
      '留学生は、すべての勤務先の合計で週28時間まで、学則で定める長期休業中は1日8時間まで(入管法第19条)。18歳未満は時間外・休日労働と22時〜5時の深夜業が禁止です(労働基準法第60・61条)。',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to the Labour Standards Inspection Office or your union.',
    leaveBody: 'Ask for leave or a work-from-home day. Every decision is sealed into your record.',
    balanceCasual: 'Special leave',
    balanceSick: 'Sick leave',
    balanceEarned: 'Annual paid leave',
    balanceCompOff: 'Substitute day off',
    typeCasual: 'Special leave (family events)',
    typeSick: 'Sick leave',
    typeEarned: 'Annual paid leave (nenkyū)',
    typeCompOff: 'Substitute day off',
    typeUnpaid: 'Unpaid absence',
    typeWfh: 'Work from home',
    compOffNote:
      'Approved extra hours become a substitute day off. The 35% premium for work on the legal rest day is still paid.',
    leaveLawNote:
      'Annual paid leave: 10 days after 6 months, rising with service to 20. Your employer must make sure you take at least 5 days a year (Labour Standards Act, Art. 39).',
    complaintEntry: 'Harassment consultation',
    complaintEntrySub: 'Power or sexual harassment. Only the consultation desk staff see it.',
    complaintTitle: 'Confidential consultation',
    complaintBody:
      "This goes only to your workplace's harassment consultation desk, not to your manager or the owner. You can choose staff who must not see it. Treating you unfavourably for asking for help is prohibited by law.",
    committeeLabel: 'Harassment consultation desk',
    presiding: 'lead',
    noCommittee:
      "Your workplace has not named consultation desk staff yet. You can still send this, and the owner will be told a desk is required. You can also contact the prefectural Labour Bureau's General Labour Consultation Corner.",
    excludeLabel: 'Staff who must not see this',
    lawNote:
      'Employers must have a system to hear and properly handle harassment complaints (Comprehensive Labour Policy Promotion Act, Art. 30-2; Equal Employment Opportunity Act, Art. 11).',
    committeeInbox: 'Consultation inbox',
    handlerSelf: 'I am on the consultation desk',
    handlerMember: 'Consultation desk staff',
    handlerSectionBody:
      'Every employer must set up a consultation desk for power and sexual harassment, name its staff and tell employees (small firms too, since April 2022).',
    flagNoHandler: 'No harassment consultation desk',
    serviceFromLabel: 'Hire date',
    overtimeRule:
      'Overtime beyond 8 hours a day or 40 a week (+25%, +50% beyond 60 hours a month). 22:00–5:00 adds a 25% night premium.',
    ded_health_insurance: 'Health insurance',
    ded_pension: "Employees' pension insurance",
    ded_employment_insurance: 'Employment insurance',
    ded_care_insurance: 'Long-term care insurance',
    ded_income_tax: 'Income tax (withheld)',
    ded_resident_tax: 'Resident tax',
    ext_soudanCorner: 'General Labour Consultation Corner (Labour Bureau)',
    ext_kantokusho: 'Labour Standards Inspection Office',
    limit_jpMonth: 'Overtime this month (36 agreement cap: 45 h)',
    limit_jpYear: 'Overtime this year (cap: 360 h)',
    limit_jpAbsolute: 'Overtime + rest-day work (under 100 h a month)',
    studentRule:
      'International students: 28 hours a week across all jobs, 8 hours a day in official long breaks (Immigration Control Act, Art. 19). Under 18: no overtime, no rest-day work, no work 22:00–5:00 (Labour Standards Act, Arts. 60–61).',
  },
};
