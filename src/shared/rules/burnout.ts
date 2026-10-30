import type { LeaveRequest } from '../model.js';
import type { RiskLevel, ShiftRecord } from '../types.js';
import { addDays, weekdayOf } from '../time.js';
import { getRule, type RuleContext } from './index.js';

export interface BurnoutSignal {
  lateNights14d: number;
  weeklyOffDaysWorked28d: number;
  daysSinceLeave: number | null;
  level: RiskLevel;
  reasons: string[];
  why: { code: string; args: number[] }[];
}

/**
 * Burnout signals for office staff: late check-outs, work on weekly offs, and
 * long stretches without leave. Each threshold is a labelled workplace policy.
 */
export function evaluateBurnout(
  shifts: ShiftRecord[],
  leave: LeaveRequest[],
  today: string,
  weeklyOff: number[],
  where: RuleContext,
  joinedDate: string
): BurnoutSignal {
  const lateHour = getRule(where, 'burnout.lateHour').value;
  const maxLate = getRule(where, 'burnout.maxLateNights14d').value;
  const maxOff = getRule(where, 'burnout.maxWeekendDays28d').value;
  const maxNoLeave = getRule(where, 'burnout.maxDaysWithoutLeave').value;

  const since14 = addDays(today, -14);
  const since28 = addDays(today, -28);
  const lateNights14d = shifts.filter((s) => {
    if (s.date < since14 || !s.checkOutTime) return false;
    const out = Number(s.checkOutTime.slice(0, 2));
    const crossed = s.checkOutTime < s.checkInTime;
    return crossed || out >= lateHour;
  }).length;
  const weeklyOffDaysWorked28d = shifts.filter(
    (s) => s.date >= since28 && weeklyOff.includes(weekdayOf(s.date))
  ).length;

  const lastLeave = leave
    .filter((r) => r.status === 'approved' && r.type !== 'wfh' && r.to <= today)
    .map((r) => r.to)
    .sort()
    .at(-1);
  const counting = lastLeave ?? joinedDate;
  const daysSinceLeave = Math.round((Date.parse(today) - Date.parse(counting)) / 86_400_000);

  const reasons: string[] = [];
  const why: { code: string; args: number[] }[] = [];
  if (lateNights14d > maxLate) {
    reasons.push(`${lateNights14d} late nights in 14 days`);
    why.push({ code: 'lateNights', args: [lateNights14d] });
  }
  if (weeklyOffDaysWorked28d > maxOff) {
    reasons.push(`worked ${weeklyOffDaysWorked28d} days off in 28 days`);
    why.push({ code: 'daysOffWorked', args: [weeklyOffDaysWorked28d] });
  }
  if (daysSinceLeave > maxNoLeave) {
    reasons.push(`no leave in ${daysSinceLeave} days`);
    why.push({ code: 'noLeave', args: [daysSinceLeave] });
  }

  return {
    lateNights14d,
    weeklyOffDaysWorked28d,
    daysSinceLeave: lastLeave ? daysSinceLeave : null,
    level: reasons.length >= 2 ? 'high' : reasons.length === 1 ? 'medium' : 'low',
    reasons,
    why,
  };
}
