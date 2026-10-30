import type {
  CheckEvidence,
  DeviceStatus,
  FlagCode,
  FlagSeverity,
  FlagSubject,
  Geofence,
  IntegrityVerdict,
  LocationFix,
  QrKind,
  TrustLevel,
} from '../model.js';
import { evaluateFix } from '../geo.js';
import { addDays, minutesBetween } from '../time.js';

/**
 * Evidence rules. Each function looks at what the records show and returns
 * neutral flags for a person to review. Nothing here blocks, deducts or
 * punishes on its own; it only says where a claim and the evidence disagree.
 */

export interface FlagDraft {
  code: FlagCode;
  severity: FlagSeverity;
  concerns: 'worker' | 'employer';
  subject: FlagSubject;
  message: string;
  facts: Record<string, string | number | boolean>;
}

const MAX_CLOCK_SKEW_S = 5 * 60;

// ---------------------------------------------------------------- check-ins

export interface CheckInput {
  eventId: string;
  workerUid: string;
  fence: Geofence;
  fix?: LocationFix;
  qr: QrKind;
  qrValid: boolean;
  device: DeviceStatus;
  signatureValid: boolean;
  integrity: IntegrityVerdict;
  clientTime: string;
  serverTime: string;
  /** An approved work-from-home day: location is recorded but not compared with the site. */
  remote?: boolean;
}

export function assessCheck(input: CheckInput): { evidence: CheckEvidence; flags: FlagDraft[] } {
  const subject: FlagSubject = { kind: 'event', id: input.eventId, workerUid: input.workerUid };
  const flags: FlagDraft[] = [];
  const add = (
    code: FlagCode,
    severity: FlagSeverity,
    message: string,
    facts: FlagDraft['facts'] = {}
  ) => flags.push({ code, severity, concerns: 'worker', subject, message, facts });

  let distance: number | undefined;
  let inside: boolean | undefined;
  if (!input.fix) {
    add('NO_LOCATION', 'review', 'No location was shared with this check.');
  } else if (input.remote) {
    if (input.fix.mocked) {
      add('MOCK_LOCATION', 'serious', 'The phone reported a simulated (mock) location.');
    }
  } else {
    const fix = evaluateFix(input.fix, input.fence);
    distance = fix.distanceM;
    inside = fix.verdict === 'inside';
    if (fix.verdict === 'outside') {
      add('OUTSIDE_SITE', 'serious', `Phone was ${fix.distanceM} m from the site centre.`, {
        distanceM: fix.distanceM,
        radiusM: input.fence.radiusM,
        accuracyM: Math.round(input.fix.accuracyM),
      });
    } else if (fix.verdict === 'uncertain') {
      add(
        'LOW_ACCURACY',
        'review',
        'Location was too imprecise to confirm the phone was on site.',
        {
          distanceM: fix.distanceM,
          accuracyM: Math.round(input.fix.accuracyM),
        }
      );
    }
    if (input.fix.mocked) {
      add('MOCK_LOCATION', 'serious', 'The phone reported a simulated (mock) location.');
    }
  }

  if (input.remote) {
    // No gate to scan from home.
  } else if (input.qr === 'none')
    add('NO_QR', 'review', 'Checked without scanning the site QR code.');
  else if (!input.qrValid)
    add('QR_INVALID', 'serious', 'The scanned QR code was expired or not from this site.', {
      qr: input.qr,
    });

  if (!input.signatureValid) {
    add(
      'SIGNATURE_INVALID',
      'serious',
      "The check was not signed by the worker's registered phone."
    );
  } else if (input.device === 'pending') {
    add(
      'DEVICE_NOT_APPROVED',
      'review',
      'Sent from a new phone that a supervisor has not approved yet.'
    );
  }

  if (input.integrity === 'failed') {
    add('INTEGRITY_FAILED', 'serious', 'The phone failed the Google Play device check.');
  }

  const skew = Math.round((Date.parse(input.clientTime) - Date.parse(input.serverTime)) / 1000);
  if (Number.isFinite(skew) && Math.abs(skew) > MAX_CLOCK_SKEW_S) {
    add(
      'CLOCK_SKEW',
      'review',
      "The phone's clock differed from the server by more than 5 minutes.",
      {
        skewSeconds: skew,
      }
    );
  }

  const trust = trustLevel(input, flags);
  return {
    evidence: {
      location: input.fix,
      distanceM: distance,
      insideSite: inside,
      qr: input.qr,
      qrValid: input.qrValid,
      device: input.device,
      deviceSignatureValid: input.signatureValid,
      integrity: input.integrity,
      clientTime: input.clientTime,
      serverTime: input.serverTime,
      clockSkewS: Number.isFinite(skew) ? skew : 0,
      remote: input.remote || undefined,
      trust,
    },
    flags,
  };
}

