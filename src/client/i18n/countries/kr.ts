import type { CountryStrings } from '../country.js';

/** South Korea: 연차, 보상휴가, the 52-hour week, 주휴수당 and workplace harassment reporting. */
export const KR_TEXT: CountryStrings = {
  ko: {
    recordBroken:
      '이 기록이 일치하지 않습니다. 이 화면을 관할 지방고용노동관서의 근로감독관이나 노동조합에 보여 주세요.',
    leaveBody: '휴가나 재택근무를 신청하세요. 모든 결정은 내 기록에 봉인됩니다.',
    balanceCasual: '경조휴가',
    balanceSick: '병가',
    balanceEarned: '연차',
    balanceCompOff: '보상휴가',
    typeCasual: '경조휴가',
    typeSick: '병가',
    typeEarned: '연차 유급휴가',
    typeCompOff: '보상휴가',
    typeUnpaid: '무급휴가',
    typeWfh: '재택근무',
    compOffNote:
      '승인된 연장근로는 가산임금 대신 보상휴가로 적립됩니다(근로자대표와 서면 합의 시).',
    leaveLawNote:
      '입사 첫해에는 한 달 개근마다 1일, 1년 80% 이상 출근 시 15일, 3년차부터 2년마다 1일씩 늘어 최대 25일입니다(근로기준법 제60조).',
    complaintEntry: '직장 내 괴롭힘·성희롱 신고',
    complaintEntrySub: '지정된 신고 담당자만 볼 수 있습니다.',
    complaintTitle: '비공개 신고',
    complaintBody:
      '사업장의 신고 담당자에게만 전달되며 관리자나 대표에게는 가지 않습니다. 보지 못하게 할 담당자를 고를 수 있습니다. 신고를 이유로 한 불리한 처우는 법으로 금지됩니다.',
    committeeLabel: '괴롭힘·성희롱 신고 담당',
    presiding: '책임자',
    noCommittee:
      '사업장에서 아직 신고 담당자를 정하지 않았습니다. 그래도 보낼 수 있으며, 대표에게 담당자 지정이 필요하다고 알립니다. 고용노동부에 직접 진정할 수도 있습니다.',
    excludeLabel: '이 신고를 보면 안 되는 담당자',
    lawNote:
      '사용자는 신고를 받으면 지체 없이 객관적으로 조사하고, 피해 근로자를 보호해야 합니다(근로기준법 제76조의3).',
    committeeInbox: '신고 담당 받은편지함',
    handlerSelf: '나는 괴롭힘·성희롱 신고 담당자입니다',
    handlerMember: '신고 담당자',
    handlerSectionBody:
      '상시 5명 이상 사업장은 직장 내 괴롭힘 신고를 받아 지체 없이 조사해야 하며, 취업규칙에 예방·대응 절차를 두어야 합니다.',
    flagNoHandler: '괴롭힘 신고 담당자 없음',
    serviceFromLabel: '입사일',
    overtimeRule:
      '하루 8시간·주 40시간을 넘으면 연장근로(50% 가산), 주 52시간까지. 22시~6시는 야간근로 50% 가산.',
    ded_national_pension: '국민연금',
    ded_health_insurance: '건강보험',
    ded_long_term_care: '장기요양보험',
    ded_employment_insurance: '고용보험',
    ded_income_tax: '소득세',
    ded_local_income_tax: '지방소득세',
    ext_moel: '고용노동부 민원마당(진정)',
    limit_krWeek: '이번 주 근로시간(주 52시간 한도)',
    studentRule:
      '유학생(D-2): 학부생은 TOPIK 3급(3·4학년 4급) 이상이면 주중 25시간, 미달 시 10시간, 대학원생 30시간이며 주말·방학은 제한이 없습니다(시간제취업 허가 필수). 18세 미만: 1일 7시간·주 35시간, 야간·휴일근로는 본인 동의와 인가 필요(근로기준법 제69·70조).',
  },
  en: {
    recordBroken:
      'This record does not match. Show this screen to a labour inspector at the regional labour office, or your union.',
    leaveBody: 'Ask for leave or a work-from-home day. Every decision is sealed into your record.',
    balanceCasual: 'Family-event leave',
    balanceSick: 'Sick leave',
    balanceEarned: 'Annual leave',
    balanceCompOff: 'Compensatory leave',
    typeCasual: 'Family-event leave',
    typeSick: 'Sick leave',
    typeEarned: 'Annual paid leave (yeoncha)',
    typeCompOff: 'Compensatory leave',
    typeUnpaid: 'Unpaid leave',
    typeWfh: 'Work from home',
    compOffNote:
      'Approved extra hours become compensatory leave instead of premium pay (with a written agreement with the employee representative).',
    leaveLawNote:
      'One day for each full month in the first year; 15 days after a year with 80% attendance, plus 1 every 2 years from the third year, up to 25 (Labor Standards Act, Art. 60).',
    complaintEntry: 'Report harassment',
    complaintEntrySub: 'Workplace or sexual harassment. Only the designated staff see it.',
    complaintTitle: 'Confidential report',
    complaintBody:
      "This goes only to your workplace's designated staff, not to your manager or the owner. You can choose staff who must not see it. Unfavourable treatment for reporting is prohibited by law.",
    committeeLabel: 'Harassment reporting staff',
    presiding: 'lead',
    noCommittee:
      'Your workplace has not named anyone to receive reports yet. You can still send this, and the owner will be told one is needed. You can also file a petition with the Ministry of Employment and Labor.',
    excludeLabel: 'Staff who must not see this',
    lawNote:
      'When a report is made, the employer must investigate objectively without delay and protect the person affected (Labor Standards Act, Art. 76-3).',
    committeeInbox: 'Reports inbox',
    handlerSelf: 'I receive harassment reports',
    handlerMember: 'Receives harassment reports',
    handlerSectionBody:
      'Workplaces with 5 or more employees must investigate harassment reports without delay and set out prevention and response steps in their work rules.',
    flagNoHandler: 'No one to receive harassment reports',
    serviceFromLabel: 'Hire date',
    overtimeRule:
      'Overtime beyond 8 hours a day or 40 a week (+50%), up to 52 hours a week. 22:00–6:00 adds a 50% night premium.',
    ded_national_pension: 'National pension',
    ded_health_insurance: 'Health insurance',
    ded_long_term_care: 'Long-term care insurance',
    ded_employment_insurance: 'Employment insurance',
    ded_income_tax: 'Income tax',
    ded_local_income_tax: 'Local income tax',
    ext_moel: 'Ministry of Employment and Labor (petition)',
    limit_krWeek: 'Hours this week (52-hour cap)',
    studentRule:
      'International students (D-2): 25 weekday hours with TOPIK 3 (years 3–4: TOPIK 4), 10 without; graduate students 30; no cap at weekends or in vacations. A part-time work permit is needed first. Under 18: 7 hours a day, 35 a week; night and holiday work needs consent and approval (Labor Standards Act, Arts. 69–70).',
  },
};
