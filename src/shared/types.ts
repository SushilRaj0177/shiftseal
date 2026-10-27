export type Language = 'en' | 'ta' | 'hi';

export type SectorId = 'construction' | 'campus';

export type RuleKind = 'law' | 'policy';

export interface RuleDefinition {
  id: string;
  value: number;
  unit: string;
  kind: RuleKind;
  source: string;
  note?: string;
}

export interface Ruleset {
  sector: SectorId;
  name: string;
  rules: Record<string, RuleDefinition>;
}

export interface Zone {
  id: string;
  workplaceId: string;
  name: string;
  nameTa: string;
  nameHi: string;
  code: string;
  icon: string;
}

export interface Workplace {
  id: string;
  name: string;
  nameTa: string;
  nameHi: string;
  sector: SectorId;
  checkinCode: string;
  supervisorName: string;
  nextPayDate: string; // ISO date
  zones: Zone[];
}

export interface WorkerProfile {
  id: string;
  name: string;
  nameTa: string;
  nameHi: string;
  workplaceId: string;
  sector: SectorId;
  role: string;
  roleTa: string;
  roleHi: string;
  team: string;
  hourlyRate: number;
  dailyWage: number;
  preferredLanguage: Language;
  missedShifts14d?: number;
  otTrend3Weeks?: [number, number, number]; // week -2, week -1, current week OT hours
}

// Ledger types
export type LedgerEventType = 'CHECK_IN' | 'CHECK_OUT' | 'EDIT';

export interface LedgerCheckInPayload {
  date: string; // YYYY-MM-DD (shift start date)
  timestamp: string; // ISO timestamp or HH:mm
  zoneCode: string;
  source?: 'qr' | 'manual' | 'register_photo';
}

export interface LedgerCheckOutPayload {
  date: string; // YYYY-MM-DD (shift start date)
  timestamp: string; // ISO timestamp or HH:mm
  zoneCode: string;
  source?: 'qr' | 'manual' | 'register_photo';
}

export interface LedgerEditPayload {
  targetEventId: string;
  field: 'timestamp';
  oldValue: string;
  newValue: string;
  reason: string;
  editorId: string;
  editorName: string;
}

export interface LedgerEvent {
  id: string;
  workerId: string;
  type: LedgerEventType;
  createdAt: string;
  payload: LedgerCheckInPayload | LedgerCheckOutPayload | LedgerEditPayload;
  prevHash: string;
  hash: string;
}

export interface ShiftEditRecord {
  editEventId: string;
  targetEventId: string;
  field: 'timestamp';
  oldValue: string;
  newValue: string;
  reason: string;
  editorId: string;
  editorName: string;
  createdAt: string;
}

export interface ShiftRecord {
  date: string; // YYYY-MM-DD
  workerId: string;
  checkInEventId: string;
  checkOutEventId?: string;
  checkInTime: string; // HH:mm (or ISO)
  checkOutTime?: string; // HH:mm (or ISO)
  originalCheckInTime: string;
  originalCheckOutTime?: string;
  zoneCode: string;
  source: 'qr' | 'manual' | 'register_photo';
  edits: ShiftEditRecord[];
}

export interface DayHoursBreakdown {
  date: string;
  totalHours: number;
  normalHours: number;
  dailyOtHours: number;
  checkInTime: string;
  checkOutTime: string;
  crossesMidnight: boolean;
  shiftRefs: string[];
}

export interface HoursCalculationResult {
  normalHours: number;
  otHours: number;
  dailyOtHours: number;
  weeklyExtraOtHours: number;
  totalHours: number;
  perDay: DayHoursBreakdown[];
  ruleRefs: RuleDefinition[];
}

export interface DeductionItem {
  id: string;
  type: string;
  amount: number;
  reason?: string;
}

export interface PayslipLine {
  id: string;
  kind: 'normal' | 'overtime' | 'claim_overtime' | 'deduction' | 'net';
  labelKey: string;
  hours?: number;
  rate?: number;
  amount: number;
  flagged?: boolean;
  flagReason?: string;
  ruleRef?: RuleDefinition;
  shiftRefs: string[];
}

export interface PayslipCalculationResult {
  workerId: string;
  weekLabel: string;
  hourlyRate: number;
  normalHours: number;
  otHours: number;
  claimedOtHours: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  flaggedDeductionsCount: number;
  lines: PayslipLine[];
}

