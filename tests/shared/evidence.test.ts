import { describe, it, expect } from 'vitest';
import { distanceM, evaluateFix, isValidPoint } from '../../src/shared/geo.js';
import { addDays, localParts, minutesBetween, payPeriodFor } from '../../src/shared/time.js';
import {
  exportPublicJwk,
  fromBase64Url,
  generateDeviceKey,
  signPayload,
  toBase64Url,
  verifyPayload,
} from '../../src/shared/signing.js';
import {
  assessCheck,
  assessClaim,
  assessEdit,
  assessEditorPattern,
  assessHazardReport,
  assessHazardResolution,
  assessPayment,
  hazardFixDisputed,
  reducesHours,
  type CheckInput,
} from '../../src/shared/rules/flags.js';
import type { CheckEvidence, Geofence } from '../../src/shared/model.js';

const SITE: Geofence = { center: { lat: 12.9716, lng: 80.2209 }, radiusM: 150 };
const at = '2026-10-27T03:00:00.000Z';
const near = { lat: 12.9717, lng: 80.221, accuracyM: 12, at };
const far = { lat: 13.0827, lng: 80.2707, accuracyM: 10, at }; // ~13 km away

describe('geo', () => {
  it('measures distance and places fixes relative to the site boundary', () => {
    expect(distanceM(SITE.center, SITE.center)).toBe(0);
    expect(distanceM(SITE.center, far)).toBeGreaterThan(10_000);
    expect(evaluateFix(near, SITE).verdict).toBe('inside');
    expect(evaluateFix(far, SITE).verdict).toBe('outside');
    expect(evaluateFix({ ...near, accuracyM: 500 }, SITE).verdict).toBe('uncertain');
    // Just outside, but within the fix's accuracy: not enough to call it outside.
    const edge = { lat: 12.9716 + 0.0016, lng: 80.2209, accuracyM: 40, at };
    expect(evaluateFix(edge, SITE).verdict).toBe('uncertain');
    expect(isValidPoint({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidPoint(SITE.center)).toBe(true);
  });
});

describe('time', () => {
  it('reads dates and times in the workplace time zone', () => {
    const p = localParts(new Date('2026-10-26T20:00:00Z'), 'Asia/Kolkata');
    expect(p).toEqual({ date: '2026-10-27', time: '01:30', weekday: 2 });
  });

  it('computes weekly pay periods ending the day before pay day', () => {
    expect(payPeriodFor('2026-10-27', 6)).toEqual({
      start: '2026-10-24',
      end: '2026-10-30',
      payDate: '2026-10-31',
    });
    expect(payPeriodFor('2026-10-24', 6).start).toBe('2026-10-24');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(minutesBetween('22:00', '06:00')).toBe(480);
  });
});

describe('device signatures', () => {
  it('verifies a signature from the matching key only', async () => {
    const keys = await generateDeviceKey();
    const other = await generateDeviceKey();
    const jwk = await exportPublicJwk(keys.publicKey);
    const payload = { action: 'CHECK_IN', nonce: 'abc', b: 2, a: 1 };
    const sig = await signPayload(keys.privateKey, payload);
    // Key order does not matter: payloads are canonicalised.
    expect(await verifyPayload(jwk, { a: 1, b: 2, nonce: 'abc', action: 'CHECK_IN' }, sig)).toBe(
      true
    );
    expect(await verifyPayload(jwk, { ...payload, nonce: 'abd' }, sig)).toBe(false);
    expect(await verifyPayload(await exportPublicJwk(other.publicKey), payload, sig)).toBe(false);
    expect(await verifyPayload({ kty: 'RSA' }, payload, sig)).toBe(false);
    expect(await verifyPayload(jwk, payload, 'garbage')).toBe(false);
  });

  it('round-trips base64url', () => {
    const bytes = new Uint8Array([0, 255, 62, 63, 1]);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
  });
});

describe('check evidence', () => {
  const base: CheckInput = {
    eventId: 'ev1',
    workerUid: 'u1',
    fence: SITE,
    fix: near,
    qr: 'rotating',
    qrValid: true,
    device: 'bound',
    signatureValid: true,
    integrity: 'passed',
    clientTime: at,
    serverTime: at,
  };
  const codes = (i: CheckInput) => assessCheck(i).flags.map((f) => f.code);

  it('gives high trust to a clean, on-site, rotating-QR check from an approved phone', () => {
    const r = assessCheck(base);
    expect(r.flags).toEqual([]);
    expect(r.evidence.trust).toBe('high');
    expect(r.evidence.insideSite).toBe(true);
  });

  it('caps trust at medium without a device check (web app)', () => {
    expect(assessCheck({ ...base, integrity: 'unavailable' }).evidence.trust).toBe('medium');
  });

  it('flags each kind of doubtful check without blocking it', () => {
    expect(codes({ ...base, fix: far })).toContain('OUTSIDE_SITE');
    expect(codes({ ...base, fix: { ...near, mocked: true } })).toContain('MOCK_LOCATION');
    expect(codes({ ...base, fix: undefined })).toContain('NO_LOCATION');
    expect(codes({ ...base, fix: { ...near, accuracyM: 900 } })).toContain('LOW_ACCURACY');
    expect(codes({ ...base, qr: 'none', qrValid: false })).toContain('NO_QR');
    expect(codes({ ...base, qrValid: false })).toContain('QR_INVALID');
    expect(codes({ ...base, device: 'pending' })).toContain('DEVICE_NOT_APPROVED');
    expect(codes({ ...base, signatureValid: false })).toContain('SIGNATURE_INVALID');
    expect(codes({ ...base, integrity: 'failed' })).toContain('INTEGRITY_FAILED');
    expect(codes({ ...base, clientTime: '2026-10-27T03:20:00.000Z' })).toContain('CLOCK_SKEW');
    expect(assessCheck({ ...base, fix: far }).evidence.trust).toBe('low');
  });
});

describe('edit evidence', () => {
  const sealed: CheckEvidence = assessCheck({
    eventId: 'ev',
    workerUid: 'u1',
    fence: SITE,
    fix: near,
    qr: 'rotating',
    qrValid: true,
    device: 'bound',
    signatureValid: true,
    integrity: 'unavailable',
    clientTime: at,
    serverTime: at,
  }).evidence;

  it('knows which edits shorten a shift', () => {
    expect(reducesHours('out', '20:40', '18:00')).toBe(true);
    expect(reducesHours('out', '18:00', '20:40')).toBe(false);
    expect(reducesHours('in', '08:00', '09:30')).toBe(true);
    expect(reducesHours('in', '08:00', '08:00')).toBe(false);
  });

  it('flags a cut that contradicts a signed on-site checkout, and cuts near payday', () => {
    const flags = assessEdit({
      editEventId: 'e1',
      workerUid: 'u1',
      editorUid: 's1',
      kind: 'out',
      oldValue: '20:40',
      newValue: '18:00',
      originalEvidence: sealed,
      editDate: '2026-10-30',
      payDate: '2026-10-31',
    });
    expect(flags.map((f) => f.code)).toEqual(['EDIT_CONTRADICTS_EVIDENCE', 'EDIT_NEAR_PAYDAY']);
    expect(flags.every((f) => f.concerns === 'employer')).toBe(true);
  });

  it('does not flag edits that add hours or have no on-site evidence', () => {
    const common = {
      editEventId: 'e',
      workerUid: 'u',
      editorUid: 's',
      editDate: '2026-10-20',
      payDate: '2026-10-31',
    };
    expect(
      assessEdit({
        ...common,
        kind: 'out',
        oldValue: '18:00',
        newValue: '20:00',
        originalEvidence: sealed,
      })
    ).toEqual([]);
    expect(assessEdit({ ...common, kind: 'out', oldValue: '20:00', newValue: '18:00' })).toEqual(
      []
    );
  });

  it('flags an editor whose recent edits mostly cut hours', () => {
    const history = Array.from({ length: 6 }, (_, i) => ({
      editorUid: 's1',
      date: `2026-10-${10 + i}`,
      reduced: true,
    }));
    expect(assessEditorPattern('s1', 'Selvam', history, '2026-10-27')?.code).toBe('EDITOR_PATTERN');
    expect(assessEditorPattern('s1', 'Selvam', history.slice(0, 3), '2026-10-27')).toBeNull();
    expect(assessEditorPattern('s1', 'Selvam', history, '2026-12-27')).toBeNull();
  });
});

describe('claim, payment and hazard evidence', () => {
  it('flags implausible, duplicate and uncorroborated claims', () => {
    const base = {
      claimId: 'c',
      workerUid: 'u',
      date: '2026-10-25',
      extraHours: 2,
      hasShift: true,
      scheduledHours: 9,
      otherClaimDates: [],
      corroboratingCoworkers: 1,
      supported: true,
    };
    expect(assessClaim(base)).toEqual([]);
    const codes = assessClaim({
      ...base,
      extraHours: 14,
      hasShift: false,
      otherClaimDates: ['2026-10-25'],
    }).map((f) => f.code);
    expect(codes).toEqual(['CLAIM_NO_SHIFT', 'CLAIM_EXCEEDS_DAY', 'CLAIM_DUPLICATE']);
    expect(assessClaim({ ...base, supported: false, corroboratingCoworkers: 0 })[0].code).toBe(
      'CLAIM_NOT_CORROBORATED'
    );
  });

  it('flags underpayment and late salary, but not overpayment', () => {
    expect(assessPayment('p', 'u', 5584, 4800)[0].facts.shortBy).toBe(784);
    expect(assessPayment('p', 'u', 5584, 5600)).toEqual([]);
    const late = assessPayment('p', 'u', 30000, 30000, '2026-11-10', '2026-11-07');
    expect(late.map((f) => f.code)).toEqual(['SALARY_LATE']);
    expect(assessPayment('p', 'u', 30000, 30000, '2026-11-05', '2026-11-07')).toEqual([]);
  });

  it('flags hazard reports without photos or away from the zone, and fixes without photos', () => {
    expect(
      assessHazardReport({ hazardId: 'h', workerUid: 'u', hasPhoto: true, fix: near, fence: SITE })
    ).toEqual([]);
    const codes = assessHazardReport({
      hazardId: 'h',
      workerUid: 'u',
      hasPhoto: false,
      fix: far,
      fence: SITE,
    }).map((f) => f.code);
    expect(codes).toEqual(['HAZARD_NO_PHOTO', 'HAZARD_OUTSIDE_ZONE']);
    expect(assessHazardResolution('h', true)).toBeNull();
    expect(assessHazardResolution('h', false)?.code).toBe('HAZARD_FIX_NO_PHOTO');
    expect(hazardFixDisputed('h', 'u', 'still broken').concerns).toBe('employer');
  });
});
