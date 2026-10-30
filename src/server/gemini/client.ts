import { AppError } from '../middleware/errors.js';
import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type {
  Language,
  SectorId,
  PayslipCalculationResult,
  HazardType,
  SeverityLevel,
  RemovedPiiCategory,
  FeedbackTheme,
} from '../../shared/types.js';
import {
  structuredClaimOutputSchema,
  explainPayOutputSchema,
  structuredHazardOutputSchema,
  anonymisedFeedbackOutputSchema,
} from '../../shared/schemas.js';
import { check } from '../../shared/rules/factcheck.js';
import { LANGUAGE_CODES } from '../../shared/languages.js';
import {
  SYSTEM_INSTRUCTION,
  buildStructureClaimPrompt,
  buildExplainPayPrompt,
  buildStructureHazardPrompt,
  buildAnonymiseFeedbackPrompt,
} from './prompts.js';
import {
  buildFallbackStructuredClaim,
  buildTemplatePayExplanation,
  payFactsOf,
  buildFallbackHazard,
} from './fallbacks.js';

const TIMEOUT_MS = 15_000;
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const FALLBACK_VERTEX_MODELS = ['gemini-3.5-flash'];

type CustomGeneratorFn = (
  operation: string,
  input: { text?: string; audioBase64?: string; audioMimeType?: string }
) => Promise<unknown>;
let customGeneratorForTests: CustomGeneratorFn | null = null;

export function setGeminiGeneratorForTests(fn: CustomGeneratorFn | null): void {
  customGeneratorForTests = fn;
}

export function getModelName(): string {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

function getGenAiClient(): GoogleGenAI | null {
  if (process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true') {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'promptwars-512900';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';
    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || apiKey === 'YOUR_GEMINI_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function logSafeGeminiFailure(operation: string, err: unknown): void {
  const errorName = err instanceof Error ? err.name : typeof err;
  const statusObj = err as { status?: number; statusCode?: number; code?: string | number } | null;
  const statusCode = statusObj?.status ?? statusObj?.statusCode ?? statusObj?.code ?? 'unknown';
  console.error(`[Gemini Failure] op=${operation} type=${errorName} status=${String(statusCode)}`);
}

async function callGeminiWithRetry(
  operation: string,
  prompt: string,
  responseSchema: Schema,
  input: { text?: string; audioBase64?: string; audioMimeType?: string }
): Promise<unknown> {
  if (customGeneratorForTests) {
    return customGeneratorForTests(operation, input);
  }
  const ai = getGenAiClient();
  if (!ai) {
    throw new Error('NO_GENAI_CREDENTIALS');
  }

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: prompt },
  ];

  if (input.text) {
    parts.push({ text: `User input: ${input.text}` });
  }
  if (input.audioBase64) {
    parts.push({
      inlineData: {
        data: input.audioBase64,
        mimeType: input.audioMimeType || 'audio/webm',
      },
    });
  }

  let lastError: unknown;
  const candidateModels = [getModelName(), ...FALLBACK_VERTEX_MODELS];

  for (let attempt = 0; attempt < 2; attempt++) {
    const modelToUse = candidateModels[Math.min(attempt, candidateModels.length - 1)];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.1,
          abortSignal: controller.signal,
        },
      });
      clearTimeout(timer);
      const rawText = response.text;
      if (!rawText) {
        throw new Error('EMPTY_GEMINI_RESPONSE');
      }
      return JSON.parse(rawText);
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      logSafeGeminiFailure(`${operation}_model_${modelToUse}_attempt_${attempt + 1}`, err);
    }
  }
  throw lastError;
}

export async function structureClaim(
  input: { text?: string; audioBase64?: string; audioMimeType?: string },
  lang: Language,
  todayIso: string
): Promise<{
  date: string;
  extraHours: number;
  reason: string;
  detectedLanguage: Language;
  confidence: number;
  isDemoFallback: boolean;
}> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'ISO date YYYY-MM-DD' },
      extraHours: { type: Type.NUMBER, description: 'Number of extra overtime hours claimed' },
      reason: { type: Type.STRING, description: 'Short summary of work done during overtime' },
      detectedLanguage: { type: Type.STRING, enum: [...LANGUAGE_CODES] },
      confidence: { type: Type.NUMBER },
    },
    required: ['date', 'extraHours', 'reason', 'detectedLanguage', 'confidence'],
  };

  try {
    const raw = await callGeminiWithRetry(
      'structureClaim',
      buildStructureClaimPrompt(todayIso, lang),
      schema,
      input
    );
    const parsed = structuredClaimOutputSchema.parse(raw);
    return { ...parsed, isDemoFallback: false };
  } catch (err) {
    logSafeGeminiFailure('structureClaim_fallback', err);
    const fallback = buildFallbackStructuredClaim(input.text, lang, todayIso);
    return { ...fallback, isDemoFallback: true };
  }
}

