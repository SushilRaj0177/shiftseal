import type { Language, SectorId } from '../../shared/types.js';
import { promptLanguageName } from '../../shared/languages.js';

export const SYSTEM_INSTRUCTION = `You are a structured extraction and plain-language assistant for Shiftseal, a decent work verification platform.
CRITICAL RULES:
1. You are strictly an assistant to the deterministic rules engine.
2. NEVER invent numbers, wage rates, shift hours, or legal section numbers.
3. Always return valid JSON matching the requested schema.`;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** The most recent date (up to 7 days back, today excluded) that fell on each weekday. */
export function recentWeekdays(todayIso: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (let back = 1; back <= 7; back++) {
    const d = new Date(`${todayIso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - back);
    out[WEEKDAY_NAMES[d.getUTCDay()]] = d.toISOString().slice(0, 10);
  }
  return out;
}

export function buildStructureClaimPrompt(todayIso: string, lang: Language): string {
  const today = WEEKDAY_NAMES[new Date(`${todayIso}T00:00:00Z`).getUTCDay()];
  const recent = recentWeekdays(todayIso);
  const table = WEEKDAY_NAMES.map((n) => `- "${n}" or "last ${n}" -> "${recent[n]}"`).join('\n');
  return `Extract a worker's overtime claim from their voice or text message.
Today's date is ${todayIso} (${today}). "Today" means ${todayIso}; "yesterday" means ${recent[WEEKDAY_NAMES[(WEEKDAY_NAMES.indexOf(today) + 6) % 7]]}.
Resolve weekday names to the most recent past date:
${table}
Never return a date after ${todayIso}.
Preferred language context: ${lang}.

Example (if last Saturday were 2026-10-24):
Input: "நேத்து சனிக்கிழமை ஸ்லாப் போடறதுக்கு ரெண்டு மணி நேரம் கூடுதலா இருந்தேன்"
Output: {"date":"2026-10-24","extraHours":2,"reason":"Concrete slab pouring overtime","detectedLanguage":"ta","confidence":0.96}`;
}

export function buildExplainPayPrompt(
  payFacts: Record<string, number>,
  lang: Language,
  currency: string
): string {
  const langName = promptLanguageName(lang);
  return `Answer the worker's question about their payslip in plain, short ${langName}. Amounts are in ${currency}.
Keys ending in _hours, _rate, _amount and _multiplier describe one payslip line each (overtime, rest-day, holiday, night or other premium work).
You MUST ONLY use numbers from the following ground-truth payFacts JSON:
${JSON.stringify(payFacts)}
Every single number you mention in your "answer" string MUST also be listed in "citedFacts" with its exact "ref" key and numeric "value" from payFacts. Do not write any other numbers (even dates or list numbers like 1, 2). Write numbers plainly, without thousands separators.

Example:
payFacts: {"normalHours":45,"otHours":4.67,"hourlyRate":100,"overtime_2_rate":200,"netPay":5084}
Output: {
  "answer": "Your net pay is 5084 for 45 normal hours at 100 per hour and 4.67 overtime hours at 200 per hour.",
  "citedFacts": [
    {"ref":"netPay","value":5084},
    {"ref":"normalHours","value":45},
    {"ref":"hourlyRate","value":100},
    {"ref":"otHours","value":4.67},
    {"ref":"overtime_2_rate","value":200}
  ]
}`;
}

export function buildStructureHazardPrompt(
  sector: SectorId,
  zoneName: string,
  lang: Language
): string {
  const langName = promptLanguageName(lang);
  return `Extract a structured workplace safety hazard report for sector "${sector}" in zone "${zoneName}".
Keep "description" in ${langName} (clear and concise) and provide "englishSummary" in English for the site safety dashboard.

Example:
Input: "हॉस्टल ब्लॉक A में बिजली का तार खुला लटक रहा है"
Output: {
  "hazardType": "electrical",
  "description": "हॉस्टल ब्लॉक A के गलियारे में बिजली का खुला तार लटक रहा है।",
  "aiSeverity": "high",
  "englishSummary": "Exposed live electrical wire hanging in Hostel Block A corridor.",
  "detectedLanguage": "hi"
}`;
}

export function buildAnonymiseFeedbackPrompt(lang: Language): string {
  const langName = promptLanguageName(lang);
  return `Remove all personally identifying details (supervisor names, worker names, phone numbers, exact dates/times, specific room/gate identifiers that could identify the speaker) from this workplace feedback.
Write "cleanText" in ${langName} and "cleanTextEnglish" in English. List which categories were removed in "removed".

Example:
Input: "Supervisor Ravi shouted at me near Gate 2 at 7:15 PM when I asked about my Saturday overtime pay."
Output: {
  "cleanText": "A supervisor spoke harshly when asked about weekend overtime pay.",
  "cleanTextEnglish": "A supervisor spoke harshly when asked about weekend overtime pay.",
  "removed": ["name", "place", "time"],
  "themes": ["supervisor_conduct", "overtime_pay"],
  "sentiment": -0.75
}`;
}
