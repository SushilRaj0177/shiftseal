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
  LeaveRequest,
  LeaveType,
  FlagRecord,
  MemberRole,
  PaymentConfirmation,
  ServerReceipt,
  UserAccount,
  WorkplaceRecord,
} from '../../shared/model.js';
import type { PayPeriod } from '../../shared/time.js';
import type { Language } from '../../shared/languages.js';
import type { CountryId } from '../../shared/countries/types.js';
import type { LimitReading } from '../../shared/rules/limits.js';
import type { StudentRules } from '../../shared/countries/types.js';

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
  payType?: 'hourly' | 'daily' | 'monthly';
  monthlySalary?: number;
  overtime?: 'paid' | 'comp_off' | 'none';
  recurringDeductions?: { type: string; amount: number; reason: string }[];
  icMember?: boolean;
  icPresiding?: boolean;
  language: Language;
  joinedAt: string;
  serviceFrom?: string;
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
  payType: 'hourly' | 'daily' | 'monthly';
  overtime: 'paid' | 'comp_off' | 'none';
  country: CountryId;
  currency: string;
  /** Where the worker stands against the country's legal working-time limits. */
  limits: LimitReading[];
  student: { student?: 'student' | 'international'; breakUntil?: string; birthDate?: string };
  studentRules: StudentRules | null;
  /** Yearly payments the country's law requires (aguinaldo, 13º salário, ...). */
  annualPayments: { code: string; due: string | null; estimate: number | null; rule: string }[];
  leave: {
    types: LeaveKind[];
    balances: LeaveBalance[];
    /** Leave the employer must ensure is taken this year (Japan), if it applies. */
    minTaken: { required: number; taken: number } | null;
    pending: number;
    today: LeaveRequest | null;
    upcoming: LeaveRequest[];
  };
}

export interface LeaveBalance {
  type: 'casual' | 'sick' | 'earned' | 'comp_off';
  entitled: number;
  used: number;
  pending: number;
  available: number;
  kind?: 'law' | 'policy';
}

/** A leave type this country offers, and whether it keeps salary. */
export interface LeaveKind {
  type: LeaveRequest['type'];
  paid: boolean;
}

export interface LeaveResponse {
  today: string;
  types: LeaveKind[];
  balances: LeaveBalance[];
  requests: LeaveRequest[];
  team: LeaveRequest[];
}

export interface CommitteeInfo {
  committee: { uid: string; name: string; presiding: boolean }[];
  required: boolean;
  isMember: boolean;
  presiding: boolean;
  complaintWindowDays: number | null;
  inquiryDays: number | null;
  external: { key: string; url: string }[];
}

export type { LeaveRequest, LeaveType };

export interface PersonSummary {
  uid: string;
  name: string;
  title: string;
  team: string;
  role: MemberRole;
  status: 'on_site' | 'checked_out' | 'absent' | 'on_leave' | 'wfh';
  icMember: boolean;
  student: 'student' | 'international' | null;
  minor: boolean;
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
    pendingLeave: number;
  };
  claims: OvertimeClaim[];
  hazards: HazardReport[];
  flags: FlagRecord[];
  hotspots: { code: string; name: string; kind: string; count: number; isHotspot: boolean }[];
  fatigue: FatigueAttritionSignal[];
  burnout: {
    workerId: string;
    workerName: string;
    level: 'low' | 'medium' | 'high';
    reasons: string[];
    why: { code: string; args: number[] }[];
  }[];
  leave: { pending: LeaveRequest[]; today: LeaveRequest[] };
  complaints: { committeeSize: number; open: number; overdue: number };
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