function trustLevel(input: CheckInput, flags: FlagDraft[]): TrustLevel {
  if (flags.some((f) => f.severity === 'serious')) return 'low';
  const strong =
    flags.length === 0 &&
    input.qr === 'rotating' &&
    input.device === 'bound' &&
    input.integrity === 'passed';
  return strong ? 'high' : 'medium';
}

// ---------------------------------------------------------------- edits

export interface EditInput {
  editEventId: string;
  workerUid: string;
  editorUid: string;
  kind: 'in' | 'out';
  oldValue: string; // HH:mm
  newValue: string; // HH:mm
  /** Evidence sealed with the event being edited, if any. */
  originalEvidence?: CheckEvidence;
  /** Local date the edit was made, and the pay date of the shift's period. */
  editDate: string;
  payDate: string;
}

/** True when the edit makes the recorded shift shorter. */
export function reducesHours(kind: 'in' | 'out', oldValue: string, newValue: string): boolean {
  if (oldValue === newValue) return false;
  const later = minutesBetween(oldValue, newValue) < 12 * 60; // newValue is after oldValue
  return kind === 'out' ? !later : later;
}

export function assessEdit(input: EditInput): FlagDraft[] {
  const flags: FlagDraft[] = [];
  const subject: FlagSubject = { kind: 'event', id: input.editEventId, workerUid: input.workerUid };
  if (!reducesHours(input.kind, input.oldValue, input.newValue)) return flags;

  const ev = input.originalEvidence;
  if (ev && ev.insideSite && ev.deviceSignatureValid && ev.trust !== 'low') {
    flags.push({
      code: 'EDIT_CONTRADICTS_EVIDENCE',
      severity: 'serious',
      concerns: 'employer',
      subject,
      message: `The original ${input.kind === 'out' ? 'checkout' : 'check-in'} at ${input.oldValue} was signed on the worker's phone while on site.`,
      facts: {
        originalTime: input.oldValue,
        editedTime: input.newValue,
        distanceM: ev.distanceM ?? -1,
        trust: ev.trust,
      },
    });
  }

  if (input.editDate >= addDays(input.payDate, -2) && input.editDate <= input.payDate) {
    flags.push({
      code: 'EDIT_NEAR_PAYDAY',
      severity: 'review',
      concerns: 'employer',
      subject,
      message: 'Hours were reduced within two days of payday.',
      facts: { editDate: input.editDate, payDate: input.payDate },
    });
  }
  return flags;
}

export interface EditorHistoryItem {
  editorUid: string;
  date: string;
  reduced: boolean;
}

/** Flags an editor whose recent edits mostly cut workers' hours. */
export function assessEditorPattern(
  editorUid: string,
  editorName: string,
  history: EditorHistoryItem[],
  today: string
): FlagDraft | null {
  const since = addDays(today, -30);
  const mine = history.filter((h) => h.editorUid === editorUid && h.date >= since);
  const reduced = mine.filter((h) => h.reduced).length;
  if (reduced < 5 || reduced / mine.length < 0.8) return null;
  return {
    code: 'EDITOR_PATTERN',
    severity: 'review',
    concerns: 'employer',
    subject: { kind: 'supervisor', id: editorUid },
    message: `${editorName} reduced recorded hours ${reduced} times in the last 30 days.`,
    facts: { reducingEdits: reduced, totalEdits: mine.length },
  };
}

