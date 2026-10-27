import { describe, it, expect } from 'vitest';
import type { ShiftRecord } from '../../src/shared/types.js';
import { calculateWeekHours } from '../../src/shared/rules/hours.js';
import { calculatePayslip } from '../../src/shared/rules/pay.js';
import { append, verify, verifyAsync, latestView } from '../../src/shared/ledger/ledger.js';
import { matchClaimAgainstLedger } from '../../src/shared/rules/claims.js';
import { evaluateSeverityFloor } from '../../src/shared/rules/severity.js';
import { evaluateGroupAnonymity } from '../../src/shared/rules/anonymity.js';
import { check } from '../../src/shared/rules/factcheck.js';
import { evaluateWorkerFatigueAndAttrition } from '../../src/shared/rules/fatigue.js';
import {
  checkInOutInputSchema,
  aiClaimRequestSchema,
  adminEditShiftSchema,
  audioBase64Schema,
} from '../../src/shared/schemas.js';
import { buildSeedSnapshot } from '../../src/server/store/seed.js';

function makeShift(
  date: string,
  checkInTime: string,
  checkOutTime: string,
  workerId = 'w-test'
): ShiftRecord {
  return {
    date,
    workerId,
    checkInEventId: `in-${date}`,
    checkOutEventId: `out-${date}`,
    checkInTime,
    checkOutTime,
    originalCheckInTime: checkInTime,
    originalCheckOutTime: checkOutTime,
    zoneCode: 'TB-GATE',
    source: 'qr',
    edits: [],
  };
}

describe('hours.ts — normal, daily OT, weekly OT without double-counting, and night shifts', () => {
  it('handles empty week', () => {
    const res = calculateWeekHours([], 'construction');
    expect(res.normalHours).toBe(0);
    expect(res.otHours).toBe(0);
    expect(res.perDay).toHaveLength(0);
  });

  it('splits normal 8h days and daily overtime beyond 8h', () => {
    const shifts = [
      makeShift('2026-10-19', '09:00', '17:00'), // 8h normal, 0 OT
      makeShift('2026-10-20', '09:00', '19:30'), // 8h normal, 2.5h daily OT
    ];
    const res = calculateWeekHours(shifts, 'construction');
    expect(res.normalHours).toBe(16);
    expect(res.dailyOtHours).toBe(2.5);
    expect(res.otHours).toBe(2.5);
  });

  it('calculates weekly overtime beyond 48h without double-counting daily overtime', () => {
    // 7 days of 9 hours each = 7 * (8h normal + 1h daily OT) = 56h normal-capped + 7h daily OT
    // Weekly normal cap is 48h -> 56 - 48 = 8h weeklyExtraOtHours
    // Total OT = 7h daily OT + 8h weekly extra OT = 15h (48 normal + 15 OT = 63 total hours)
    const dates = [
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ];
    const shifts = dates.map((d) => makeShift(d, '09:00', '18:00'));
    const res = calculateWeekHours(shifts, 'construction');
    expect(res.normalHours).toBe(48);
    expect(res.dailyOtHours).toBe(7);
    expect(res.weeklyExtraOtHours).toBe(8);
    expect(res.otHours).toBe(15);
    expect(res.totalHours).toBe(63);
  });

  it('handles night shifts crossing midnight and assigns them to start date', () => {
    const shifts = [makeShift('2026-10-20', '20:00', '08:00')]; // 12h shift crossing midnight
    const res = calculateWeekHours(shifts, 'campus');
    expect(res.perDay[0].date).toBe('2026-10-20');
    expect(res.perDay[0].crossesMidnight).toBe(true);
    expect(res.perDay[0].totalHours).toBe(12);
    expect(res.normalHours).toBe(8);
    expect(res.otHours).toBe(4);
  });
});

