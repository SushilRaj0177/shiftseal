import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { createApp } from '../../src/server/app.js';
import { resetRepo } from '../../src/server/data/index.js';
import { exportPublicJwk, generateDeviceKey, signPayload } from '../../src/shared/signing.js';

/** An office: salaried staff, leave and work from home, and confidential complaints. */

const app = createApp();
const SITE = { center: { lat: 13.0418, lng: 80.2341 }, radiusM: 100 };
const HOME = { lat: 12.9165, lng: 80.1503, accuracyM: 15 }; // ~15 km away
const bearer = (uid: string) =>
  `Bearer dev:${uid}:+9198000${uid.replace(/\D/g, '').padStart(5, '0')}`;
const owner = bearer('boss');
const asha = bearer('asha1');
const ravi = bearer('ravi2');
const icMember = bearer('meena3');
let wp = '';
let code = '';

const get = (auth: string, path: string) =>
  request(app).get(`/api/workplaces/${wp}${path}`).set('Authorization', auth);
const post = (auth: string, path: string, body: object) =>
  request(app).post(`/api/workplaces/${wp}${path}`).set('Authorization', auth).send(body);
const today = async () => (await get(asha, '/leave')).body.today as string;
const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
/** The next date at or after `d` that is a working day (Mon–Fri). */
const nextWorkday = (d: string) => {
  let x = d;
  while ([0, 6].includes(new Date(`${x}T00:00:00Z`).getUTCDay())) x = addDays(x, 1);
  return x;
};

beforeAll(async () => {
  resetRepo();
  const res = await request(app)
    .post('/api/workplaces')
    .set('Authorization', owner)
    .send({
      name: 'Northwind Analytics',
      sector: 'office',
      state: 'Tamil Nadu',
      shiftStart: '09:30',
      shiftEnd: '18:30',
      payCycle: 'monthly',
      payDayOfMonth: 1,
      weeklyOff: [0, 6],
      geofence: SITE,
      zones: [
        { code: 'RECEPTION', name: 'Reception', kind: 'gate' },
        { code: 'FLOOR-2', name: 'Floor 2', kind: 'building' },
      ],
      ownerName: 'K. Priya',
    });
  expect(res.status).toBe(201);
  wp = res.body.workplace.id;
  code = res.body.workplace.inviteCode;
  for (const [auth, name] of [
    [asha, 'Asha N.'],
    [ravi, 'Ravi S.'],
    [icMember, 'Meena R.'],
  ]) {
    await request(app).post('/api/invites/accept').set('Authorization', auth).send({ code, name });
  }
  await request(app)
    .patch(`/api/workplaces/${wp}/members/asha1`)
    .set('Authorization', owner)
    .send({
      payType: 'monthly',
      monthlySalary: 30000,
      overtime: 'comp_off',
      recurringDeductions: [{ type: 'PF', amount: 1800, reason: 'Employee PF, 12% of basic' }],
    });
});

afterEach(() => vi.useRealTimers());

describe('leave', () => {
  it('requests, approves and seals leave into the record', async () => {
    const from = nextWorkday(addDays(await today(), 7));
    const res = await post(asha, '/leave', {
      type: 'casual',
      from,
      to: from,
      reason: 'Family function',
    });
    expect(res.status).toBe(201);
    expect(res.body.request.days).toBe(1);

    expect(
      (await post(asha, '/leave/decide', { leaveId: res.body.request.id, decision: 'approved' }))
        .status
    ).toBe(403);
    const ok = await post(owner, '/leave/decide', {
      leaveId: res.body.request.id,
      decision: 'approved',
    });
    expect(ok.body.request.status).toBe('approved');

    const record = await get(asha, '/workers/asha1/record');
    const sealed = record.body.chain.filter((e: { type: string }) => e.type === 'LEAVE');
    expect(sealed.map((e: { payload: { action: string } }) => e.payload.action)).toEqual([
      'requested',
      'approved',
    ]);
    expect(record.body.verification).toEqual({ ok: true });

    const me = await get(asha, '/me');
    expect(
      me.body.leave.balances.find((b: { type: string }) => b.type === 'casual').available
    ).toBe(11);
  });

  it('refuses overlapping leave and leave beyond the balance', async () => {
    const from = nextWorkday(addDays(await today(), 7));
    expect(
      (await post(asha, '/leave', { type: 'sick', from, to: from, reason: 'x1' })).body.error
    ).toBe('OVERLAPS');
    const far = nextWorkday(addDays(await today(), 60));
    const tooMuch = await post(asha, '/leave', {
      type: 'comp_off',
      from: far,
      to: far,
      reason: 'rest',
    });
    expect(tooMuch.body.error).toBe('NOT_ENOUGH_LEAVE');
  });

  it('flags approved leave that is later withdrawn, and tells the worker', async () => {
    const from = nextWorkday(addDays(await today(), 20));
    const req = await post(ravi, '/leave', { type: 'earned', from, to: from, reason: 'Travel' });
    await post(owner, '/leave/decide', { leaveId: req.body.request.id, decision: 'approved' });
    const revoked = await post(owner, '/leave/revoke', {
      leaveId: req.body.request.id,
      reason: 'Client deadline moved',
    });
    expect(revoked.body.flags[0].code).toBe('LEAVE_REVOKED');
    const me = await get(ravi, '/me');
    expect(me.body.notifications[0].type).toBe('LEAVE_REVOKED');
  });
});