// ---------------------------------------------------------------- claims

export interface ClaimInput {
  claimId: string;
  workerUid: string;
  date: string;
  extraHours: number;
  hasShift: boolean;
  scheduledHours: number;
  otherClaimDates: string[];
  /** Co-workers whose sealed checkout on that date is at or after the claimed end. */
  corroboratingCoworkers: number;
  supported: boolean;
}

export function assessClaim(input: ClaimInput): FlagDraft[] {
  const subject: FlagSubject = { kind: 'claim', id: input.claimId, workerUid: input.workerUid };
  const flags: FlagDraft[] = [];
  if (!input.hasShift) {
    flags.push({
      code: 'CLAIM_NO_SHIFT',
      severity: 'review',
      concerns: 'worker',
      subject,
      message: `No check-in was recorded on ${input.date}.`,
      facts: { date: input.date },
    });
  }
  if (input.scheduledHours + input.extraHours > 20) {
    flags.push({
      code: 'CLAIM_EXCEEDS_DAY',
      severity: 'serious',
      concerns: 'worker',
      subject,
      message: `${input.extraHours} extra hours on top of a ${input.scheduledHours}-hour shift is not physically plausible.`,
      facts: { extraHours: input.extraHours, scheduledHours: input.scheduledHours },
    });
  }
  if (input.otherClaimDates.includes(input.date)) {
    flags.push({
      code: 'CLAIM_DUPLICATE',
      severity: 'review',
      concerns: 'worker',
      subject,
      message: `There is already a claim for ${input.date}.`,
      facts: { date: input.date },
    });
  }
  if (!input.supported && input.hasShift && input.corroboratingCoworkers === 0) {
    flags.push({
      code: 'CLAIM_NOT_CORROBORATED',
      severity: 'info',
      concerns: 'worker',
      subject,
      message: 'No co-worker was recorded on site until the claimed time.',
      facts: { coworkers: 0 },
    });
  }
  return flags;
}

// ---------------------------------------------------------------- payments

export function assessPayment(
  paymentId: string,
  workerUid: string,
  expectedNet: number,
  received: number,
  receivedOn?: string,
  dueDate?: string
): FlagDraft[] {
  const subject: FlagSubject = { kind: 'payment', id: paymentId, workerUid };
  const flags: FlagDraft[] = [];
  const shortBy = Math.round(expectedNet - received);
  if (shortBy >= 1) {
    flags.push({
      code: 'PAYMENT_MISMATCH',
      severity: 'serious',
      concerns: 'employer',
      subject,
      message: `Worker reports receiving ₹${received}, ₹${shortBy} less than the payslip.`,
      facts: { expectedNet, received, shortBy },
    });
  }
  if (receivedOn && dueDate && receivedOn > dueDate) {
    flags.push({
      code: 'SALARY_LATE',
      severity: 'serious',
      concerns: 'employer',
      subject,
      message: `Paid on ${receivedOn}; the legal deadline was ${dueDate}.`,
      facts: { receivedOn, dueDate },
    });
  }
  return flags;
}

// ---------------------------------------------------------------- leave

export function leaveRevoked(
  leaveId: string,
  workerUid: string,
  byName: string,
  from: string,
  to: string,
  reason: string
): FlagDraft {
  return {
    code: 'LEAVE_REVOKED',
    severity: 'serious',
    concerns: 'employer',
    subject: { kind: 'leave', id: leaveId, workerUid },
    message: `${byName} withdrew leave that had already been approved (${from} to ${to}).`,
    facts: { from, to, reason: reason.slice(0, 200) },
  };
}

// ---------------------------------------------------------------- legal limits

/**
 * A worker over one of the country's legal working-time limits. The limit is
 * the employer's to keep, so the flag is about the employer.
 */
