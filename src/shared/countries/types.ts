import type { RuleDefinition, SectorId } from '../types.js';
import type { LeaveType } from '../model.js';

export type CountryId =
  'IN' | 'JP' | 'KR' | 'CN' | 'FR' | 'DE' | 'ES' | 'MX' | 'BR' | 'PT' | 'GB' | 'US';

export const COUNTRY_IDS: CountryId[] = [
  'IN',
  'JP',
  'KR',
  'CN',
  'FR',
  'DE',
  'ES',
  'MX',
  'BR',
  'PT',
  'GB',
  'US',
];

export type PayCycle = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

/** Overtime hours up to `upTo` (cumulative within the band's scope) are paid at `multiplier`. */
export interface Band {
  upTo: number | null;
  multiplier: number;
}

/**
 * How time beyond normal hours is counted and priced. Every number here also
 * appears, with its legal source, in the pack's `rules`.
 */
export interface OvertimeModel {
  /** Hours in a day after which time counts as overtime; null where only the week counts. */
  daily: number | null;
  /** Normal hours in a week. Dated steps for laws that change over time. */
  weekly: number | { from: string; hours: number }[];
  /** What the bands count over: one day's overtime, the week's, or the calendar month's. */
  scope: 'day' | 'week' | 'month';
  bands: Band[];
  /** Higher bands once overtime in the calendar year passes a threshold (Portugal). */
  escalation?: { afterYearHours: number; bands: Band[]; restDayBands?: Band[] };
  /** Work on rest days, paid per day at these bands and kept out of the overtime count. */
  restDay?: { which: 'legal' | 'all'; bands: Band[] };
  /** Work on public holidays the employer has listed, kept out of the overtime count. */
  holiday?: Band[];
  /** The seventh consecutive day worked in one workweek (California). */
  seventhDay?: Band[];
  /** Extra pay for night hours, on top of whatever else the hour earns. */
  night?: { start: string; end: string; premium: number; hourMinutes?: number };
  /** Extra for any hour worked on a Sunday (Mexico, prima dominical). */
  sundayPremium?: number;
  /** First day of the workweek, 0 = Sunday. */
  weekStart: number;
}

export interface LeaveTypeConfig {
  type: LeaveType;
  paid: boolean;
  /** Days a year: fixed, from length of service, or none (taken as needed). */
  entitlement?: number | 'service';
  /** Rule in `rules` that sets or explains this leave. */
  rule?: string;
  /** Counted in calendar days, not working days (Brazilian férias). */
  calendarDays?: boolean;
}

export interface LeaveConfig {
  types: LeaveTypeConfig[];
  /** Annual leave the employer must make sure is actually taken each year (Japan: 5 days). */
  minTaken?: { days: number; ifEntitledAtLeast: number; rule: string };
  /** Statutory annual leave from length of service, as of `today`. */
  annualByService?: (serviceFrom: string, today: string) => number;
}

export interface ComplaintConfig {
  /** Employers with at least this many people must name complaint handlers. 1 means every employer. */
  handlersRequiredFrom: number;
  /** The handlers have a presiding officer (India's Internal Committee). */
  presiding: boolean;
  /** An inquiry still open after this many days is overdue. */
  inquiryDays?: number;
  /** Time limit to go to an outside body, for information. */
  outsideLimitDays?: number;
  /** Outside bodies a worker can go to; names come from the country strings `ext_<key>`. */
  external: { key: string; url: string }[];
}

export interface LimitMeter {
  id: string;
  /** `overtimeAndRestDay` adds rest-day and holiday work to overtime (Japan's 100-hour cap). */
  metric: 'total' | 'overtime' | 'overtimeAndRestDay';
  window: 'day' | 'week' | 'month' | 'year' | 'avgWeeks';
  /** For `avgWeeks`: how many weeks are averaged. */
  weeks?: number;
  cap: number;
  /** Rule in `rules` with the legal source. */
  rule: string;
}

export interface AnnualPayment {
  code: string;
  /** Latest date in the year, MM-DD; unset when it is tied to an event (before holidays). */
  due?: string;
  rule: string;
  /** Rough size for salaried staff: a fraction of monthly salary, or days of salary. */
  estimate?: { monthlySalary: number } | { days: number };
}

export type PayDeadline =
  | { kind: 'daysAfterEnd'; days: number }
  | { kind: 'businessDaysAfterEnd'; days: number }
  | { kind: 'payDay' };

export interface CountryRegion {
  id: string;
  name: string;
  timezone?: string;
  rules?: Record<string, RuleDefinition>;
  overtime?: Partial<OvertimeModel>;
  leave?: Partial<LeaveConfig>;
  complaints?: Partial<ComplaintConfig>;
  limits?: LimitMeter[];
}

/** A nightly window such as 22:00–05:00. */
export interface NightWindow {
  from: string;
  to: string;
}

/**
 * Rules that protect students and young workers. Visa caps count every job a
 * student holds, not one employer's hours.
 */
export interface StudentRules {
  /** Work allowed on a student visa or residence permit. */
  visa?: {
    /** Hours in any 7 days during term. */
    weekly?: number;
    /** Only weekday hours count (Korea: weekends are not capped). */
    weekdaysOnly?: boolean;
    /** During official school breaks: a weekly cap, or null for none. Term rules apply if unset. */
    breakWeekly?: number | null;
    /** During official school breaks: hours per day. */
    breakDaily?: number;
    /** Hours in a calendar year (France: 964). */
    yearlyHours?: number;
    /** Days in a calendar year, a half day being at most `halfMaxHours` (Germany: 140 full or 280 half). */
    yearDays?: { full: number; halfMaxHours: number };
    rule: string;
  };
  /** Workers under `age`. */
  minors?: {
    age: number;
    daily?: number;
    weekly?: number;
    night?: NightWindow;
    noOvertime?: boolean;
    /** Tighter rules below 16. */
    under16?: { daily?: number; weekly?: number; weeklyBreak?: number; night?: NightWindow };
    rule: string;
  };
}

export interface CountryPack {
  id: CountryId;
  /** Currency code for pay, ISO 4217. */
  currency: string;
  phonePrefix: string;
  timezone: string;
  timezones?: string[];
  weeklyOff: number[];
  pay: {
    cycles: PayCycle[];
    defaultCycle: Record<SectorId, PayCycle>;
    deadline: PayDeadline;
    /** Statutory or customary deductions offered when setting up a payslip; labels in `ded_<code>`. */
    deductions: string[];
    annual: AnnualPayment[];
    /** Paid weekly rest day for hourly and daily workers above a weekly minimum (Korea, 주휴수당). */
    weeklyRestPay?: { minWeeklyHours: number };
  };
  overtime: OvertimeModel;
  leave: LeaveConfig;
  complaints: ComplaintConfig;
  /** Legal limits shown to workers and employers, most important first. */
  limits: LimitMeter[];
  /** Student visa caps and under-18 protections. */
  students?: StudentRules;
  rules: Record<string, RuleDefinition>;
  regions?: CountryRegion[];
}
