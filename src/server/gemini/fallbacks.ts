import type {
  Language,
  SectorId,
  HazardType,
  SeverityLevel,
  PayslipCalculationResult,
} from '../../shared/types.js';
import { recentWeekdays } from './prompts.js';
import { baseOf, localeOf, type BaseLanguage } from '../../shared/languages.js';

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

/** Ground-truth numbers for a payslip: the only numbers an explanation may use. */
export function payFactsOf(payslip: PayslipCalculationResult): Record<string, number> {
  const facts: Record<string, number> = {
    normalHours: payslip.normalHours,
    otHours: payslip.otHours,
    claimedOtHours: payslip.claimedOtHours,
    hourlyRate: payslip.hourlyRate,
    grossPay: payslip.grossPay,
    totalDeductions: payslip.totalDeductions,
    netPay: payslip.netPay,
    flaggedDeductionsCount: payslip.flaggedDeductionsCount,
  };
  for (const line of payslip.lines) {
    if (line.kind === 'net' || line.kind === 'deduction') continue;
    const key = line.id.replace(/^line-/, '').replace(/[^a-z0-9]+/gi, '_');
    facts[`${key}_amount`] = line.amount;
    if (line.hours !== undefined) facts[`${key}_hours`] = line.hours;
    if (line.rate !== undefined) facts[`${key}_rate`] = line.rate;
    if (line.multiplier !== undefined) facts[`${key}_multiplier`] = line.multiplier;
  }
  return facts;
}

const EXTRA_KINDS = new Set([
  'overtime',
  'rest_day',
  'holiday',
  'seventh_day',
  'night',
  'sunday',
  'weekly_rest',
  'claim_overtime',
]);

/** A plain explanation built only from the payslip, used when the AI is unavailable or wrong. */
export function buildTemplatePayExplanation(
  payslip: PayslipCalculationResult,
  lang: Language
): {
  answer: string;
  citedFacts: { ref: string; value: number }[];
} {
  const facts = payFactsOf(payslip);
  const m = (n: number) =>
    new Intl.NumberFormat(localeOf(lang), { style: 'currency', currency: payslip.currency }).format(
      n
    );
  const extra = payslip.lines.filter((l) => EXTRA_KINDS.has(l.kind));
  const extraAmt = extra.reduce((n, l) => n + l.amount, 0);
  const net = m(payslip.netPay);
  const gross = m(payslip.grossPay);
  const ded = m(payslip.totalDeductions);
  const x = m(extraAmt);
  const T: Record<BaseLanguage, string> = {
    en: `Your net pay is ${net}: ${gross} before deductions, including ${x} for overtime and other premium hours, minus ${ded} in deductions.`,
    ta: `உங்கள் நிகர சம்பளம் ${net}: பிடித்தத்திற்கு முன் ${gross}, இதில் ஓவர்டைம் மற்றும் கூடுதல் நேரத்திற்கு ${x}; பிடித்தம் ${ded}.`,
    hi: `आपका शुद्ध वेतन ${net} है: कटौती से पहले ${gross}, जिसमें ओवरटाइम और अतिरिक्त घंटों के ${x} शामिल हैं; कटौती ${ded}।`,
    es: `Tu pago neto es ${net}: ${gross} antes de deducciones, con ${x} por horas extra y otros recargos, menos ${ded} de deducciones.`,
    fr: `Votre salaire net est de ${net} : ${gross} avant retenues, dont ${x} d’heures supplémentaires et de majorations, moins ${ded} de retenues.`,
    de: `Ihr Nettolohn beträgt ${net}: ${gross} vor Abzügen, davon ${x} für Überstunden und Zuschläge, abzüglich ${ded}.`,
    pt: `O seu pagamento líquido é ${net}: ${gross} antes dos descontos, com ${x} de horas extras e adicionais, menos ${ded} de descontos.`,
    ja: `差引支給額は ${net} です。総支給額 ${gross}(うち残業・割増分 ${x})から、控除 ${ded} を差し引いています。`,
    zh: `你的实发工资是 ${net}:应发 ${gross}(其中加班及各类加给 ${x}),扣除 ${ded}。`,
    ko: `실수령액은 ${net}입니다. 공제 전 ${gross}(초과·가산 수당 ${x} 포함)에서 공제 ${ded}을(를) 뺀 금액입니다.`,
  };
  return {
    answer: T[baseOf(lang)],
    citedFacts: [
      { ref: 'netPay', value: facts.netPay },
      { ref: 'grossPay', value: facts.grossPay },
      { ref: 'totalDeductions', value: facts.totalDeductions },
    ],
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