describe('pay.ts — 2x overtime rate, approved claims, and flagged deductions', () => {
  it('computes overtime at 2x rate, includes approved claims, and flags unexplained deductions', () => {
    const shifts = [
      makeShift('2026-10-19', '09:00', '17:00'), // 8h normal
      makeShift('2026-10-20', '09:00', '19:00'), // 8h normal + 2h OT
    ];
    const hoursResult = calculateWeekHours(shifts, 'construction');
    const slip = calculatePayslip({
      workerId: 'w-murugan',
      weekLabel: '19 Oct – 25 Oct 2026',
      sector: 'construction',
      hourlyRate: 100,
      hoursResult,
      approvedClaimHours: 1.5,
      deductions: [
        { id: 'd1', type: 'Canteen', amount: 100, reason: 'Meals' },
        { id: 'd2', type: 'Fine', amount: 250, reason: '' }, // missing reason -> flagged
      ],
    });

    // Normal: 16h * 100 = 1600
    // OT: 2h * 200 = 400
    // Claim OT: 1.5h * 200 = 300
    // Gross = 2300, Deductions = 350, Net = 1950
    expect(slip.grossPay).toBe(2300);
    expect(slip.totalDeductions).toBe(350);
    expect(slip.netPay).toBe(1950);
    expect(slip.flaggedDeductionsCount).toBe(1);
    const flaggedLine = slip.lines.find((l) => l.flagged);
    expect(flaggedLine).toBeDefined();
    expect(flaggedLine?.ruleRef.kind).toBe('law');
  });
});

