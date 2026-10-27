import type { Language, SectorId } from '../../shared/types.js';

export const SYSTEM_INSTRUCTION = `You are a structured extraction and plain-language assistant for Shiftseal, a decent work verification platform.
CRITICAL RULES:
1. You are strictly an assistant to the deterministic rules engine.
2. NEVER invent numbers, wage rates, shift hours, or legal section numbers.
3. Always return valid JSON matching the requested schema.`;

export function buildStructureClaimPrompt(todayIso: string, lang: Language): string {
  return `Extract a worker's overtime claim from their voice or text message.
Today's reference date is ${todayIso} (Tuesday).
Resolve relative dates using ${todayIso}:
- "Saturday" or "நேத்து சனிக்கிழமை" or "last Saturday" -> "2026-10-24"
- "Sunday" -> "2026-10-25"
- "Monday" or "yesterday" -> "2026-10-26"
- "Tuesday" -> "2026-10-20"
Preferred language context: ${lang}.

Example:
Input: "நேத்து சனிக்கிழமை ஸ்லாப் போடறதுக்கு ரெண்டு மணி நேரம் கூடுதலா இருந்தேன்"
Output: {"date":"2026-10-24","extraHours":2,"reason":"Concrete slab pouring overtime","detectedLanguage":"ta","confidence":0.96}`;
}

export function buildExplainPayPrompt(payFacts: Record<string, number>, lang: Language): string {
  const langName = lang === 'ta' ? 'Tamil (தமிழ்)' : lang === 'hi' ? 'Hindi (हिंदी)' : 'English';
  return `Answer the worker's question about their weekly payslip in plain, short ${langName}.
You MUST ONLY use numbers from the following ground-truth payFacts JSON:
${JSON.stringify(payFacts)}
Every single number you mention in your "answer" string MUST also be listed in "citedFacts" with its exact "ref" key and numeric "value" from payFacts. Do not write any other numbers (even dates or list numbers like 1, 2).

Example:
payFacts: {"normalHours":45,"otHours":4.67,"hourlyRate":100,"otRate":200,"netPay":5084}
Output: {
  "answer": "Your net pay is ₹5084 for 45 normal hours at ₹100 per hour and 4.67 overtime hours at ₹200 per hour.",
  "citedFacts": [
    {"ref":"netPay","value":5084},
    {"ref":"normalHours","value":45},
    {"ref":"hourlyRate","value":100},
    {"ref":"otHours","value":4.67},
    {"ref":"otRate","value":200}
  ]
}`;
}

export function buildStructureHazardPrompt(
  sector: SectorId,
  zoneName: string,
  lang: Language
): string {
  const langName = lang === 'ta' ? 'Tamil (தமிழ்)' : lang === 'hi' ? 'Hindi (हिंदी)' : 'English';
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
  const langName = lang === 'ta' ? 'Tamil (தமிழ்)' : lang === 'hi' ? 'Hindi (हिंदी)' : 'English';
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
