import type {
  Workplace,
  WorkerProfile,
  ShiftRecord,
  OvertimeClaim,
  HazardReport,
  FatigueAttritionSignal,
} from '../../shared/types.js';
import type { GroupFeedbackVisibility } from '../../shared/rules/anonymity.js';

/** Shapes returned by GET /api/admin/dashboard/:workplaceId. */

export interface HotspotItem {
  zoneId: string;
  zoneName: string;
  code: string;
  icon: string;
  reportCount14d: number;
  threshold: number;
  isHotspot: boolean;
}

export interface WorkerSummaryItem {
  worker: WorkerProfile;
  shifts: ShiftRecord[];
  chainOk: boolean;
  normalHours: number;
  otHours: number;
  otAmountOwed: number;
  netPay: number;
  todayAttendance: 'checked_in' | 'late' | 'absent';
  todayCheckIn: string | null;
}

export interface DashboardPayload {
  workplace: Workplace;
  todayDate: string;
  disputes: OvertimeClaim[];
  hazards: HazardReport[];
  hotspots: HotspotItem[];
  fatigueSignals: FatigueAttritionSignal[];
  overtimeSummary: {
    totalHours: number;
    totalAmount: number;
    workers: WorkerSummaryItem[];
  };
  feedbackGroups: GroupFeedbackVisibility[];
  attendanceToday: {
    checkedIn: number;
    late: number;
    absent: number;
    total: number;
  };
}