// Claims & Disputes
export type ClaimMatchStatus = 'supported' | 'partly_supported' | 'unsupported';
export type DisputeResolutionStatus = 'pending' | 'approved' | 'rejected';

export interface ClaimEvidence {
  shiftDate: string;
  recordedCheckIn?: string;
  recordedCheckOut?: string;
  originalCheckOut?: string;
  recordedExtraHours: number;
  claimedExtraHours: number;
  supportedExtraHours: number;
  hadSupervisorEdit: boolean;
  editReason?: string;
  explanation: string;
}

export interface OvertimeClaim {
  id: string;
  workerId: string;
  workerName: string;
  workplaceId: string;
  date: string;
  extraHours: number;
  reason: string;
  detectedLanguage: Language;
  matchStatus: ClaimMatchStatus;
  supportedHours: number;
  evidence: ClaimEvidence;
  resolutionStatus: DisputeResolutionStatus;
  resolutionReason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  kind: 'overtime_claim' | 'edit_disagree';
  relatedEditEventId?: string;
  isDemoFallback?: boolean;
}

// Notifications
export interface WorkerNotification {
  id: string;
  workerId: string;
  workplaceId: string;
  type: 'SHIFT_EDITED' | 'DISPUTE_RESOLVED' | 'HAZARD_UPDATED';
  date: string;
  oldValue?: string;
  newValue?: string;
  supervisorName?: string;
  reason: string;
  editEventId?: string;
  status: 'unread' | 'acknowledged' | 'disputed';
  createdAt: string;
}

// Hazards
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type ConstructionHazardType =
  | 'electrical'
  | 'fall_from_height'
  | 'scaffold'
  | 'structural_collapse'
  | 'crane_lifting'
  | 'fire'
  | 'ppe_missing'
  | 'heat_water'
  | 'housekeeping'
  | 'other';

export type CampusHazardType =
  | 'electrical'
  | 'fire'
  | 'gas_leak'
  | 'chemical_lab'
  | 'fall_from_height'
  | 'violence_weapon'
  | 'sanitation_water'
  | 'lighting_pathway'
  | 'equipment_fault'
  | 'other';

export type HazardType = ConstructionHazardType | CampusHazardType;

export type HazardStatus = 'received' | 'acknowledged' | 'resolved';

export interface HazardReport {
  id: string;
  workplaceId: string;
  sector: SectorId;
  zoneId: string;
  zoneName: string;
  workerId?: string; // optional for worker status tracking
  hazardType: HazardType;
  description: string;
  englishSummary: string;
  aiSeverity: SeverityLevel;
  floorSeverity: SeverityLevel;
  finalSeverity: SeverityLevel;
  floorApplied: boolean;
  ruleRef?: RuleDefinition;
  status: HazardStatus;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  deadlineAt: string;
  hasPhoto?: boolean;
  photoNote?: string;
  detectedLanguage: Language;
  isDemoFallback?: boolean;
}

// Anonymous Feedback
export type FeedbackTheme =
  | 'overtime_pay'
  | 'supervisor_conduct'
  | 'rest_breaks'
  | 'safety_gear'
  | 'drinking_water_toilets'
  | 'shift_scheduling'
  | 'other';

export type RemovedPiiCategory = 'name' | 'place' | 'time' | 'phone_id' | 'personal_detail';

export interface AnonymousFeedbackEntry {
  id: string;
  workplaceId: string;
  team: string;
  cleanText: string;
  cleanTextEnglish: string;
  removed: RemovedPiiCategory[];
  themes: FeedbackTheme[];
  sentiment: number; // -1 to 1
  createdAt: string;
}

// Fatigue & Attrition
export type RiskLevel = 'low' | 'medium' | 'high';

export interface FatigueAttritionSignal {
  workerId: string;
  workerName: string;
  role: string;
  fatigueLevel: RiskLevel;
  fatigueReasons: string[];
  attritionLevel: RiskLevel;
  attritionReasons: string[];
  consecutiveDays: number;
  rolling7dHours: number;
  minRestGapHours: number;
  ruleRefs: RuleDefinition[];
}

// Fact Check
export interface CitedFact {
  ref: string;
  value: number;
}
