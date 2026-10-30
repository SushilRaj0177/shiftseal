import type { Language, SectorId } from './types.js';

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
  /** Indian state, for labour rules. */
  state: string;
  /** IANA time zone, e.g. Asia/Kolkata. */
  timezone: string;
  shiftStart: string; // HH:mm
  shiftEnd: string; // HH:mm
  /** Day of the week pay is made, 0 = Sunday. */
  payDay: number;
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
  // employer side
  | 'EDIT_CONTRADICTS_EVIDENCE'
  | 'EDIT_NEAR_PAYDAY'
  | 'EDITOR_PATTERN'
  | 'PAYMENT_MISMATCH'
  | 'HAZARD_FIX_NO_PHOTO'
  | 'HAZARD_FIX_DISPUTED'
  // worker side
  | 'CLAIM_NO_SHIFT'
  | 'CLAIM_EXCEEDS_DAY'
  | 'CLAIM_DUPLICATE'
  | 'CLAIM_NOT_CORROBORATED'
  | 'HAZARD_NO_PHOTO'
  | 'HAZARD_OUTSIDE_ZONE';

export type FlagSeverity = 'info' | 'review' | 'serious';

export interface FlagSubject {
  kind: 'event' | 'claim' | 'hazard' | 'payment' | 'supervisor' | 'device';
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
