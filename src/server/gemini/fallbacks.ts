import type {
  Language,
  SectorId,
  HazardType,
  SeverityLevel,
  PayslipCalculationResult,
} from '../../shared/types.js';
import { recentWeekdays } from './prompts.js';

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
  const isTamil = /[\u0B80-\u0BFF]/.test(text ?? '');
  const isHindi = /[\u0900-\u097F]/.test(text ?? '');
  const detectedLanguage: Language = isTamil ? 'ta' : isHindi ? 'hi' : lang;

  let extraHours = 2;
  const numMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|மணி|घंटे)/i);
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

  // Weekday words in English, Tamil and Hindi, resolved to the most recent past date.
  const recent = recentWeekdays(todayIso);
  const words: [string, string[]][] = [
    ['Sunday', ['sunday', 'ஞாயிறு', 'रविवार']],
    ['Monday', ['monday', 'திங்கள்', 'सोमवार']],
    ['Tuesday', ['tuesday', 'செவ்வாய்', 'मंगलवार']],
    ['Wednesday', ['wednesday', 'புதன்', 'बुधवार']],
    ['Thursday', ['thursday', 'வியாழன்', 'गुरुवार']],
    ['Friday', ['friday', 'வெள்ளி', 'शुक्रवार']],
    ['Saturday', ['saturday', 'சனி', 'शनिवार']],
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
  const isTamil = /[\u0B80-\u0BFF]/.test(text ?? '');
  const isHindi = /[\u0900-\u097F]/.test(text ?? '');
  const detectedLanguage: Language = isTamil ? 'ta' : isHindi ? 'hi' : lang;

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
