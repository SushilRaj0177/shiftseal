import { describe, it, expect } from 'vitest';
import { matchClaimAgainstLedger } from '../../src/shared/rules/claims.js';
import type { ShiftRecord } from '../../src/shared/types.js';

function makeShift(
  date: string,
  checkInTime: string,
  checkOutTime: string,
  edits: ShiftRecord['edits'] = []
): ShiftRecord {
  return {
    date,
    workerId: 'w-murugan',
    checkInEventId: `in-${date}`,
    checkOutEventId: `out-${date}`,
    checkInTime,
    checkOutTime,
    originalCheckInTime: checkInTime,
    originalCheckOutTime: edits.length > 0 ? edits[0].oldValue : checkOutTime,
    zoneCode: 'TB-SCAF-B',
    source: 'qr',
    edits,
  };
}

describe('claims.ts', () => {
  it('returns supported when recorded overtime >= claimed extra hours', () => {
    const shifts = [makeShift('2026-10-24', '09:00', '20:40')]; // 11.67h total -> 3.67h extra
    const res = matchClaimAgainstLedger(
      { date: '2026-10-24', extraHours: 2, reason: 'Slab pour' },
      shifts,
      'construction'
    );
    expect(res.status).toBe('supported');
    expect(res.supportedHours).toBe(2);
  });

  it('returns supported at the exact -15 minute (0.25h) tolerance edge', () => {
    // 09:00 to 18:45 = 9.75h total -> 1.75h extra recorded. Claiming 2.0h (diff is 0.25h = 15m)
    const shifts = [makeShift('2026-10-24', '09:00', '18:45')];
    const res = matchClaimAgainstLedger(
      { date: '2026-10-24', extraHours: 2, reason: 'Slab pour' },
      shifts,
      'construction'
    );
    expect(res.status).toBe('supported');
    expect(res.supportedHours).toBe(2);
  });

  it('returns partly_supported when shortfall exceeds 15-minute tolerance (e.g. 20 min short)', () => {
    // 09:00 to 18:40 = 9.67h total -> 1.67h extra recorded. Claiming 2.0h (diff is 0.33h > 0.25h)
    const shifts = [makeShift('2026-10-24', '09:00', '18:40')];
    const res = matchClaimAgainstLedger(
      { date: '2026-10-24', extraHours: 2, reason: 'Slab pour' },
      shifts,
      'construction'
    );
    expect(res.status).toBe('partly_supported');
    expect(res.supportedHours).toBe(1.67);
  });

  it('returns unsupported when shift had 0 extra hours', () => {
    const shifts = [makeShift('2026-10-21', '09:00', '17:00')];
    const res = matchClaimAgainstLedger(
      { date: '2026-10-21', extraHours: 2, reason: 'Cleaning' },
      shifts,
      'construction'
    );
    expect(res.status).toBe('unsupported');
    expect(res.supportedHours).toBe(0);
  });

  it('returns unsupported when no shift receipt exists on the claimed date', () => {
    const res = matchClaimAgainstLedger(
      { date: '2026-10-18', extraHours: 3, reason: 'Sunday work' },
      [],
      'construction'
    );
    expect(res.status).toBe('unsupported');
    expect(res.evidence.explanation).toContain('No completed check-in/check-out receipt found');
  });

  it('includes supervisor edit context in evidence when an edited shift is disputed', () => {
    const editedShift = makeShift('2026-10-20', '09:00', '18:00', [
      {
        editEventId: 'ed-1',
        targetEventId: 'out-2026-10-20',
        field: 'timestamp',
        oldValue: '20:40',
        newValue: '18:00',
        reason: 'Standard closing adjustment',
        editorId: 'sup-1',
        editorName: 'Supervisor Ravi',
        createdAt: '2026-10-21T07:30:00Z',
      },
    ]);
    const res = matchClaimAgainstLedger(
      { date: '2026-10-20', extraHours: 3.5, reason: 'Stayed until 20:40' },
      [editedShift],
      'construction'
    );
    expect(res.evidence.hadSupervisorEdit).toBe(true);
    expect(res.evidence.originalCheckOut).toBe('20:40');
    expect(res.evidence.editReason).toBe('Standard closing adjustment');
  });
});
