import { z } from 'zod/v3';
import {
  feedbackThemeSchema,
  hazardTypeSchema,
  imageBase64Schema,
  languageSchema,
  countrySchema,
  removedPiiCategorySchema,
  sectorSchema,
  severitySchema,
} from './schemas.js';

/** Request bodies for the production API. Every route parses its input with one of these. */

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id');
const code = z.string().regex(/^[A-Za-z0-9-]{1,32}$/, 'Invalid code');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');
const isoTime = z.string().datetime({ offset: true });
const name = z.string().trim().min(1).max(80);

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const geofenceSchema = z.object({
  center: geoPointSchema,
  radiusM: z.number().min(25).max(5000),
});

export const zoneSchema = z.object({
  code,
  name,
  kind: z.string().trim().min(1).max(32),
  geofence: geofenceSchema.optional(),
});

export const locationFixSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(100_000),
  at: isoTime,
  mocked: z.boolean().optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const updateProfileSchema = z.object({
  name: name.optional(),
  language: languageSchema.optional(),
  /** null clears it. */
  student: z.enum(['student', 'international']).nullable().optional(),
  breakUntil: isoDate.nullable().optional(),
  birthDate: isoDate.nullable().optional(),
});

export const createWorkplaceSchema = z.object({
  name,
  sector: sectorSchema,
  country: countrySchema.default('IN'),
  /** US state with its own rules (CA, NY); other states follow federal law. */
  region: z.string().trim().max(8).optional(),
  state: z.string().trim().min(2).max(60),
  timezone: z.string().min(3).max(64).optional(),
  shiftStart: hhmm,
  shiftEnd: hhmm,
  payDay: z.number().int().min(0).max(6).default(6),
  payCycle: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']).optional(),
  payDayOfMonth: z.number().int().min(1).max(28).optional(),
  weeklyOff: z.array(z.number().int().min(0).max(6)).max(3).optional(),
  /** Public holidays the workplace observes, for holiday pay where the law sets it. */
  holidays: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .max(40)
    .optional(),
  /** A higher overtime rate than the law's minimum, by contract or agreement. */
  overtimeMultiplier: z.number().min(1).max(4).optional(),
  leavePolicy: z
    .object({
      casual: z.number().min(0).max(60),
      sick: z.number().min(0).max(60),
      earned: z.number().min(0).max(60),
    })
    .optional(),
  geofence: geofenceSchema,
  zones: z.array(zoneSchema).min(1).max(40),
  ownerName: name,
});

export const updateWorkplaceSchema = createWorkplaceSchema.omit({ ownerName: true }).partial();

export const createInviteSchema = z.object({
  role: z.enum(['supervisor', 'worker']).default('worker'),
  phone: z
    .string()
    .regex(/^\+\d{8,15}$/, 'Use international format, e.g. +919841023456')
    .optional(),
});

export const inviteCodeSchema = z.object({ code });

export const acceptInviteSchema = z.object({
  code,
  name,
  language: languageSchema.default('en-IN'),
});

export const updateMemberSchema = z.object({
  title: z.string().trim().min(1).max(60).optional(),
  team: z.string().trim().min(1).max(60).optional(),
  hourlyRate: z.number().min(0).max(100_000).optional(),
  dailyWage: z.number().min(0).max(1_000_000).optional(),
  role: z.enum(['supervisor', 'worker']).optional(),
  status: z.enum(['active', 'removed']).optional(),
  payType: z.enum(['hourly', 'daily', 'monthly']).optional(),
  monthlySalary: z.number().min(0).max(10_000_000).optional(),
  overtime: z.enum(['paid', 'comp_off', 'none']).optional(),
  recurringDeductions: z
    .array(
      z.object({
        type: z.string().trim().min(2).max(40),
        amount: z.number().min(1).max(1_000_000),
        reason: z.string().trim().min(3, 'A reason is required for every deduction').max(200),
      })
    )
    .max(10)
    .optional(),
  icMember: z.boolean().optional(),
  icPresiding: z.boolean().optional(),
  /** Start of service that counts for statutory annual leave. */
  serviceFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const registerDeviceSchema = z.object({
  deviceId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  platform: z.enum(['android', 'web']),
  publicKeyJwk: z.object({
    kty: z.literal('EC'),
    crv: z.literal('P-256'),
    x: z.string().min(20).max(64),
    y: z.string().min(20).max(64),
  }),
});

/** The exact object the phone signs for a check-in or check-out. */
export const signedCheckPayloadSchema = z.object({
  workplaceId: id,
  action: z.enum(['CHECK_IN', 'CHECK_OUT']),
  qrToken: z.string().max(200).optional(),
  location: locationFixSchema.optional(),
  clientTime: isoTime,
  deviceId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
});

export const checkRequestSchema = z.object({
  payload: signedCheckPayloadSchema,
  signature: z.string().min(40).max(200),
  integrityToken: z.string().max(8000).optional(),
});

export const editShiftSchema = z.object({
  workerUid: id,
  targetEventId: z.string().min(1).max(128),
  newTime: hhmm,
  reason: z.string().trim().min(5, 'Give a clear reason').max(300),
});

export const respondNotificationSchema = z.object({
  notificationId: id,
  response: z.enum(['acknowledged', 'disputed']),
  note: z.string().trim().max(300).optional(),
});

export const submitClaimRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  extraHours: z.number().min(0.25).max(16),
  reason: z.string().trim().min(1).max(500),
  detectedLanguage: languageSchema.default('en-IN'),
});

