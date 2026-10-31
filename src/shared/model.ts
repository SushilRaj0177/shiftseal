import type { Language, SectorId } from './types.js';
import type { CountryId, PayCycle } from './countries/types.js';

/** Production data model: real accounts, workplaces, membership and evidence. */

export type MemberRole = 'owner' | 'supervisor' | 'worker';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** A circular site boundary. Accurate enough for a gate or a building site. */
export interface Geofence {
  center: GeoPoint;
  radiusM: number;
}

export interface SiteZone {
  code: string;
  name: string;
  /** Icon key for the UI (scaffold, gate, basement, ...). */
  kind: string;
  /** Optional tighter boundary used for hazard reports in this zone. */
  geofence?: Geofence;
}

export interface WorkplaceRecord {
  id: string;
  name: string;
  sector: SectorId;
  /** Country whose labour law applies. India if unset (workplaces created before countries). */
  country?: CountryId;
  /** US state with its own rules (CA, NY). */
  region?: string;
  /** State, province or prefecture, as the owner wrote it. */
  state: string;
  /** IANA time zone, e.g. Asia/Kolkata. */
  timezone: string;
  shiftStart: string; // HH:mm
  shiftEnd: string; // HH:mm
  /** Day of the week pay is made, 0 = Sunday (weekly pay cycle). */
  payDay: number;
  /** Weekly (wage workers) or monthly (salaried staff). Weekly if unset. */
  payCycle?: PayCycle;
  /** Day of the month salary is paid for the previous month (monthly pay cycle). */
  payDayOfMonth?: number;
  /** Days of the week that are off, 0 = Sunday. Sunday only if unset. */
  weeklyOff?: number[];
  /** Paid leave days per calendar year. Rule defaults if unset. */
  leavePolicy?: { casual: number; sick: number; earned: number };
  /** Public holidays observed, YYYY-MM-DD. */
  holidays?: string[];
  /** Overtime rate agreed above the legal minimum. */
  overtimeMultiplier?: number;
  geofence: Geofence;
  zones: SiteZone[];
  ownerUid: string;
  inviteCode: string;
  createdAt: string;
}

/** An ECDSA P-256 public key in JWK form. */
export interface PublicKeyJwk {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
}

export interface DeviceBinding {
  deviceId: string;
  publicKeyJwk: PublicKeyJwk;
  platform: 'android' | 'web';
  boundAt: string;
  approvedBy?: string;
}

export interface MemberRecord {
  uid: string;
  workplaceId: string;
  role: MemberRole;
  name: string;
  phone?: string;
  title: string;
  team: string;
  hourlyRate: number;
  dailyWage: number;
  /** How this person is paid. Hourly or daily wage if unset. */
  payType?: 'hourly' | 'daily' | 'monthly';
  monthlySalary?: number;
  /** Extra hours: paid as overtime, credited as comp-off leave, or neither (salaried, exempt). */
  overtime?: 'paid' | 'comp_off' | 'none';
  /** Fixed monthly deductions shown on every payslip, each with its reason (PF, ESI, PT, TDS). */
  recurringDeductions?: { type: string; amount: number; reason: string }[];
  /** Receives harassment complaints (India: Internal Committee; Japan: 相談窓口; and so on). */
  icMember?: boolean;
  icPresiding?: boolean;
  /** Start of service that counts for statutory annual leave; joining date if unset. */
  serviceFrom?: string;
  language: Language;
  joinedAt: string;
  status: 'active' | 'removed';
  device?: DeviceBinding;
  /** A new phone waiting for a supervisor's approval. */
  pendingDevice?: DeviceBinding;
}

export interface UserAccount {
  uid: string;
  phone?: string;
  email?: string;
  name: string;
  language: Language;
  createdAt: string;
  memberships: { workplaceId: string; role: MemberRole }[];
  /** Studying, and on a student visa or not; it changes the hours they may legally work. */
  student?: 'student' | 'international';
  /** Last day of an official school break, YYYY-MM-DD. */
  breakUntil?: string;
  /** Only used to apply the rules for young workers. */
  birthDate?: string;
}

export interface InviteRecord {
  code: string;
  workplaceId: string;
  role: MemberRole;
  createdBy: string;
  createdAt: string;
  /** If set, only this phone number can use the invite. */
  phone?: string;
  revoked?: boolean;
}

// ---------- Evidence attached to every check-in and check-out ----------

export interface LocationFix {
  lat: number;
  lng: number;
  accuracyM: number;
  /** When the phone took the fix (ISO). */
  at: string;
  /** Reported by the Android app when a mock-location provider is active. */
  mocked?: boolean;
}

export type QrKind = 'rotating' | 'printed' | 'none';
export type IntegrityVerdict = 'passed' | 'failed' | 'unavailable';
export type DeviceStatus = 'bound' | 'pending' | 'unbound';
export type TrustLevel = 'high' | 'medium' | 'low';