describe('ledger.ts — SHA-256 hash chain, append, verify, tamper detection, and latestView', () => {
  it('appends events, verifies chain integrity, and detects any tampered event', async () => {
    let chain = append([], {
      id: 'ev-1',
      workerId: 'w-murugan',
      type: 'CHECK_IN',
      createdAt: '2026-10-20T09:00:00Z',
      payload: { date: '2026-10-20', timestamp: '09:00', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-2',
      workerId: 'w-murugan',
      type: 'CHECK_OUT',
      createdAt: '2026-10-20T20:40:00Z',
      payload: { date: '2026-10-20', timestamp: '20:40', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-3',
      workerId: 'w-murugan',
      type: 'EDIT',
      createdAt: '2026-10-21T08:00:00Z',
      payload: {
        targetEventId: 'ev-2',
        field: 'timestamp',
        oldValue: '20:40',
        newValue: '18:00',
        reason: 'Site closed early',
        editorId: 'sup-1',
        editorName: 'Supervisor Ravi',
      },
    });

    expect(verify(chain)).toEqual({ ok: true });
    expect(await verifyAsync(chain)).toEqual({ ok: true });

    const shifts = latestView(chain);
    expect(shifts).toHaveLength(1);
    expect(shifts[0].originalCheckOutTime).toBe('20:40');
    expect(shifts[0].checkOutTime).toBe('18:00');
    expect(shifts[0].edits).toHaveLength(1);

    // Tamper with event #1 (index 1) checkout time without updating hash chain
    const tampered = structuredClone(chain);
    (tampered[1].payload as { timestamp: string }).timestamp = '17:00';
    expect(verify(tampered)).toEqual({ ok: false, brokenAt: 1 });
  });
});

describe('claims.ts — supported, partly_supported, unsupported, and ±15-minute tolerance', () => {
  const shifts = [
    makeShift('2026-10-24', '09:00', '18:50'), // 9h 50m total -> 1.83h extra
  ];

  it('marks claim supported when within ±15-minute tolerance (claiming 2h against 1h 50m recorded)', () => {
    const res = matchClaimAgainstLedger(
      { date: '2026-10-24', extraHours: 2, reason: 'Slab pour' },
      shifts,
      'construction'
    );
    expect(res.status).toBe('supported');
    expect(res.supportedHours).toBe(2);
  });

  it('marks claim partly_supported when recorded overtime covers part of the claim', () => {
    const res = matchClaimAgainstLedger(
      { date: '2026-10-24', extraHours: 4, reason: 'Slab pour' },
      shifts,
      'construction'
    );
    expect(res.status).toBe('partly_supported');
    expect(res.supportedHours).toBe(1.83);
  });

  it('marks claim unsupported when no overtime was recorded', () => {
    const normalDay = [makeShift('2026-10-21', '09:00', '17:00')];
    const res = matchClaimAgainstLedger(
      { date: '2026-10-21', extraHours: 2, reason: 'Cleaning' },
      normalDay,
      'construction'
    );
    expect(res.status).toBe('unsupported');
    expect(res.supportedHours).toBe(0);
  });
});

describe('severity.ts — severity floor cannot be lowered by AI', () => {
  it('enforces high floor on electrical and fall_from_height even if AI says low', () => {
    const res1 = evaluateSeverityFloor('construction', 'electrical', 'low');
    expect(res1.finalSeverity).toBe('high');
    expect(res1.floorApplied).toBe(true);

    const res2 = evaluateSeverityFloor('campus', 'gas_leak', 'medium');
    expect(res2.finalSeverity).toBe('high');
    expect(res2.floorApplied).toBe(true);

    // AI can still raise to critical
    const res3 = evaluateSeverityFloor('construction', 'electrical', 'critical');
    expect(res3.finalSeverity).toBe('critical');
    expect(res3.floorApplied).toBe(false);
  });
});

describe('anonymity.ts — hidden below 5 responses, visible at 5 or more', () => {
  it('hides group feedback at 4 responses and reveals at 5', () => {
    const sample = Array.from({ length: 4 }, (_, i) => ({
      id: `f-${i}`,
      workplaceId: 'wp-campus',
      team: 'Security',
      cleanText: 'Test',
      cleanTextEnglish: 'Test',
      removed: [],
      themes: ['rest_breaks' as const],
      sentiment: -0.5,
      createdAt: '2026-10-26T00:00:00Z',
    }));

    const below = evaluateGroupAnonymity('wp-campus', 'Security', sample);
    expect(below.visible).toBe(false);
    expect(below.entries).toHaveLength(0);
    expect(below.statusMessage).toContain('(4/5)');

    const atFive = evaluateGroupAnonymity('wp-campus', 'Security', [
      ...sample,
      { ...sample[0], id: 'f-5' },
    ]);
    expect(atFive.visible).toBe(true);
    expect(atFive.entries).toHaveLength(5);
  });
});

describe('factcheck.ts — pass, wrong number, and uncited number', () => {
  const truth = {
    normalHours: 40,
    otHours: 5.5,
    netPay: 4850.5,
  };

  it('passes when all cited numbers match truth and text numbers are cited', () => {
    const res = check(
      [
        { ref: 'normalHours', value: 40 },
        { ref: 'otHours', value: 5.5 },
        { ref: 'netPay', value: 4850.5 },
      ],
      truth,
      'You worked 40 normal hours and 5.5 overtime hours for a net pay of ₹4850.5.'
    );
    expect(res.passed).toBe(true);
  });

  it('fails when AI states a wrong money figure', () => {
    const res = check([{ ref: 'netPay', value: 4900 }], truth, 'Your net pay is ₹4900.');
    expect(res.passed).toBe(false);
  });

  it('fails when AI answer contains an uncited number', () => {
    const res = check(
      [{ ref: 'normalHours', value: 40 }],
      truth,
      'You worked 40 normal hours and received ₹9999 bonus.'
    );
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('uncited number');
  });
});

describe('fatigue.ts & seed.ts — Lakshmi 7 nights + 6h rest gap', () => {
  it('flags high fatigue for Lakshmi in seed data', () => {
    const seed = buildSeedSnapshot();
    const lakshmi = seed.workers.find((w) => w.id === 'w-lakshmi')!;
    const shifts = latestView(seed.chains['w-lakshmi']);
    const signal = evaluateWorkerFatigueAndAttrition(lakshmi, shifts, seed.claims);
    expect(signal.fatigueLevel).toBe('high');
    expect(signal.consecutiveDays).toBe(7);
    expect(signal.minRestGapHours).toBe(6);
    expect(signal.fatigueReasons.join(' | ')).toContain('7 days in a row');
    expect(signal.fatigueReasons.join(' | ')).toContain('rest gap 6 h on 24 Oct');
  });
});

describe('schemas.ts — validates valid and invalid inputs', () => {
  it('accepts valid check-in and rejects empty reason on shift edit', () => {
    const ok = checkInOutInputSchema.safeParse({
      workerId: 'w-murugan',
      action: 'CHECK_IN',
      zoneCode: 'TB-GATE',
    });
    expect(ok.success).toBe(true);

    const badEdit = adminEditShiftSchema.safeParse({
      workerId: 'w-murugan',
      targetEventId: 'ev-1',
      newTimestamp: '18:00',
      reason: '',
    });
    expect(badEdit.success).toBe(false);

    const emptyClaim = aiClaimRequestSchema.safeParse({
      workerId: 'w-murugan',
      lang: 'ta',
    });
    expect(emptyClaim.success).toBe(false);

    const hugeAudio = audioBase64Schema.safeParse('a'.repeat(3_000_000));
    expect(hugeAudio.success).toBe(false);
  });
});
