import type {
  WorkerProfile,
  ShiftRecord,
  OvertimeClaim,
  FatigueAttritionSignal,
  RiskLevel,
} from '../types.js';
import { computeShiftDurationHours, parseTimeMinutes, roundHours } from './hours.js';
import { getRule } from './index.js';

function daysBetweenIsoDates(dateA: string, dateB: string): number {
  const msA = Date.parse(`${dateA}T00:00:00Z`);
  const msB = Date.parse(`${dateB}T00:00:00Z`);
  return Math.round((msB - msA) / (24 * 3600 * 1000));
}

function formatShortDate(isoDate: string): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return `${d} ${months[m] ?? ''}`.trim();
}

export function evaluateWorkerFatigueAndAttrition(
  worker: WorkerProfile,
  shifts: ShiftRecord[],
  claims: OvertimeClaim[]
): FatigueAttritionSignal {
  const ruleCtx = { sector: worker.sector, country: worker.country, region: worker.region };
  const restGapRule = getRule(ruleCtx, 'rest.minGapHours');
  const maxConsecRule = getRule(ruleCtx, 'fatigue.maxConsecutiveDays');
  const maxRollingRule = getRule(ruleCtx, 'fatigue.maxRolling7dHours');

  const completed = shifts
    .filter((s) => Boolean(s.checkInTime && s.checkOutTime))
    .sort((a, b) => a.date.localeCompare(b.date));

  const fatigueReasons: string[] = [];
  /** The same reasons as codes, so each language can say them its own way. */
  const why: { code: string; args: number[] }[] = [];
  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < completed.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const diffDays = daysBetweenIsoDates(completed[i - 1].date, completed[i].date);
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }

  if (maxStreak > maxConsecRule.value) {
    fatigueReasons.push(`${maxStreak} days in a row`);
    why.push({ code: 'streak', args: [maxStreak] });
  }

  // Rolling 7-day hours (check last 7 calendar days up to most recent shift)
  let maxRolling7dHours = 0;
  for (let i = 0; i < completed.length; i++) {
    const endDate = completed[i].date;
    let windowSum = 0;
    for (let j = i; j >= 0; j--) {
      const gap = daysBetweenIsoDates(completed[j].date, endDate);
      if (gap < 7) {
        const { hours } = computeShiftDurationHours(
          completed[j].checkInTime,
          completed[j].checkOutTime!
        );
        windowSum = roundHours(windowSum + hours);
      } else {
        break;
      }
    }
    if (windowSum > maxRolling7dHours) {
      maxRolling7dHours = windowSum;
    }
  }

  if (maxRolling7dHours > maxRollingRule.value) {
    fatigueReasons.push(`${maxRolling7dHours} h in last 7 days`);
    why.push({ code: 'rolling', args: [maxRolling7dHours] });
  }

  // Rest gap between consecutive shifts
  let minRestGapHours = 24;
  let minGapDate = '';

  for (let i = 1; i < completed.length; i++) {
    const prev = completed[i - 1];
    const curr = completed[i];
    const dayDiff = daysBetweenIsoDates(prev.date, curr.date);
    if (dayDiff === 1) {
      const prevInMin = parseTimeMinutes(prev.checkInTime);
      const prevOutMin = parseTimeMinutes(prev.checkOutTime!);
      const prevCrossedMidnight = prevOutMin < prevInMin;
      const prevEndMinutesFromPrevDayStart = prevCrossedMidnight
        ? 24 * 60 + prevOutMin
        : prevOutMin;
      const currStartMinutesFromPrevDayStart = 24 * 60 + parseTimeMinutes(curr.checkInTime);
      const restMinutes = currStartMinutesFromPrevDayStart - prevEndMinutesFromPrevDayStart;
      const restHours = roundHours(Math.max(0, restMinutes / 60));
      if (restHours < minRestGapHours) {
        minRestGapHours = restHours;
        minGapDate = curr.date;
      }
    }
  }

  if (minRestGapHours < restGapRule.value && minGapDate) {
    fatigueReasons.push(`rest gap ${minRestGapHours} h on ${formatShortDate(minGapDate)}`);
    why.push({ code: 'restGap', args: [minRestGapHours] });
  }

  let fatigueLevel: RiskLevel = 'low';
  if (fatigueReasons.length >= 2 || maxStreak > maxConsecRule.value || minRestGapHours < 8) {
    fatigueLevel = 'high';
  } else if (fatigueReasons.length === 1) {
    fatigueLevel = 'medium';
  }

  // Attrition signals (strictly never using anonymous feedback!)
  const attritionReasons: string[] = [];

  if (worker.otTrend3Weeks) {
    const [w1, w2, w3] = worker.otTrend3Weeks;
    if (w1 < w2 && w2 < w3) {
      attritionReasons.push(`overtime rising 3 weeks in a row (${w1}h → ${w2}h → ${w3}h)`);
      why.push({ code: 'otRising', args: [w1, w2, w3] });
    }
  }

  if ((worker.missedShifts14d ?? 0) >= 2) {
    attritionReasons.push(`${worker.missedShifts14d} missed shifts in 14 days`);
    why.push({ code: 'missed', args: [worker.missedShifts14d ?? 0] });
  }

  if (fatigueReasons.length >= 2) {
    attritionReasons.push('repeated fatigue alerts');
    why.push({ code: 'repeatedFatigue', args: [] });
  }

  const disputedClaims = claims.filter(
    (c) =>
      c.workerId === worker.id &&
      (c.matchStatus !== 'supported' ||
        c.resolutionStatus === 'pending' ||
        c.resolutionStatus === 'rejected')
  );
  if (disputedClaims.length > 0) {
    attritionReasons.push(`${disputedClaims.length} disputed overtime/edit claim(s)`);
    why.push({ code: 'disputed', args: [disputedClaims.length] });
  }

  let attritionLevel: RiskLevel = 'low';
  if (attritionReasons.length >= 2) {
    attritionLevel = 'high';
  } else if (attritionReasons.length === 1) {
    attritionLevel = 'medium';
  }

  return {
    workerId: worker.id,
    workerName: worker.name,
    role: worker.role,
    fatigueLevel,
    fatigueReasons,
    why,
    attritionLevel,
    attritionReasons,
    consecutiveDays: maxStreak,
    rolling7dHours: maxRolling7dHours,
    minRestGapHours,
    ruleRefs: [restGapRule, maxConsecRule, maxRollingRule],
  };
}
