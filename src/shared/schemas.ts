import { z } from 'zod/v3';
import { LANGUAGE_CODES, isLanguage, normalizeLanguage } from './languages.js';
import { COUNTRY_IDS, type CountryId } from './countries/types.js';

/** A locale code; codes saved before locales had a country ("en", "es", "pt") are upgraded. */
export const languageSchema = z.preprocess(
  (v) => (typeof v === 'string' && !isLanguage(v) ? normalizeLanguage(v, v as never) : v),
  z.enum(LANGUAGE_CODES)
);
export const countrySchema = z.enum(COUNTRY_IDS as [CountryId, ...CountryId[]]);
export const sectorSchema = z.enum(['construction', 'campus', 'office', 'retail']);
export const severitySchema = z.enum(['low', 'medium', 'high', 'critical']);

// Size limits: audio <= 2 MB (approx 2.8M base64 chars), images <= 1 MB (approx 1.4M base64 chars), text <= 2000 chars
export const textInputSchema = z.string().trim().min(1).max(2000);
export const audioBase64Schema = z.string().max(2_850_000, 'Audio payload exceeds 2 MB limit');
export const imageBase64Schema = z.string().max(1_450_000, 'Image payload exceeds 1 MB limit');

export const checkInOutInputSchema = z.object({
  workerId: z.string().min(1).max(64),
  action: z.enum(['CHECK_IN', 'CHECK_OUT']),
  zoneCode: z.string().trim().min(1).max(64),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  timestamp: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  source: z.enum(['qr', 'manual', 'register_photo']).optional(),
});

export const notificationResponseSchema = z.object({
  workerId: z.string().min(1).max(64),
  notificationId: z.string().min(1).max(64),
  response: z.enum(['ok', 'disagree']),
  note: z.string().max(500).optional(),
});

// AI request & output schemas
export const aiClaimRequestSchema = z
  .object({
    workerId: z.string().min(1).max(64),
    lang: languageSchema.default('en'),
    text: textInputSchema.optional(),
    audioBase64: audioBase64Schema.optional(),
    audioMimeType: z.string().max(64).optional(),
  })
  .refine((d) => Boolean(d.text || d.audioBase64), {
    message: 'Either text or audioBase64 is required',
  });

export const structuredClaimOutputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  extraHours: z.number().min(0.25).max(16),
  reason: z.string().min(1).max(500),
  detectedLanguage: languageSchema,
  confidence: z.number().min(0).max(1),
});

export const submitClaimSchema = z.object({
  workerId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  extraHours: z.number().min(0.25).max(16),
  reason: z.string().trim().min(1).max(500),
  detectedLanguage: languageSchema.default('en'),
  isDemoFallback: z.boolean().optional(),
});

export const aiExplainPayRequestSchema = z
  .object({
    workerId: z.string().min(1).max(64),
    lang: languageSchema.default('en'),
    question: textInputSchema.optional(),
    audioBase64: audioBase64Schema.optional(),
    audioMimeType: z.string().max(64).optional(),
  })
  .refine((d) => Boolean(d.question || d.audioBase64), {
    message: 'Either question or audioBase64 is required',
  });

export const explainPayOutputSchema = z.object({
  answer: z.string().min(1).max(1500),
  citedFacts: z.array(
    z.object({
      ref: z.string().min(1).max(64),
      value: z.number(),
    })
  ),
});

export const hazardTypeSchema = z.enum([
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
]);

export const aiHazardRequestSchema = z
  .object({
    workplaceId: z.string().min(1).max(64),
    zoneId: z.string().min(1).max(64),
    lang: languageSchema.default('en'),
    text: textInputSchema.optional(),
    audioBase64: audioBase64Schema.optional(),
    audioMimeType: z.string().max(64).optional(),
  })
  .refine((d) => Boolean(d.text || d.audioBase64), {
    message: 'Either text or audioBase64 is required',
  });

export const structuredHazardOutputSchema = z.object({
  hazardType: hazardTypeSchema,
  description: z.string().min(1).max(1000),
  aiSeverity: severitySchema,
  englishSummary: z.string().min(1).max(500),
  detectedLanguage: languageSchema,
});

export const submitHazardSchema = z.object({
  workplaceId: z.string().min(1).max(64),
  zoneId: z.string().min(1).max(64),
  workerId: z.string().max(64).optional(),
  hazardType: hazardTypeSchema,
  description: z.string().trim().min(1).max(1000),
  englishSummary: z.string().trim().min(1).max(500),
  aiSeverity: severitySchema,
  detectedLanguage: languageSchema.default('en'),
  photoBase64: imageBase64Schema.optional(),
  isDemoFallback: z.boolean().optional(),
});

export const removedPiiCategorySchema = z.enum([
  'name',
  'place',
  'time',
  'phone_id',
  'personal_detail',
]);

export const feedbackThemeSchema = z.enum([
  'overtime_pay',
  'supervisor_conduct',
  'rest_breaks',
  'safety_gear',
  'drinking_water_toilets',
  'shift_scheduling',
  'other',
]);

export const aiFeedbackPreviewRequestSchema = z
  .object({
    workplaceId: z.string().min(1).max(64),
    team: z.string().min(1).max(64),
    lang: languageSchema.default('en'),
    text: textInputSchema.optional(),
    audioBase64: audioBase64Schema.optional(),
    audioMimeType: z.string().max(64).optional(),
  })
  .refine((d) => Boolean(d.text || d.audioBase64), {
    message: 'Either text or audioBase64 is required',
  });

export const anonymisedFeedbackOutputSchema = z.object({
  cleanText: z.string().min(1).max(1200),
  cleanTextEnglish: z.string().min(1).max(1200),
  removed: z.array(removedPiiCategorySchema),
  themes: z.array(feedbackThemeSchema).min(1),
  sentiment: z.number().min(-1).max(1),
});

export const submitFeedbackSchema = z.object({
  workplaceId: z.string().min(1).max(64),
  team: z.string().min(1).max(64),
  cleanText: z.string().trim().min(1).max(1200),
  cleanTextEnglish: z.string().trim().min(1).max(1200),
  removed: z.array(removedPiiCategorySchema),
  themes: z.array(feedbackThemeSchema).min(1),
  sentiment: z.number().min(-1).max(1),
});

// Admin action schemas
export const adminEditShiftSchema = z.object({
  workerId: z.string().min(1).max(64),
  targetEventId: z.string().min(1).max(64),
  newTimestamp: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm format'),
  reason: z.string().trim().min(3, 'A clear reason is required to edit a shift').max(300),
  editorName: z.string().trim().min(1).max(100).default('Supervisor Ravi'),
});

export const adminResolveDisputeSchema = z.object({
  claimId: z.string().min(1).max(64),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().min(3, 'Resolution reason is required').max(300),
  resolvedBy: z.string().trim().min(1).max(100).default('Site Admin'),
});

export const adminUpdateHazardSchema = z.object({
  hazardId: z.string().min(1).max(64),
  status: z.enum(['acknowledged', 'resolved']),
});
