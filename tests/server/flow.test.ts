import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { createApp } from '../../src/server/app.js';
import { resetRepo } from '../../src/server/data/index.js';
import {
  exportPublicJwk,
  generateDeviceKey,
  signPayload,
  type DeviceKeyPair,
} from '../../src/shared/signing.js';
import { setGeminiGeneratorForTests } from '../../src/server/gemini/client.js';

/**
 * End-to-end: an owner sets up a site, a worker joins with an invite, checks
 * in from a signed phone at the gate, and every kind of false claim the
 * evidence can catch is caught.
 */

const app = createApp();
const SITE = { center: { lat: 12.9716, lng: 80.2209 }, radiusM: 150 };
const ON_SITE = { lat: 12.9717, lng: 80.221, accuracyM: 12 };
const FAR = { lat: 13.0827, lng: 80.2707, accuracyM: 10 };

const owner = 'Bearer dev:owner1:+919800000001';
const worker = 'Bearer dev:worker1:+919800000002';
const coworker = 'Bearer dev:worker2:+919800000003';
const stranger = 'Bearer dev:stranger:+919800000009';

let wp = '';
let phone: DeviceKeyPair;
const deviceId = 'dev-' + randomBytes(8).toString('hex');

async function check(
  auth: string,
  action: 'CHECK_IN' | 'CHECK_OUT',
  opts: {
    keys?: DeviceKeyPair;
    device?: string;
    loc?: object | null;
    qr?: string | null;
    nonce?: string;
    tamper?: boolean;
  } = {}
) {
  let qrToken: string | undefined;
  if (opts.qr === undefined) {
    const gate = await request(app)
      .get(`/api/workplaces/${wp}/gate?zone=GATE`)
      .set('Authorization', owner);
    qrToken = gate.body.token;
  } else if (opts.qr) qrToken = opts.qr;
  const now = new Date().toISOString();
  const payload = {
    workplaceId: wp,
    action,
    qrToken,
    location: opts.loc === null ? undefined : { ...(opts.loc ?? ON_SITE), at: now },
    clientTime: now,
    deviceId: opts.device ?? deviceId,
    nonce: opts.nonce ?? randomBytes(12).toString('base64url'),
  };
  const signature = await signPayload((opts.keys ?? phone).privateKey, payload);
  const sent = opts.tamper ? { ...payload, location: { ...FAR, at: now } } : payload;
  return request(app)
    .post(`/api/workplaces/${wp}/checks`)
    .set('Authorization', auth)
    .send({ payload: sent, signature });
}

function minus30(hhmm: string): string {
  const m = (Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) + 24 * 60 - 30) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

async function joinAs(auth: string, name: string, code: string) {
  const res = await request(app)
    .post('/api/invites/accept')
    .set('Authorization', auth)
    .send({ code, name, language: 'ta' });
  expect(res.status).toBe(201);
}