export function assessLimits(
  workerUid: string,
  readings: { id: string; value: number; cap: number; from: string; source: string; kind: string }[]
): FlagDraft[] {
  return readings
    .filter((r) => r.kind === 'law' && r.value > r.cap && !LIMITS_ARE_THRESHOLDS.has(r.id))
    .map((r) => ({
      code: 'LIMIT_EXCEEDED' as const,
      severity: 'serious' as const,
      concerns: 'employer' as const,
      subject: { kind: 'workplace' as const, id: `${workerUid}:${r.id}:${r.from}`, workerUid },
      message: `Over the legal limit: ${r.value} of ${r.cap} hours (${r.source}).`,
      facts: { value: r.value, cap: r.cap },
    }));
}

/** Meters that mark where overtime starts, not a maximum (US 40-hour week, California 8-hour day, Brazil 44). */
const LIMITS_ARE_THRESHOLDS = new Set(['usWeek', 'caDay', 'brWeek', 'week']);

// ---------------------------------------------------------------- harassment complaints

/** Workplace-level compliance flags. They carry counts only, never complaint details. */
/**
 * Whether the workplace has named people to receive harassment complaints when
 * its country's law requires it, and whether inquiries are running late.
 * Uses counts only, never complaint details.
 */
export function assessComplaintCompliance(
  workplaceId: string,
  headcount: number,
  committeeSize: number,
  threshold: number,
  overdueComplaints: number,
  inquiryDays?: number
): FlagDraft[] {
  const subject: FlagSubject = { kind: 'workplace', id: workplaceId };
  const flags: FlagDraft[] = [];
  if (headcount >= threshold && committeeSize === 0) {
    flags.push({
      code: 'COMPLAINTS_NO_HANDLER',
      severity: 'serious',
      concerns: 'employer',
      subject,
      message: `${headcount} people work here, but nobody has been named to receive harassment complaints. The law here requires it from ${threshold}.`,
      facts: { headcount, threshold },
    });
  }
  if (inquiryDays && overdueComplaints > 0) {
    flags.push({
      code: 'COMPLAINT_OVERDUE',
      severity: 'serious',
      concerns: 'employer',
      subject,
      message: `${overdueComplaints} complaint(s) have been open longer than the ${inquiryDays}-day inquiry limit.`,
      facts: { overdueComplaints, inquiryDays: inquiryDays ?? 0 },
    });
  }
  return flags;
}

// ---------------------------------------------------------------- hazards

export interface HazardReportInput {
  hazardId: string;
  workerUid: string;
  hasPhoto: boolean;
  fix?: LocationFix;
  fence: Geofence;
}

export function assessHazardReport(input: HazardReportInput): FlagDraft[] {
  const subject: FlagSubject = { kind: 'hazard', id: input.hazardId, workerUid: input.workerUid };
  const flags: FlagDraft[] = [];
  if (!input.hasPhoto) {
    flags.push({
      code: 'HAZARD_NO_PHOTO',
      severity: 'info',
      concerns: 'worker',
      subject,
      message: 'Reported without a photo.',
      facts: {},
    });
  }
  if (input.fix && evaluateFix(input.fix, input.fence).verdict === 'outside') {
    flags.push({
      code: 'HAZARD_OUTSIDE_ZONE',
      severity: 'review',
      concerns: 'worker',
      subject,
      message: 'The reporter was not near this zone when reporting.',
      facts: { distanceM: evaluateFix(input.fix, input.fence).distanceM },
    });
  }
  return flags;
}

export function assessHazardResolution(hazardId: string, hasPhoto: boolean): FlagDraft | null {
  if (hasPhoto) return null;
  return {
    code: 'HAZARD_FIX_NO_PHOTO',
    severity: 'review',
    concerns: 'employer',
    subject: { kind: 'hazard', id: hazardId },
    message: 'Marked fixed without a photo of the fix.',
    facts: {},
  };
}

export function hazardFixDisputed(hazardId: string, workerUid: string, note: string): FlagDraft {
  return {
    code: 'HAZARD_FIX_DISPUTED',
    severity: 'serious',
    concerns: 'employer',
    subject: { kind: 'hazard', id: hazardId, workerUid },
    message: 'The worker who reported this says it is not fixed.',
    facts: { note: note.slice(0, 200) },
  };
}