describe('work from home', () => {
  it('accepts a check from home on an approved work-from-home day without flagging distance', async () => {
    const keys = await generateDeviceKey();
    const deviceId = 'dev-' + randomBytes(8).toString('hex');
    await post(asha, '/device', {
      deviceId,
      platform: 'web',
      publicKeyJwk: await exportPublicJwk(keys.publicKey),
    });
    const d = await today();
    const wfh = await post(asha, '/leave', {
      type: 'wfh',
      from: d,
      to: d,
      reason: 'Plumber at home',
    });
    // A weekly off has no working days; nothing more to test then.
    if (wfh.body.error === 'NO_WORKING_DAYS') return;
    await post(owner, '/leave/decide', { leaveId: wfh.body.request.id, decision: 'approved' });
    const now = new Date().toISOString();
    const payload = {
      workplaceId: wp,
      action: 'CHECK_IN' as const,
      location: { ...HOME, at: now },
      clientTime: now,
      deviceId,
      nonce: randomBytes(12).toString('base64url'),
    };
    const res = await post(asha, '/checks', {
      payload,
      signature: await signPayload(keys.privateKey, payload),
    });
    expect(res.status).toBe(201);
    expect(res.body.flags).toEqual([]);
    expect(res.body.evidence.remote).toBe(true);
    expect(res.body.event.payload.zoneCode).toBe('remote');
  });
});

describe('salary', () => {
  it('shows a monthly payslip and flags salary received after the 7th', async () => {
    const me = (await get(asha, '/me')).body;
    expect(me.payType).toBe('monthly');
    expect(me.payslip.lines[0].kind).toBe('salary');
    expect(me.payslip.netPay).toBe(28200);

    // Pretend it is the 20th of next month, and the money arrived on the 12th.
    const nextMonth = addDays(me.period.end, 1);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${nextMonth.slice(0, 8)}20T06:00:00Z`));
    const res = await post(asha, '/payments/confirm', {
      periodStart: me.period.start,
      receivedAmount: 28200,
      receivedOn: `${nextMonth.slice(0, 8)}12`,
    });
    expect(res.status).toBe(201);
    expect(res.body.flags.map((f: { code: string }) => f.code)).toEqual(['SALARY_LATE']);
  });
});

describe('confidential complaints', () => {
  it('flags a workplace of 10 or more with no Internal Committee', async () => {
    for (let i = 10; i < 17; i++) {
      await request(app)
        .post('/api/invites/accept')
        .set('Authorization', bearer(`staff${i}`))
        .send({ code, name: `Staff ${i}` });
    }
    const dash = await get(owner, '/dashboard');
    expect(dash.body.flags.some((f: { code: string }) => f.code === 'COMPLAINTS_NO_HANDLER')).toBe(
      true
    );
    // Raised once, not on every load.
    const again = await get(owner, '/dashboard');
    expect(
      again.body.flags.filter((f: { code: string }) => f.code === 'COMPLAINTS_NO_HANDLER')
    ).toHaveLength(1);
  });

  it('only the owner can name the committee, and everyone can see who is on it', async () => {
    expect(
      (
        await request(app)
          .patch(`/api/workplaces/${wp}/members/meena3`)
          .set('Authorization', asha)
          .send({ icMember: true })
      ).status
    ).toBe(403);
    await request(app)
      .patch(`/api/workplaces/${wp}/members/meena3`)
      .set('Authorization', owner)
      .send({ icMember: true, icPresiding: true });
    await request(app)
      .patch(`/api/workplaces/${wp}/members/ravi2`)
      .set('Authorization', owner)
      .send({ icMember: true });
    const c = await get(asha, '/committee');
    expect(c.body.committee.map((m: { name: string }) => m.name).sort()).toEqual([
      'Meena R.',
      'Ravi S.',
    ]);
    expect(c.body.required).toBe(true);
  });

  it('shows a complaint only to the complainant and the committee members not excluded', async () => {
    const filed = await post(asha, '/complaints', {
      respondentName: 'A colleague',
      incidentDate: await today(),
      place: 'Floor 2 pantry',
      description: 'Repeated unwelcome comments after I asked him to stop.',
      excludedCommitteeUids: ['ravi2'],
    });
    expect(filed.status).toBe(201);
    const id = filed.body.complaint.id;

    expect(
      (await get(icMember, '/complaints')).body.committee.map((c: { id: string }) => c.id)
    ).toEqual([id]);
    expect((await get(ravi, '/complaints')).body.committee).toEqual([]);
    expect((await get(owner, '/complaints')).body).toEqual({ mine: [], committee: [] });

    expect(
      (await post(asha, '/complaints/status', { complaintId: id, status: 'closed' })).status
    ).toBe(403);
    expect((await post(ravi, '/complaints/message', { complaintId: id, text: 'hi' })).status).toBe(
      404
    );
    const moved = await post(icMember, '/complaints/status', {
      complaintId: id,
      status: 'inquiry',
      note: 'We will meet you on Monday.',
    });
    expect(moved.body.complaint.status).toBe('inquiry');
    const reply = await post(asha, '/complaints/message', { complaintId: id, text: 'Thank you.' });
    expect(reply.body.complaint.messages.map((m: { fromRole: string }) => m.fromRole)).toEqual([
      'committee',
      'complainant',
    ]);

    const dash = await get(owner, '/dashboard');
    expect(dash.body.complaints).toEqual({ committeeSize: 2, open: 1, overdue: 0 });
    expect(JSON.stringify(dash.body)).not.toContain('pantry');
  });
});
