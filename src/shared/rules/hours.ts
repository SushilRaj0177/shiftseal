import type {
  ShiftRecord,
  SectorId,
  HoursCalculationResult,
  DayHoursBreakdown,
} from '../types.js';
import { getRule } from './index.js';

export function parseTimeMinutes(timeStr: string): number {
  // Accepts "HH:mm" or ISO string containing "THH:mm"
  const match = /(\d{1,2}):(\d{2})/.exec(timeStr);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export function roundHours(val: number): number {
  return Math.round(val * 100) / 100;
}

export function computeShiftDurationHours(
  checkInTime: string,
  checkOutTime: string
): { hours: number; crossesMidnight: boolean } {
  const inMin = parseTimeMinutes(checkInTime);
  const outMin = parseTimeMinutes(checkOutTime);
  let diffMin = outMin - inMin;
  let crossesMidnight = false;
  if (diffMin < 0) {
    diffMin += 24 * 60;
    crossesMidnight = true;
  }
  return {
    hours: roundHours(diffMin / 60),
    crossesMidnight,
  };
}

export function calculateWeekHours(
  shifts: ShiftRecord[],
  sector: SectorId = 'construction'
): HoursCalculationResult {
  const dailyRule = getRule(sector, 'hours.daily');
  const weeklyRule = getRule(sector, 'ot.weekly');
  const dailyLimit = dailyRule.value; // 8
  const weeklyLimit = weeklyRule.value; // 48

  const perDay: DayHoursBreakdown[] = [];
  let sumDailyNormal = 0;
  let sumDailyOt = 0;

  const completedShifts = shifts
    .filter((s) => Boolean(s.checkInTime && s.checkOutTime))
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const s of completedShifts) {
    const outTime = s.checkOutTime!;
    const { hours, crossesMidnight } = computeShiftDurationHours(s.checkInTime, outTime);
    const normalForDay = roundHours(Math.min(hours, dailyLimit));
    const otForDay = roundHours(Math.max(0, hours - dailyLimit));

    sumDailyNormal = roundHours(sumDailyNormal + normalForDay);
    sumDailyOt = roundHours(sumDailyOt + otForDay);

    const refs = [s.checkInEventId];
    if (s.checkOutEventId) refs.push(s.checkOutEventId);

    perDay.push({
      date: s.date,
      totalHours: hours,
      normalHours: normalForDay,
      dailyOtHours: otForDay,
      checkInTime: s.checkInTime,
      checkOutTime: outTime,
      crossesMidnight,
      shiftRefs: refs,
    });
  }

  // Weekly overtime is time beyond 48 hours AFTER removing hours already counted as daily overtime
  const weeklyExtraOtHours = roundHours(Math.max(0, sumDailyNormal - weeklyLimit));
  const finalNormalHours = roundHours(Math.min(sumDailyNormal, weeklyLimit));
  const totalOtHours = roundHours(sumDailyOt + weeklyExtraOtHours);
  const totalHours = roundHours(finalNormalHours + totalOtHours);

  return {
    normalHours: finalNormalHours,
    otHours: totalOtHours,
    dailyOtHours: sumDailyOt,
    weeklyExtraOtHours,
    totalHours,
    perDay,
    ruleRefs: [dailyRule, weeklyRule],
  };
}