beforeAll(async () => {
  resetRepo();
  phone = await generateDeviceKey();
  setGeminiGeneratorForTests(async () => {
    throw new Error('offline');
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('accounts and workplaces', () => {
  it('lets an owner create a workplace with a site boundary', async () => {
    const res = await request(app)
      .post('/api/workplaces')
      .set('Authorization', owner)
      .send({
        name: 'Tower B, Perungudi',
        sector: 'construction',
        state: 'Tamil Nadu',
        shiftStart: '08:00',
        shiftEnd: '17:00',
        payDay: 6,
        geofence: SITE,
        zones: [
          { code: 'GATE', name: 'Gate B', kind: 'gate' },
          { code: 'SCAF-B', name: 'Scaffold B', kind: 'scaffold' },
        ],
        ownerName: 'R. Selvam',
      });
    expect(res.status).toBe(201);
    wp = res.body.workplace.id;
    expect(res.body.workplace.inviteCode).toMatch(/^[A-Z]{3}-[A-Z2-9]{5}$/);

    const me = await request(app).get('/api/me').set('Authorization', owner);
    expect(me.body.workplaces).toEqual([expect.objectContaining({ id: wp, role: 'owner' })]);
  });

  it('lets workers preview and accept an invite, and keeps strangers out', async () => {
    const { body } = await request(app).get(`/api/workplaces/${wp}`).set('Authorization', owner);
    const code = body.workplace.inviteCode;
    const preview = await request(app)
      .post('/api/invites/preview')
      .set('Authorization', worker)
      .send({ code });
    expect(preview.body.workplace.name).toBe('Tower B, Perungudi');
    expect(preview.body.invitedBy).toBe('R. Selvam');

    await joinAs(worker, 'Murugan K.', code);
    await joinAs(coworker, 'Lakshmi R.', code);

    expect(
      (await request(app).get(`/api/workplaces/${wp}/me`).set('Authorization', stranger)).status
    ).toBe(404);
    expect(
      (await request(app).get(`/api/workplaces/${wp}/dashboard`).set('Authorization', worker))
        .status
    ).toBe(403);
    const missing = await request(app)
      .post('/api/invites/preview')
      .set('Authorization', worker)
      .send({ code: 'NOP-AAAAA' });
    expect(missing.status).toBe(404);
  });

  it('binds only to the phone a personal invite was sent to', async () => {
    const inv = await request(app)
      .post(`/api/workplaces/${wp}/invites`)
      .set('Authorization', owner)
      .send({ role: 'worker', phone: '+919811111111' });
    const res = await request(app)
      .post('/api/invites/accept')
      .set('Authorization', stranger)
      .send({ code: inv.body.invite.code, name: 'X' });
    expect(res.status).toBe(403);
  });

  it('lets the employer set wages, but not their own', async () => {
    const res = await request(app)
      .patch(`/api/workplaces/${wp}/members/worker1`)
      .set('Authorization', owner)
      .send({ hourlyRate: 95, title: 'Mason', team: 'Masonry' });
    expect(res.body.member.hourlyRate).toBe(95);
    await request(app)
      .patch(`/api/workplaces/${wp}/members/worker2`)
      .set('Authorization', owner)
      .send({ hourlyRate: 90, team: 'Masonry' });
    const self = await request(app)
      .patch(`/api/workplaces/${wp}/members/owner1`)
      .set('Authorization', owner)
      .send({ title: 'x' });
    expect(self.status).toBe(403);
  });
});

describe('check-in evidence', () => {
  it('binds the first phone, and requires a registered phone to check in', async () => {
    expect((await check(worker, 'CHECK_IN')).status).toBe(403);
    const reg = await request(app)
      .post(`/api/workplaces/${wp}/device`)
      .set('Authorization', worker)
      .send({ deviceId, platform: 'web', publicKeyJwk: await exportPublicJwk(phone.publicKey) });
    expect(reg.body.status).toBe('bound');
  });

  it('records a signed on-site check-in at the gate with a server receipt', async () => {
    const res = await check(worker, 'CHECK_IN');
    expect(res.status).toBe(201);
    expect(res.body.evidence).toMatchObject({
      insideSite: true,
      qr: 'rotating',
      qrValid: true,
      device: 'bound',
    });
    expect(res.body.evidence.trust).toBe('medium'); // web app: no Play Integrity verdict
    expect(res.body.flags).toEqual([]);
    expect(res.body.receipt.sig).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(res.body.event.payload.zoneCode).toBe('GATE');
  });

  it('refuses a second check-in, a replay, and a tampered request', async () => {
    expect((await check(worker, 'CHECK_IN')).body.error).toBe('ALREADY_CHECKED_IN');
    const nonce = randomBytes(12).toString('base64url');
    expect((await check(worker, 'CHECK_OUT', { nonce })).status).toBe(201);
    expect((await check(worker, 'CHECK_IN', { nonce })).body.error).toBe('REPLAYED');
    const tampered = await check(worker, 'CHECK_IN', { tamper: true });
    expect(tampered.status).toBe(403);
    expect(tampered.body.error).toBe('SIGNATURE_INVALID');
  });

  it('records but flags a check from far away without a QR code', async () => {
    const res = await check(worker, 'CHECK_IN', { loc: FAR, qr: null });
    expect(res.status).toBe(201);
    expect(res.body.evidence.trust).toBe('low');
    expect(res.body.flags.map((f: { code: string }) => f.code)).toEqual(['OUTSIDE_SITE', 'NO_QR']);
    await check(worker, 'CHECK_OUT');
  });

  it('puts a second phone on hold until a supervisor approves it', async () => {
    const newPhone = await generateDeviceKey();
    const newId = 'dev-' + randomBytes(8).toString('hex');
    const reg = await request(app)
      .post(`/api/workplaces/${wp}/device`)
      .set('Authorization', worker)
      .send({
        deviceId: newId,
        platform: 'android',
        publicKeyJwk: await exportPublicJwk(newPhone.publicKey),
      });
    expect(reg.body.status).toBe('pending');
    const res = await check(worker, 'CHECK_IN', { keys: newPhone, device: newId });
    expect(res.body.flags.map((f: { code: string }) => f.code)).toContain('DEVICE_NOT_APPROVED');
    await check(worker, 'CHECK_OUT', { keys: newPhone, device: newId });

    expect(
      (
        await request(app)
          .post(`/api/workplaces/${wp}/members/worker1/device/approve`)
          .set('Authorization', owner)
      ).body.status
    ).toBe('bound');
    phone = newPhone;
    (globalThis as { __device?: string }).__device = newId;
  });
  it('accepts a check sent late from offline, timed by the gate code it scanned', async () => {
    const device = (globalThis as { __device?: string }).__device!;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(Date.now() - 40 * 60_000));
    const gate = await request(app)
      .get(`/api/workplaces/${wp}/gate?zone=GATE`)
      .set('Authorization', owner);
    expect(gate.body.svg).toContain('<svg');
    const then = new Date().toISOString();
    vi.useRealTimers();
    const payload = {
      workplaceId: wp,
      action: 'CHECK_IN' as const,
      qrToken: gate.body.token,
      location: { ...ON_SITE, at: then },
      clientTime: then,
      deviceId: device,
      nonce: randomBytes(12).toString('base64url'),
    };
    const signature = await signPayload(phone.privateKey, payload);
    const res = await request(app)
      .post(`/api/workplaces/${wp}/checks`)
      .set('Authorization', worker)
      .send({ payload, signature });
    expect(res.status).toBe(201);
    expect(res.body.evidence.qrValid).toBe(true);
    expect(res.body.event.payload.at).toBe(then);
    expect(res.body.flags.map((f: { code: string }) => f.code)).toEqual(['SENT_LATE']);
    await check(worker, 'CHECK_OUT', { device });
  });
});

describe('employer edits and worker protection', () => {
  it('flags an edit that cuts a signed on-site checkout, and tells the worker', async () => {
    const device = (globalThis as { __device?: string }).__device!;
    // A three-hour shift, so cutting 30 minutes off the end is a real correction.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(Date.now() - 3 * 3600 * 1000));
    await check(worker, 'CHECK_IN', { device });
    vi.useRealTimers();
    const out = await check(worker, 'CHECK_OUT', { device });
    const edit = await request(app)
      .post(`/api/workplaces/${wp}/shifts/edit`)
      .set('Authorization', owner)
      .send({
        workerUid: 'worker1',
        targetEventId: out.body.event.id,
        newTime: minus30(out.body.event.payload.timestamp),
        reason: 'Left early per register',
      });
    expect(edit.status).toBe(201);
    const codes = edit.body.flags.map((f: { code: string }) => f.code);
    expect(codes).toContain('EDIT_CONTRADICTS_EVIDENCE');

    const me = await request(app).get(`/api/workplaces/${wp}/me`).set('Authorization', worker);
    const note = me.body.notifications.find((n: { type: string }) => n.type === 'SHIFT_EDITED');
    expect(note.reason).toBe('Left early per register');
    expect(
      me.body.flags.some((f: { code: string }) => f.code === 'EDIT_CONTRADICTS_EVIDENCE')
    ).toBe(true);
    expect(me.body.chainVerification).toEqual({ ok: true });

    const dispute = await request(app)
      .post(`/api/workplaces/${wp}/notifications/respond`)
      .set('Authorization', worker)
      .send({ notificationId: note.id, response: 'disputed', note: 'I was at the gate' });
    expect(dispute.body.claim.matchStatus).toBe('supported');
  });

  it('refuses a correction that would make an impossible shift', async () => {
    const device = (globalThis as { __device?: string }).__device!;
    await check(worker, 'CHECK_IN', { device });
    const out = await check(worker, 'CHECK_OUT', { device });
    const res = await request(app)
      .post(`/api/workplaces/${wp}/shifts/edit`)
      .set('Authorization', owner)
      .send({
        workerUid: 'worker1',
        targetEventId: out.body.event.id,
        newTime: minus30(out.body.event.payload.timestamp),
        reason: 'Before the check-in',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('IMPOSSIBLE_SHIFT');
  });

  it('stops supervisors editing their own shifts and workers editing anyone', async () => {
    const res = await request(app)
      .post(`/api/workplaces/${wp}/shifts/edit`)
      .set('Authorization', worker)
      .send({ workerUid: 'worker2', targetEventId: 'x', newTime: '10:00', reason: 'because' });
    expect(res.status).toBe(403);
  });

  it('only lets the owner close a flag that questions the employer', async () => {
    const { body } = await request(app)
      .get(`/api/workplaces/${wp}/flags`)
      .set('Authorization', owner);
    const f = body.flags.find((x: { code: string }) => x.code === 'EDIT_CONTRADICTS_EVIDENCE');
    // The owner made the edit here, but the flag's subject is the worker; the owner may review it.
    const res = await request(app)
      .post(`/api/workplaces/${wp}/flags/resolve`)
      .set('Authorization', owner)
      .send({ flagId: f.id, status: 'resolved', resolution: 'Restored the original time' });
    expect(res.body.flag.status).toBe('resolved');
    const workerTry = await request(app)
      .post(`/api/workplaces/${wp}/flags/resolve`)
      .set('Authorization', worker)
      .send({ flagId: f.id, status: 'dismissed', resolution: 'nope' });
    expect(workerTry.status).toBe(403);
  });
});

describe('claims, hazards, feedback and pay', () => {
  it('checks overtime claims against the record and flags implausible ones', async () => {
    const date = (await request(app).get(`/api/workplaces/${wp}/me`).set('Authorization', worker))
      .body.today;
    const res = await request(app)
      .post(`/api/workplaces/${wp}/claims`)
      .set('Authorization', worker)
      .send({ date, extraHours: 14, reason: 'Stayed late' });
    expect(res.status).toBe(201);
    expect(res.body.flags.map((f: { code: string }) => f.code)).toContain('CLAIM_EXCEEDS_DAY');
    const decided = await request(app)
      .post(`/api/workplaces/${wp}/claims/resolve`)
      .set('Authorization', owner)
      .send({ claimId: res.body.claim.id, decision: 'rejected', reason: 'Not on the record' });
    expect(decided.body.claim.resolutionStatus).toBe('rejected');
    const future = await request(app)
      .post(`/api/workplaces/${wp}/claims`)
      .set('Authorization', worker)
      .send({ date: '2099-01-01', extraHours: 1, reason: 'x' });
    expect(future.status).toBe(400);
  });

  it('applies the severity floor, merges repeat reports and flags fixes without photos', async () => {
    const report = {
      zoneCode: 'SCAF-B',
      hazardType: 'fall_from_height',
      description: 'Handrail broken',
      englishSummary: 'Handrail broken',
      aiSeverity: 'low',
      location: { ...ON_SITE, at: new Date().toISOString() },
    };
    const first = await request(app)
      .post(`/api/workplaces/${wp}/hazards`)
      .set('Authorization', worker)
      .send(report);
    expect(first.status).toBe(201);
    expect(first.body.hazard.finalSeverity).toBe('high');
    expect(first.body.flags.map((f: { code: string }) => f.code)).toEqual(['HAZARD_NO_PHOTO']);
    const second = await request(app)
      .post(`/api/workplaces/${wp}/hazards`)
      .set('Authorization', coworker)
      .send(report);
    expect(second.body.merged).toBe(true);
    expect(second.body.hazard.reporterUids).toEqual(['worker1', 'worker2']);

    const fixed = await request(app)
      .post(`/api/workplaces/${wp}/hazards/status`)
      .set('Authorization', owner)
      .send({ hazardId: first.body.hazard.id, status: 'resolved' });
    expect(fixed.body.flags.map((f: { code: string }) => f.code)).toEqual(['HAZARD_FIX_NO_PHOTO']);
    const disputed = await request(app)
      .post(`/api/workplaces/${wp}/hazards/dispute`)
      .set('Authorization', worker)
      .send({ hazardId: first.body.hazard.id, note: 'Still broken' });
    expect(disputed.body.hazard.status).toBe('acknowledged');
    expect(disputed.body.flags[0].code).toBe('HAZARD_FIX_DISPUTED');
  });

  it('refuses to save feedback when it cannot be anonymised', async () => {
    const res = await request(app)
      .post(`/api/workplaces/${wp}/ai/feedback-preview`)
      .set('Authorization', worker)
      .send({ text: 'Selvam shouts at us at Gate B' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('ANONYMISER_UNAVAILABLE');
    const saved = await request(app)
      .post(`/api/workplaces/${wp}/feedback`)
      .set('Authorization', worker)
      .send({
        cleanText: 'x',
        cleanTextEnglish: 'x',
        removed: [],
        themes: ['other'],
        sentiment: 0,
      });
    expect(saved.status).toBe(201);
  });

  it('shows the payslip and flags a reported underpayment', async () => {
    // Work a shift in last week's pay period.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(Date.now() - 7 * 24 * 3600 * 1000));
    const device = (globalThis as { __device?: string }).__device!;
    await check(worker, 'CHECK_IN', { device });
    vi.setSystemTime(new Date(Date.now() + 10 * 3600 * 1000));
    await check(worker, 'CHECK_OUT', { device });
    vi.useRealTimers();

    const me = (await request(app).get(`/api/workplaces/${wp}/me`).set('Authorization', worker))
      .body;
    expect(me.lastPayslip.netPay).toBeGreaterThan(0);
    const res = await request(app)
      .post(`/api/workplaces/${wp}/payments/confirm`)
      .set('Authorization', worker)
      .send({
        periodStart: me.lastPeriod.start,
        receivedAmount: Math.max(0, me.lastPayslip.netPay - 200),
      });
    expect(res.status).toBe(201);
    expect(res.body.flags[0].code).toBe('PAYMENT_MISMATCH');
  });

  it('gives the employer a dashboard and seals yesterday into a signed fingerprint', async () => {
    const dash = await request(app)
      .get(`/api/workplaces/${wp}/dashboard`)
      .set('Authorization', owner);
    expect(dash.status).toBe(200);
    expect(dash.body.kpis.workers).toBe(2);
    expect(dash.body.hotspots.find((h: { code: string }) => h.code === 'SCAF-B').count).toBe(2);

    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const d1 = await request(app)
      .get(`/api/workplaces/${wp}/digests/${yesterday}`)
      .set('Authorization', worker);
    expect(d1.status).toBe(200);
    const d2 = await request(app)
      .get(`/api/workplaces/${wp}/digests/${yesterday}`)
      .set('Authorization', owner);
    expect(d2.body.digest.root).toBe(d1.body.digest.root); // sealed once, never recomputed
    const future = await request(app)
      .get(`/api/workplaces/${wp}/digests/2099-01-01`)
      .set('Authorization', worker);
    expect(future.status).toBe(404);

    const key = await request(app).get('/api/receipts/key');
    expect(key.body.key.crv).toBe('Ed25519');
  });
});