export const resolveClaimSchema = z.object({
  claimId: id,
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().min(3).max(300),
});

export const photoSchema = z.object({
  dataUrl: imageBase64Schema.refine((s) => s.startsWith('data:image/jpeg;base64,'), 'JPEG only'),
  takenAt: isoTime,
  source: z.enum(['camera', 'gallery']),
});

export const submitHazardRequestSchema = z.object({
  zoneCode: code,
  hazardType: hazardTypeSchema,
  description: z.string().trim().min(1).max(1000),
  englishSummary: z.string().trim().min(1).max(500),
  aiSeverity: severitySchema,
  detectedLanguage: languageSchema.default('en-IN'),
  location: locationFixSchema.optional(),
  photo: photoSchema.optional(),
  aiUnavailable: z.boolean().optional(),
});

export const updateHazardSchema = z.object({
  hazardId: id,
  status: z.enum(['acknowledged', 'resolved']),
  photo: photoSchema.optional(),
  note: z.string().trim().max(300).optional(),
});

export const disputeHazardFixSchema = z.object({
  hazardId: id,
  note: z.string().trim().min(3).max(300),
  photo: photoSchema.optional(),
});

export const submitFeedbackRequestSchema = z.object({
  cleanText: z.string().trim().min(1).max(1200),
  cleanTextEnglish: z.string().trim().min(1).max(1200),
  removed: z.array(removedPiiCategorySchema),
  themes: z.array(feedbackThemeSchema).min(1),
  sentiment: z.number().min(-1).max(1),
});

export const confirmPaymentSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receivedAmount: z.number().min(0).max(10_000_000),
  receivedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const requestLeaveSchema = z.object({
  type: z.enum(['casual', 'sick', 'earned', 'comp_off', 'unpaid', 'wfh']),
  from: ymd,
  to: ymd,
  halfDay: z.boolean().optional(),
  reason: z.string().trim().min(2).max(300),
});

export const decideLeaveSchema = z.object({
  leaveId: id,
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(300).optional(),
});

export const leaveIdSchema = z.object({ leaveId: id });

export const revokeLeaveSchema = z.object({
  leaveId: id,
  reason: z.string().trim().min(5, 'Give a clear reason').max(300),
});

export const fileComplaintSchema = z.object({
  respondentName: z.string().trim().min(1).max(100),
  incidentDate: ymd,
  place: z.string().trim().min(1).max(200),
  description: z.string().trim().min(10).max(5000),
  witnesses: z.string().trim().max(500).optional(),
  excludedCommitteeUids: z.array(id).max(10).default([]),
});

export const complaintMessageSchema = z.object({
  complaintId: id,
  text: z.string().trim().min(1).max(3000),
});

export const complaintStatusSchema = z.object({
  complaintId: id,
  status: z.enum(['received', 'inquiry', 'report_submitted', 'closed']),
  note: z.string().trim().max(1000).optional(),
});

export const resolveFlagSchema = z.object({
  flagId: id,
  status: z.enum(['resolved', 'dismissed']),
  resolution: z.string().trim().min(3).max(300),
});

export const aiClaimSchema = z
  .object({
    lang: languageSchema.default('en-IN'),
    text: z.string().trim().min(1).max(2000).optional(),
    audioBase64: z.string().max(2_850_000).optional(),
    audioMimeType: z.string().max(64).optional(),
  })
  .refine((d) => Boolean(d.text || d.audioBase64), { message: 'Either text or audio is required' });

export const aiExplainPaySchema = z
  .object({
    lang: languageSchema.default('en-IN'),
    question: z.string().trim().min(1).max(500).optional(),
    audioBase64: z.string().max(2_850_000).optional(),
    audioMimeType: z.string().max(64).optional(),
  })
  .refine((d) => Boolean(d.question || d.audioBase64), { message: 'A question is required' });

export const aiHazardSchema = aiClaimSchema.and(z.object({ zoneCode: code }));