export async function explainPay(
  input: { question?: string; audioBase64?: string; audioMimeType?: string },
  payslip: PayslipCalculationResult,
  lang: Language
): Promise<{
  answer: string;
  citedFacts: { ref: string; value: number }[];
  verificationStatus: 'checked' | 'template_fallback';
  isDemoFallback: boolean;
}> {
  const truthMap = payFactsOf(payslip);

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      answer: { type: Type.STRING },
      citedFacts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ref: { type: Type.STRING },
            value: { type: Type.NUMBER },
          },
          required: ['ref', 'value'],
        },
      },
    },
    required: ['answer', 'citedFacts'],
  };

  try {
    const raw = await callGeminiWithRetry(
      'explainPay',
      buildExplainPayPrompt(truthMap, lang, payslip.currency),
      schema,
      {
        text: input.question,
        audioBase64: input.audioBase64,
        audioMimeType: input.audioMimeType,
      }
    );
    const parsed = explainPayOutputSchema.parse(raw);
    const factCheckResult = check(parsed.citedFacts, truthMap, parsed.answer);
    if (!factCheckResult.passed) {
      const tpl = buildTemplatePayExplanation(payslip, lang);
      return {
        ...tpl,
        verificationStatus: 'template_fallback',
        isDemoFallback: false,
      };
    }
    return {
      answer: parsed.answer,
      citedFacts: parsed.citedFacts,
      verificationStatus: 'checked',
      isDemoFallback: false,
    };
  } catch (err) {
    logSafeGeminiFailure('explainPay_fallback', err);
    const tpl = buildTemplatePayExplanation(payslip, lang);
    return {
      ...tpl,
      verificationStatus: 'template_fallback',
      isDemoFallback: true,
    };
  }
}

export async function structureHazard(
  input: { text?: string; audioBase64?: string; audioMimeType?: string },
  sector: SectorId,
  zoneName: string,
  lang: Language
): Promise<{
  hazardType: HazardType;
  description: string;
  aiSeverity: SeverityLevel;
  englishSummary: string;
  detectedLanguage: Language;
  isDemoFallback: boolean;
}> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      hazardType: {
        type: Type.STRING,
        enum: [
          'electrical',
          'fall_from_height',
          'scaffold',
          'structural_collapse',
          'crane_lifting',
          'fire',
          'ppe_missing',
          'heat_water',
          'housekeeping',
          'gas_leak',
          'chemical_lab',
          'violence_weapon',
          'sanitation_water',
          'lighting_pathway',
          'equipment_fault',
          'other',
        ],
      },
      description: { type: Type.STRING },
      aiSeverity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
      englishSummary: { type: Type.STRING },
      detectedLanguage: { type: Type.STRING, enum: [...LANGUAGE_CODES] },
    },
    required: ['hazardType', 'description', 'aiSeverity', 'englishSummary', 'detectedLanguage'],
  };

  try {
    const raw = await callGeminiWithRetry(
      'structureHazard',
      buildStructureHazardPrompt(sector, zoneName, lang),
      schema,
      input
    );
    const parsed = structuredHazardOutputSchema.parse(raw);
    return { ...parsed, isDemoFallback: false };
  } catch (err) {
    logSafeGeminiFailure('structureHazard_fallback', err);
    const fallback = buildFallbackHazard(input.text, sector, lang);
    return { ...fallback, isDemoFallback: true };
  }
}

export async function anonymiseFeedback(
  input: { text?: string; audioBase64?: string; audioMimeType?: string },
  lang: Language
): Promise<{
  cleanText: string;
  cleanTextEnglish: string;
  removed: RemovedPiiCategory[];
  themes: FeedbackTheme[];
  sentiment: number;
  isDemoFallback: boolean;
}> {
  // Never log input.text or input.audioBase64
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      cleanText: { type: Type.STRING },
      cleanTextEnglish: { type: Type.STRING },
      removed: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          enum: ['name', 'place', 'time', 'phone_id', 'personal_detail'],
        },
      },
      themes: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          enum: [
            'overtime_pay',
            'supervisor_conduct',
            'rest_breaks',
            'safety_gear',
            'drinking_water_toilets',
            'shift_scheduling',
            'other',
          ],
        },
      },
      sentiment: { type: Type.NUMBER },
    },
    required: ['cleanText', 'cleanTextEnglish', 'removed', 'themes', 'sentiment'],
  };

  try {
    const raw = await callGeminiWithRetry(
      'anonymiseFeedback',
      buildAnonymiseFeedbackPrompt(lang),
      schema,
      input
    );
    const parsed = anonymisedFeedbackOutputSchema.parse(raw);
    return { ...parsed, isDemoFallback: false };
  } catch (err) {
    // Without the model we cannot reliably remove names and places, so nothing is saved.
    logSafeGeminiFailure('anonymiseFeedback_unavailable', err);
    throw new AppError(
      503,
      'ANONYMISER_UNAVAILABLE',
      'We could not make your message anonymous right now. Nothing was saved. Please try again in a few minutes.'
    );
  }
}
