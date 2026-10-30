import type {
  AnonymousFeedbackEntry,
  FatigueAttritionSignal,
  HazardReport,
  LedgerEvent,
  OvertimeClaim,
  PayslipCalculationResult,
  ShiftRecord,
  WorkerNotification,
} from '../../shared/types.js';
import type {
  CheckEvidence,
  FlagRecord,
  MemberRole,
  PaymentConfirmation,
  ServerReceipt,
  UserAccount,
  WorkplaceRecord,
} from '../../shared/model.js';
import type { PayPeriod } from '../../shared/time.js';

/** Response shapes of the Shiftseal API, as the app uses them. */

export interface MeResponse {
  user: UserAccount;
  workplaces: { id: string; name: string; sector: string; role: MemberRole }[];
}

export interface PublicMember {
  uid: string;
  workplaceId: string;
  role: MemberRole;
  name: string;
  phone?: string;
  title: string;
  team: string;
  hourlyRate: number;
  dailyWage: number;
  language: 'en' | 'ta' | 'hi';
  joinedAt: string;
  status: 'active' | 'removed';
  device: { platform: string; boundAt: string } | null;
  pendingDevice: { platform: string; boundAt: string } | null;
}

export interface WorkplaceResponse {
  workplace: WorkplaceRecord;
  member: PublicMember;
}

export interface GroupStatus {
  team: string;
  count: number;
  threshold: number;
  visible: boolean;
  statusMessage: string;
  themes?: { theme: string; count: number }[];
}

export interface WorkerOverview {
  today: string;
  period: PayPeriod;
  openShift: ShiftRecord | null;
  shifts: ShiftRecord[];
  chain: LedgerEvent[];
  chainVerification: { ok: true } | { ok: false; brokenAt: number };
  receipts: (ServerReceipt & { id: string })[];
  payslip: PayslipCalculationResult | null;
  lastPayslip: PayslipCalculationResult | null;
  lastPeriod: PayPeriod;
  lastPayment: PaymentConfirmation | null;
  claims: OvertimeClaim[];
  notifications: WorkerNotification[];
  hazards: HazardReport[];
  feedbackGroup: GroupStatus;
  flags: FlagRecord[];
}

export interface PersonSummary {
  uid: string;
  name: string;
  title: string;
  team: string;
  role: MemberRole;
  status: 'on_site' | 'checked_out' | 'absent';
  checkIn: string | null;
  checkOut: string | null;
  rateSet: boolean;
  pendingDevice: boolean;
  hasDevice: boolean;
  chainOk: boolean;
  netPay: number | null;
}

export interface Dashboard {
  today: string;
  period: PayPeriod;
  workplace: WorkplaceRecord;
  people: PersonSummary[];
  kpis: {
    workers: number;
    onSite: number;
    openClaims: number;
    openHazards: number;
    openFlags: number;
    overtimeOwed: number;
  };
  claims: OvertimeClaim[];
  hazards: HazardReport[];
  flags: FlagRecord[];
  hotspots: { code: string; name: string; kind: string; count: number; isHotspot: boolean }[];
  fatigue: FatigueAttritionSignal[];
  feedbackGroups: GroupStatus[];
}

export interface WorkerRecord {
  worker: PublicMember;
  shifts: ShiftRecord[];
  chain: LedgerEvent[];
  verification: { ok: true } | { ok: false; brokenAt: number };
  flags: FlagRecord[];
}

export interface CheckResponse {
  event: LedgerEvent;
  receipt: ServerReceipt;
  evidence: CheckEvidence;
  flags: FlagRecord[];
}

export type { AnonymousFeedbackEntry };
