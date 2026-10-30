import type { ShiftRecord, ClaimMatchStatus, ClaimEvidence, SectorId } from '../types.js';
import {
  computeShiftDurationHours,
  dailyHoursOf,
  roundHours,
  type WorkplaceHours,
} from './hours.js';

export interface ClaimMatchInput {
  date: string; // YYYY-MM-DD
  extraHours: number;
  reason: string;
}

export interface ClaimMatchResult {
  status: ClaimMatchStatus;
  supportedHours: number;
  evidence: ClaimEvidence;
}

const TOLERANCE_HOURS = 15 / 60; // ±15 minutes (0.25h)

export function matchClaimAgainstLedger(
  claim: ClaimMatchInput,
  shifts: ShiftRecord[],
  where: WorkplaceHours | SectorId = 'construction'
): ClaimMatchResult {
  const dailyNormalLimit = dailyHoursOf(where);
  const shift = shifts.find((s) => s.date === claim.date);

  if (!shift || !shift.checkInTime || !shift.checkOutTime) {
    return {
      status: 'unsupported',
      supportedHours: 0,
      evidence: {
        shiftDate: claim.date,
        recordedExtraHours: 0,
        claimedExtraHours: claim.extraHours,
        supportedExtraHours: 0,
        hadSupervisorEdit: false,
        explanation: `No completed check-in/check-out receipt found on ${claim.date}. Sent for supervisor dispute resolution.`,
      },
    };
  }

  const currentDuration = computeShiftDurationHours(shift.checkInTime, shift.checkOutTime).hours;
  const currentExtra = roundHours(Math.max(0, currentDuration - dailyNormalLimit));

  const hadEdit = shift.edits.length > 0;
  const lastEdit = hadEdit ? shift.edits[shift.edits.length - 1] : undefined;

  // Check if original check-out before a supervisor edit also existed for context
  const originalOut = shift.originalCheckOutTime ?? shift.checkOutTime;
  const diff = claim.extraHours - currentExtra;

  if (currentExtra >= claim.extraHours - TOLERANCE_HOURS && currentExtra > 0) {
    return {
      status: 'supported',
      supportedHours: claim.extraHours,
      evidence: {
        shiftDate: claim.date,
        recordedCheckIn: shift.checkInTime,
        recordedCheckOut: shift.checkOutTime,
        originalCheckOut: originalOut,
        recordedExtraHours: currentExtra,
        claimedExtraHours: claim.extraHours,
        supportedExtraHours: claim.extraHours,
        hadSupervisorEdit: hadEdit,
        editReason: lastEdit?.reason,
        explanation: `Verified by shift receipt (${shift.checkInTime}–${shift.checkOutTime}, ${currentExtra}h extra recorded; within ±15 min tolerance).`,
      },
    };
  }

  if (currentExtra > 0 && diff > TOLERANCE_HOURS) {
    return {
      status: 'partly_supported',
      supportedHours: currentExtra,
      evidence: {
        shiftDate: claim.date,
        recordedCheckIn: shift.checkInTime,
        recordedCheckOut: shift.checkOutTime,
        originalCheckOut: originalOut,
        recordedExtraHours: currentExtra,
        claimedExtraHours: claim.extraHours,
        supportedExtraHours: currentExtra,
        hadSupervisorEdit: hadEdit,
        editReason: lastEdit?.reason,
        explanation: `Shift receipt (${shift.checkInTime}–${shift.checkOutTime}) covers ${currentExtra}h of the ${claim.extraHours}h claimed.`,
      },
    };
  }

  const editNote = hadEdit
    ? ` Note: original checkout (${originalOut}) was edited to ${shift.checkOutTime} by ${lastEdit?.editorName ?? 'supervisor'} ("${lastEdit?.reason ?? ''}").`
    : '';

  return {
    status: 'unsupported',
    supportedHours: 0,
    evidence: {
      shiftDate: claim.date,
      recordedCheckIn: shift.checkInTime,
      recordedCheckOut: shift.checkOutTime,
      originalCheckOut: originalOut,
      recordedExtraHours: currentExtra,
      claimedExtraHours: claim.extraHours,
      supportedExtraHours: 0,
      hadSupervisorEdit: hadEdit,
      editReason: lastEdit?.reason,
      explanation: `Current shift receipt (${shift.checkInTime}–${shift.checkOutTime}) shows ${currentExtra}h overtime against ${claim.extraHours}h claimed.${editNote}`,
    },
  };
}