export interface CheckEvidence {
  location?: LocationFix;
  distanceM?: number;
  insideSite?: boolean;
  qr: QrKind;
  qrValid: boolean;
  device: DeviceStatus;
  deviceSignatureValid: boolean;
  integrity: IntegrityVerdict;
  clientTime: string;
  serverTime: string;
  clockSkewS: number;
  /** Checked from an approved work-from-home day. */
  remote?: boolean;
  trust: TrustLevel;
}

// ---------- Flags: neutral, reviewable signals. Never automatic penalties. ----------

export type FlagCode =
  // check-in evidence
  | 'OUTSIDE_SITE'
  | 'LOW_ACCURACY'
  | 'NO_LOCATION'
  | 'MOCK_LOCATION'
  | 'QR_INVALID'
  | 'NO_QR'
  | 'DEVICE_NOT_APPROVED'
  | 'SIGNATURE_INVALID'
  | 'INTEGRITY_FAILED'
  | 'CLOCK_SKEW'
  | 'SENT_LATE'
  // employer side
  | 'EDIT_CONTRADICTS_EVIDENCE'
  | 'EDIT_NEAR_PAYDAY'
  | 'EDITOR_PATTERN'
  | 'PAYMENT_MISMATCH'
  | 'HAZARD_FIX_NO_PHOTO'
  | 'HAZARD_FIX_DISPUTED'
  // worker side
  | 'LEAVE_REVOKED'
  | 'SALARY_LATE'
  | 'COMPLAINTS_NO_HANDLER'
  | 'COMPLAINT_OVERDUE'
  | 'LIMIT_EXCEEDED'
  | 'STUDENT_LIMIT'
  | 'MINOR_HOURS'
  | 'MINOR_NIGHT'
  | 'LEAVE_MIN_NOT_TAKEN'
  | 'CLAIM_NO_SHIFT'
  | 'CLAIM_EXCEEDS_DAY'
  | 'CLAIM_DUPLICATE'
  | 'CLAIM_NOT_CORROBORATED'
  | 'HAZARD_NO_PHOTO'
  | 'HAZARD_OUTSIDE_ZONE';

export type FlagSeverity = 'info' | 'review' | 'serious';

export interface FlagSubject {
  kind: 'event' | 'claim' | 'hazard' | 'payment' | 'supervisor' | 'device' | 'leave' | 'workplace';
  id: string;
  workerUid?: string;
}

export interface FlagRecord {
  id: string;
  workplaceId: string;
  code: FlagCode;
  severity: FlagSeverity;
  /** Whose statement the evidence questions. */
  concerns: 'worker' | 'employer';
  subject: FlagSubject;
  message: string;
  facts: Record<string, string | number | boolean>;
  createdAt: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolution?: string;
}

/** A worker's confirmation of what was actually paid for a pay period. */
export interface PaymentConfirmation {
  id: string;
  workplaceId: string;
  workerUid: string;
  periodStart: string;
  periodEnd: string;
  expectedNet: number;
  receivedAmount: number;
  /** The date the money arrived (for late-salary checks). */
  receivedOn?: string;
  createdAt: string;
}

/** Server-signed proof that an event was accepted into a worker's chain. */
export interface ServerReceipt {
  workplaceId: string;
  workerUid: string;
  eventId: string;
  seq: number;
  hash: string;
  at: string;
  sig: string;
}

/** The sealed fingerprint of every worker's record at the end of a day. */
export interface DailyDigest {
  workplaceId: string;
  date: string;
  leaves: { uid: string; seq: number; hash: string }[];
  root: string;
  sealedAt: string;
  sig: string;
}

// ---------- Leave ----------

export type LeaveType = 'casual' | 'sick' | 'earned' | 'comp_off' | 'unpaid' | 'wfh';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'revoked';

export interface LeaveRequest {
  id: string;
  workplaceId: string;
  workerUid: string;
  workerName: string;
  type: LeaveType;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  halfDay?: boolean;
  /** Working days the request covers (weekly offs excluded). */
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
}

/** Sealed into the worker's chain whenever a leave request changes. */
export interface LedgerLeavePayload {
  leaveId: string;
  action: 'requested' | 'approved' | 'rejected' | 'cancelled' | 'revoked';
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  byUid: string;
  byName: string;
  reason?: string;
}

// ---------- Confidential harassment complaints ----------

export type ComplaintStatus = 'received' | 'inquiry' | 'report_submitted' | 'closed';

export interface ComplaintMessage {
  id: string;
  fromRole: 'complainant' | 'committee';
  fromName: string;
  text: string;
  at: string;
}

/**
 * A complaint to the Internal Committee. Only the complainant and committee
 * members (minus any the complainant excluded) can read it. The owner sees
 * counts only, unless the owner is on the committee.
 */
export interface Complaint {
  id: string;
  workplaceId: string;
  complainantUid: string;
  complainantName: string;
  respondentName: string;
  incidentDate: string;
  place: string;
  description: string;
  witnesses?: string;
  excludedCommitteeUids: string[];
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  messages: ComplaintMessage[];
}
