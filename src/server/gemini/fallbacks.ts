import type {
  Language,
  SectorId,
  HazardType,
  SeverityLevel,
  PayslipCalculationResult,
} from '../../shared/types.js';
import { recentWeekdays } from './prompts.js';

/** Guesses the language from its script; Latin-script text keeps the app's language. */
export function detectScript(text: string | undefined, lang: Language): Language {
  const t = text ?? '';
  if (/[\u0B80-\u0BFF]/.test(t)) return 'ta';
  if (/[\u0900-\u097F]/.test(t)) return 'hi';
  if (/[\u3040-\u30FF]/.test(t)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(t)) return 'ko';
  if (/[\u4E00-\u9FFF]/.test(t)) return lang === 'ja' ? 'ja' : 'zh';
  return lang;
}

export function buildFallbackStructuredClaim(
  text: string | undefined,
  lang: Language,
  todayIso: string
): {
  date: string;
  extraHours: number;
  reason: string;
  detectedLanguage: Language;
  confidence: number;
} {
  const raw = (text ?? '').toLowerCase();
  const detectedLanguage = detectScript(text, lang);

  let extraHours = 2;
  const numMatch = raw.match(
    /(\d+(?:\.\d+)?)\s*(?:hour|hr|மணி|घंटे|hora|heure|stunde|std|時間|小时|个小时|시간)/i
  );
  if (numMatch) {
    extraHours = Math.min(12, Math.max(0.5, Number(numMatch[1])));
  } else if (
    raw.includes('ரெண்டு') ||
    raw.includes('இரண்டு') ||
    raw.includes('दो') ||
    raw.includes('two')
  ) {
    extraHours = 2;
  } else if (raw.includes('மூன்று') || raw.includes('तीन') || raw.includes('three')) {
    extraHours = 3;
  }

  // Weekday words in every supported language, resolved to the most recent past date.
  const recent = recentWeekdays(todayIso);
  const words: [string, string[]][] = [
    [
      'Sunday',
      [
        'sunday',
        'ஞாயிறு',
        'रविवार',
        'domingo',
        'dimanche',
        'sonntag',
        '日曜',
        '星期日',
        '周日',
        '일요일',
      ],
    ],
    [
      'Monday',
      [
        'monday',
        'திங்கள்',
        'सोमवार',
        'lunes',
        'lundi',
        'montag',
        'segunda',
        '月曜',
        '星期一',
        '周一',
        '월요일',
      ],
    ],
    [
      'Tuesday',
      [
        'tuesday',
        'செவ்வாய்',
        'मंगलवार',
        'martes',
        'mardi',
        'dienstag',
        'terça',
        '火曜',
        '星期二',
        '周二',
        '화요일',
      ],
    ],
    [
      'Wednesday',
      [
        'wednesday',
        'புதன்',
        'बुधवार',
        'miércoles',
        'mercredi',
        'mittwoch',
        'quarta',
        '水曜',
        '星期三',
        '周三',
        '수요일',
      ],
    ],
    [
      'Thursday',
      [
        'thursday',
        'வியாழன்',
        'गुरुवार',
        'jueves',
        'jeudi',
        'donnerstag',
        'quinta',
        '木曜',
        '星期四',
        '周四',
        '목요일',
      ],
    ],
    [
      'Friday',
      [
        'friday',
        'வெள்ளி',
        'शुक्रवार',
        'viernes',
        'vendredi',
        'freitag',
        'sexta',
        '金曜',
        '星期五',
        '周五',
        '금요일',
      ],
    ],
    [
      'Saturday',
      [
        'saturday',
        'சனி',
        'शनिवार',
        'sábado',
        'samedi',
        'samstag',
        '土曜',
        '星期六',
        '周六',
        '토요일',
      ],
    ],
  ];
  const hit = words.find(([, ws]) => ws.some((w) => raw.includes(w)));
  const date = hit ? recent[hit[0]] : todayIso;

  // Without the AI, keep the worker's own words rather than inventing a reason.
  const reason = text && text.trim().length > 0 ? text.trim().slice(0, 180) : 'Extra hours';

  return {
    date,
    extraHours,
    reason,
    detectedLanguage,
    // Keyword matching is a guess: low confidence makes the app ask the worker to check it.
    confidence: 0.4,
  };
}

export function buildTemplatePayExplanation(
  payslip: PayslipCalculationResult,
  lang: Language
): {
  answer: string;
  citedFacts: { ref: string; value: number }[];
} {
  const otRate = Math.round(payslip.hourlyRate * 2 * 100) / 100;
  const citedFacts = [
    { ref: 'normalHours', value: payslip.normalHours },
    { ref: 'otHours', value: payslip.otHours },
    { ref: 'hourlyRate', value: payslip.hourlyRate },
    { ref: 'otRate', value: otRate },
    { ref: 'totalDeductions', value: payslip.totalDeductions },
    { ref: 'netPay', value: payslip.netPay },
  ];

  if (lang === 'ta') {
    return {
      answer: `உங்கள் நிகர சம்பளம் ₹${payslip.netPay}. சாதாரண பணி நேரம் ${payslip.normalHours} மணி (மணிக்கு ₹${payslip.hourlyRate}), ஓவர்டைம் ${payslip.otHours} மணி (மணிக்கு ₹${otRate} இருமடங்கு விகிதம்), மற்றும் பிடித்தம் ₹${payslip.totalDeductions}.`,
      citedFacts,
    };
  }

  if (lang === 'hi') {
    return {
      answer: `आपका कुल शुद्ध वेतन ₹${payslip.netPay} है। सामान्य कार्य ${payslip.normalHours} घंटे (₹${payslip.hourlyRate} प्रति घंटा), ओवरटाइम ${payslip.otHours} घंटे (दोगुनी दर ₹${otRate} प्रति घंटा), और कुल कटौती ₹${payslip.totalDeductions} है।`,
      citedFacts,
    };
  }

  const p = payslip;
  const other: Partial<Record<Language, string>> = {
    es: `Tu pago neto es ₹${p.netPay}: ${p.normalHours} horas normales a ₹${p.hourlyRate}/h, ${p.otHours} horas extra a la tarifa legal doble de ₹${otRate}/h, menos ₹${p.totalDeductions} de deducciones.`,
    fr: `Votre salaire net est de ₹${p.netPay} : ${p.normalHours} heures normales à ₹${p.hourlyRate}/h, ${p.otHours} heures supplémentaires au taux légal double de ₹${otRate}/h, moins ₹${p.totalDeductions} de retenues.`,
    de: `Ihr Nettolohn beträgt ₹${p.netPay}: ${p.normalHours} reguläre Stunden zu ₹${p.hourlyRate}/h, ${p.otHours} Überstunden zum gesetzlichen doppelten Satz von ₹${otRate}/h, abzüglich ₹${p.totalDeductions} Abzüge.`,
    pt: `Seu salário líquido é ₹${p.netPay}: ${p.normalHours} horas normais a ₹${p.hourlyRate}/h, ${p.otHours} horas extras pela taxa legal em dobro de ₹${otRate}/h, menos ₹${p.totalDeductions} de descontos.`,
    ja: `差引支給額は ₹${p.netPay} です。通常勤務 ${p.normalHours} 時間(時給 ₹${p.hourlyRate})、残業 ${p.otHours} 時間(法定の倍額 ₹${otRate}/時)、控除 ₹${p.totalDeductions} です。`,
    zh: `你的实发工资是 ₹${p.netPay}:正常工时 ${p.normalHours} 小时(每小时 ₹${p.hourlyRate}),加班 ${p.otHours} 小时(法定双倍 ₹${otRate}/小时),扣款 ₹${p.totalDeductions}。`,
    ko: `실수령액은 ₹${p.netPay}입니다. 기본 근무 ${p.normalHours}시간(시간당 ₹${p.hourlyRate}), 초과 근무 ${p.otHours}시간(법정 두 배 ₹${otRate}/시간), 공제 ₹${p.totalDeductions}입니다.`,
  };
  const answer = other[lang];
  if (answer) return { answer, citedFacts };

  return {
    answer: `Your net pay is ₹${payslip.netPay}, calculated from ${payslip.normalHours} normal hours at ₹${payslip.hourlyRate}/hr, ${payslip.otHours} overtime hours at the statutory double rate of ₹${otRate}/hr, minus ₹${payslip.totalDeductions} in deductions.`,
    citedFacts,
  };
}

export function buildFallbackHazard(
  text: string | undefined,
  sector: SectorId,
  lang: Language
): {
  hazardType: HazardType;
  description: string;
  aiSeverity: SeverityLevel;
  englishSummary: string;
  detectedLanguage: Language;
} {
  const raw = (text ?? '').toLowerCase();
  const detectedLanguage = detectScript(text, lang);

  // Unknown until a keyword matches; the worker confirms the type before sending.
  let hazardType: HazardType = 'other';
  let aiSeverity: SeverityLevel = 'medium'; // The severity floor can still raise it.

  if (
    raw.includes('wire') ||
    raw.includes('electric') ||
    raw.includes('बिजली') ||
    raw.includes('तार') ||
    raw.includes('மின்சார') ||
    raw.includes('வயர்')
  ) {
    hazardType = 'electrical';
    aiSeverity = 'medium';
  } else if (
    raw.includes('scaffold') ||
    raw.includes('சாரக்கட்டு') ||
    raw.includes('ஸ்காஃபோல்ட்') ||
    raw.includes('கைப்பிடி') ||
    raw.includes('स्कैफोल्ड') ||
    raw.includes('plank')
  ) {
    hazardType = sector === 'construction' ? 'scaffold' : 'fall_from_height';
    aiSeverity = 'medium';
  } else if (raw.includes('gas') || raw.includes('கேஸ்') || raw.includes('गैस')) {
    hazardType = sector === 'campus' ? 'gas_leak' : 'fire';
    aiSeverity = 'high';
  } else if (raw.includes('fall') || raw.includes('rope') || raw.includes('harness')) {
    hazardType = 'fall_from_height';
    aiSeverity = 'medium';
  }

  const trimmed = (text ?? '').trim();
  const description = trimmed.length > 0 ? trimmed.slice(0, 500) : 'Voice report (not transcribed)';

  const englishSummary = trimmed.length > 0 ? trimmed.slice(0, 500) : description;

  return {
    hazardType,
    description,
    aiSeverity,
    englishSummary,
    detectedLanguage,
  };
}
