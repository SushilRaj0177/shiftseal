import { Router } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod/v3';
import type { LedgerEditPayload, WorkerNotification } from '../../shared/types.js';
import type { DeviceBinding, FlagRecord, LeaveRequest, MemberRecord } from '../../shared/model.js';
import {
  checkRequestSchema,
  createInviteSchema,
  editShiftSchema,
  registerDeviceSchema,
  respondNotificationSchema,
  updateMemberSchema,
  updateWorkplaceSchema,
} from '../../shared/apiSchemas.js';
import { append, latestView, verify } from '../../shared/ledger/ledger.js';
import { verifyPayload } from '../../shared/signing.js';
import {
  assessCheck,
  assessEdit,
  assessEditorPattern,
  reducesHours,
  type FlagDraft,
} from '../../shared/rules/flags.js';
import { localParts, minutesBetween, periodFor } from '../../shared/time.js';
import { leaveOn } from '../../shared/rules/leave.js';
import { atLeast, ctx, requireRole } from '../auth/membership.js';
import { getRepo } from '../data/index.js';
import { qrSecret } from '../keys.js';
import { AppError } from '../middleware/errors.js';
import { evidenceOf, editsOf, openShift, usedNonce, type CheckPayload } from '../services/chain.js';
import { raiseFlags } from '../services/flags.js';
import { checkCountrySettings } from './account.js';
import { limitReadings } from '../../shared/rules/limits.js';
import { assessLimits } from '../../shared/rules/flags.js';
import {
  assessMinorNight,
  assessStudentLimits,
  studentReadings,
} from '../../shared/rules/students.js';
import { shiftsEverywhere, studentProfileOf } from '../services/students.js';
import { newId, newInviteCode } from '../services/ids.js';
import { verifyIntegrity } from '../services/integrity.js';
import { issueReceipt, sealDigest } from '../services/receipts.js';
import { checkToken, printedToken, rotatingToken } from '../qr/tokens.js';

/** A check counts as sent late after 5 minutes; after 12 hours the gate code no longer vouches for it. */
const LATE_AFTER_MS = 5 * 60_000;
/** No corrected shift may be longer than this. */
const MAX_SHIFT_MINUTES = 20 * 60;
const MAX_LATE_MS = 12 * 3600_000;

/** QR codes open the app's check-in page, so a plain phone camera works too. */
function checkInUrl(
  req: { protocol: string; get(name: string): string | undefined },
  token: string
) {
  return `${req.protocol}://${req.get('host')}/c#${token}`;
}

/** Routes for one workplace, mounted at /api/workplaces/:wp after membership is loaded. */
export const workplaceRouter = Router({ mergeParams: true });

const today = (tz: string) => localParts(new Date(), tz).date;

function publicMember(m: MemberRecord) {
  const { device, pendingDevice, ...rest } = m;
  return {
    ...rest,
    device: device ? { platform: device.platform, boundAt: device.boundAt } : null,
    pendingDevice: pendingDevice
      ? { platform: pendingDevice.platform, boundAt: pendingDevice.boundAt }
      : null,
  };
}

// ------------------------------------------------------------------ workplace

workplaceRouter.get('/', (req, res) => {
  const { workplace, member } = ctx(req);
  res.json({ workplace, member: publicMember(member) });
});

workplaceRouter.patch('/', requireRole('owner'), async (req, res, next) => {
  try {
    const body = updateWorkplaceSchema.parse(req.body);
    const { workplace } = ctx(req);
    const updated = { ...workplace, ...body };
    checkCountrySettings(updated);
    await getRepo().saveWorkplace(updated);
    res.json({ workplace: updated });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ people

workplaceRouter.post('/invites', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = createInviteSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    if (body.role === 'supervisor' && member.role !== 'owner') {
      throw new AppError(403, 'FORBIDDEN', 'Only the owner can invite supervisors.');
    }
    const invite = {
      code: newInviteCode(workplace.name),
      workplaceId: workplace.id,
      role: body.role,
      phone: body.phone,
      createdBy: member.uid,
      createdAt: new Date().toISOString(),
    };
    await getRepo().saveInvite(invite);
    res.status(201).json({ invite });
  } catch (err) {
    next(err);
  }
});

workplaceRouter.get('/members', requireRole('supervisor'), async (req, res, next) => {
  try {
    const members = await getRepo().listMembers(ctx(req).workplace.id);
    res.json({ members: members.filter((m) => m.status === 'active').map(publicMember) });
  } catch (err) {
    next(err);
  }
});

workplaceRouter.patch('/members/:uid', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = updateMemberSchema.parse(req.body);
    const { workplace, member: me } = ctx(req);
    const repo = getRepo();
    const target = await repo.getMember(workplace.id, String(req.params.uid));
    if (!target) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found.');
    // The owner can only be named a complaint handler here, nothing else.
    const committeeOnly = Object.keys(body).every((k) => k === 'icMember' || k === 'icPresiding');
    if (target.role === 'owner' && !committeeOnly) {
      throw new AppError(403, 'FORBIDDEN', 'The owner cannot be changed here.');
    }
    if (
      (body.role || body.status || body.icMember !== undefined || body.icPresiding !== undefined) &&
      me.role !== 'owner'
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Only the owner can change roles, the committee, or remove people.'
      );
    }
    const payFields = [
      'hourlyRate',
      'dailyWage',
      'monthlySalary',
      'payType',
      'overtime',
      'recurringDeductions',
      'serviceFrom',
    ];
    if (target.uid === me.uid && Object.keys(body).some((k) => payFields.includes(k))) {
      throw new AppError(403, 'FORBIDDEN', 'You cannot set your own wage.');
    }
    const updated = { ...target, ...body };
    await repo.saveMember(updated);
    res.json({ member: publicMember(updated) });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ devices

/** Registers this phone's signing key. The first phone is bound; later ones wait for approval. */
workplaceRouter.post('/device', async (req, res, next) => {
  try {
    const body = registerDeviceSchema.parse(req.body);
    const { member } = ctx(req);
    const binding: DeviceBinding = {
      deviceId: body.deviceId,
      platform: body.platform,
      publicKeyJwk: body.publicKeyJwk,
      boundAt: new Date().toISOString(),
    };
    let status: 'bound' | 'pending';
    let updated: MemberRecord;
    if (!member.device) {
      updated = { ...member, device: { ...binding, approvedBy: 'first-device' } };
      status = 'bound';
    } else if (member.device.deviceId === body.deviceId) {
      res.json({ status: 'bound' });
      return;
    } else {
      updated = { ...member, pendingDevice: binding };
      status = 'pending';
    }
    await getRepo().saveMember(updated);
    res.status(201).json({ status });
  } catch (err) {
    next(err);
  }
});

workplaceRouter.post(
  '/members/:uid/device/approve',
  requireRole('supervisor'),
  async (req, res, next) => {
    try {
      const { workplace, member: me } = ctx(req);
      const repo = getRepo();
      const target = await repo.getMember(workplace.id, String(req.params.uid));
      if (!target?.pendingDevice)
        throw new AppError(404, 'NO_PENDING_DEVICE', 'No phone is waiting for approval.');
      if (target.uid === me.uid)
        throw new AppError(403, 'FORBIDDEN', 'Someone else must approve your new phone.');
      const { pendingDevice, ...rest } = target;
      await repo.saveMember({ ...rest, device: { ...pendingDevice, approvedBy: me.uid } });
      const note: WorkerNotification = {
        id: newId('ntf'),
        workerId: target.uid,
        workplaceId: workplace.id,
        type: 'DEVICE_APPROVED',
        date: today(workplace.timezone),
        supervisorName: me.name,
        reason: 'Your new phone was approved.',
        status: 'unread',
        createdAt: new Date().toISOString(),
      };
      await repo.put(workplace.id, 'notifications', note);
      res.json({ status: 'bound' });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------ gate QR

const zoneQuery = z.object({ zone: z.string().regex(/^[A-Za-z0-9-]{1,32}$/) });

async function qrSvg(text: string, width: number): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    width,
    color: { dark: '#17171b', light: '#ffffff' },
  });
}

/** The rotating code for a gate screen. Refetch before `expiresInS` runs out. */
workplaceRouter.get('/gate', requireRole('supervisor'), async (req, res, next) => {
  try {
    const { zone } = zoneQuery.parse(req.query);
    const { workplace } = ctx(req);
    if (!workplace.zones.some((z) => z.code === zone))
      throw new AppError(404, 'ZONE_NOT_FOUND', 'Zone not found.');
    const { token, expiresInS } = rotatingToken(qrSecret(workplace.id), workplace.id, zone);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ token, expiresInS, svg: await qrSvg(checkInUrl(req, token), 320) });
  } catch (err) {
    next(err);
  }
});

/** A fixed code to print, for sites without a screen at the gate. */
workplaceRouter.get('/poster', requireRole('supervisor'), async (req, res, next) => {
  try {
    const { zone } = zoneQuery.parse(req.query);
    const { workplace } = ctx(req);
    if (!workplace.zones.some((z) => z.code === zone))
      throw new AppError(404, 'ZONE_NOT_FOUND', 'Zone not found.');
    const token = printedToken(qrSecret(workplace.id), workplace.id, zone);
    res.json({
      token,
      svg: await qrSvg(checkInUrl(req, token), 480),
      inviteCode: workplace.inviteCode,
      joinSvg: await qrSvg(
        `${req.protocol}://${req.get('host')}/join?code=${workplace.inviteCode}`,
        320
      ),
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ check-in / check-out

workplaceRouter.post('/checks', async (req, res, next) => {
  try {
    const body = checkRequestSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const p = body.payload;
    if (p.workplaceId !== workplace.id)
      throw new AppError(400, 'WRONG_WORKPLACE', 'This check is for another workplace.');

    const device =
      member.device?.deviceId === p.deviceId
        ? { binding: member.device, status: 'bound' as const }
        : member.pendingDevice?.deviceId === p.deviceId
          ? { binding: member.pendingDevice, status: 'pending' as const }
          : null;
    if (!device) {
      throw new AppError(403, 'DEVICE_NOT_REGISTERED', 'Register this phone before checking in.');
    }
    const signatureValid = await verifyPayload(device.binding.publicKeyJwk, p, body.signature);
    if (!signatureValid) {
      await raiseFlags(workplace.id, [
        {
          code: 'SIGNATURE_INVALID',
          severity: 'serious',
          concerns: 'worker',
          subject: { kind: 'device', id: p.deviceId, workerUid: member.uid },
          message:
            "A check was sent with a signature that does not match the worker's phone. It was not recorded.",
          facts: { action: p.action },
        },
      ]);
      throw new AppError(
        403,
        'SIGNATURE_INVALID',
        'This check could not be verified and was not recorded.'
      );
    }

    const now = new Date();
    const secret = qrSecret(workplace.id);
    let qr = checkToken(secret, p.qrToken, workplace.id, now.getTime());
    // A check made offline arrives late. If the gate code it carries was valid at the
    // phone's stated time, that code (not the phone's clock) vouches for when it happened.
    let acceptedAt = now;
    const lateMs = now.getTime() - Date.parse(p.clientTime);
    if (!qr.valid && qr.kind === 'rotating' && lateMs > LATE_AFTER_MS && lateMs < MAX_LATE_MS) {
      const atScan = checkToken(secret, p.qrToken, workplace.id, Date.parse(p.clientTime));
      if (atScan.valid) {
        qr = atScan;
        acceptedAt = new Date(p.clientTime);
      }
    }
    const sentLate = acceptedAt !== now;
    const serverTime = acceptedAt.toISOString();
    const local = localParts(acceptedAt, workplace.timezone);
    const zoneCode =
      qr.valid && qr.zoneCode && workplace.zones.some((z) => z.code === qr.zoneCode)
        ? qr.zoneCode
        : 'site';
    const integrity = await verifyIntegrity(body.integrityToken, device.binding.platform, p.nonce);
    // On an approved work-from-home day, location is recorded but not compared with the site.
    const remote = Boolean(
      leaveOn(
        (await getRepo().list<LeaveRequest>(workplace.id, 'leave')).filter(
          (r) => r.workerUid === member.uid
        ),
        local.date,
        ['wfh']
      )
    );
    const eventId = newId('ev');
    const assessed = assessCheck({
      eventId,
      workerUid: member.uid,
      fence: workplace.geofence,
      fix: p.location,
      qr: qr.kind,
      qrValid: qr.valid,
      device: device.status,
      signatureValid,
      integrity,
      clientTime: p.clientTime,
      serverTime,
      remote,
    });

    const repo = getRepo();
    const { event, seq } = await repo.appendToChain(workplace.id, member.uid, (chain) => {
      if (usedNonce(chain, p.nonce))
        throw new AppError(409, 'REPLAYED', 'This check was already recorded.');
      const open = openShift(chain);
      if (p.action === 'CHECK_IN' && open) {
        throw new AppError(
          409,
          'ALREADY_CHECKED_IN',
          `You are already checked in since ${open.checkInTime}.`
        );
      }
      if (p.action === 'CHECK_OUT' && !open) {
        throw new AppError(409, 'NOT_CHECKED_IN', 'You are not checked in.');
      }
      const payload: CheckPayload = {
        date: p.action === 'CHECK_OUT' && open ? open.date : local.date,
        timestamp: local.time,
        zoneCode,
        source: qr.valid ? 'qr' : 'manual',
        ...(remote ? { zoneCode: 'remote' } : {}),
        at: serverTime,
        receivedAt: now.toISOString(),
        nonce: p.nonce,
        deviceId: p.deviceId,
        deviceSig: body.signature,
        evidence: assessed.evidence,
      };
      return append(chain, {
        id: eventId,
        workerId: member.uid,
        type: p.action,
        createdAt: serverTime,
        payload,
      }).at(-1)!;
    });

    const lateNote: FlagDraft[] = sentLate
      ? [
          {
            code: 'SENT_LATE',
            severity: 'info',
            concerns: 'worker',
            subject: { kind: 'event', id: eventId, workerUid: member.uid },
            message: `Recorded offline and sent ${Math.round(lateMs / 60000)} minutes later. The time comes from the gate code scanned.`,
            facts: { minutesLate: Math.round(lateMs / 60000) },
          },
        ]
      : [];
    // A check-out that takes someone over a legal working-time limit is the employer's to answer.
    let overLimit: FlagDraft[] = [];
    if (event.type === 'CHECK_OUT') {
      const chainNow = await repo.getChain(workplace.id, member.uid);
      const readings = limitReadings(latestView(chainNow), workplace, local.date);
      const existing = await repo.list<FlagRecord>(workplace.id, 'flags');
      // Students and young workers: their own caps, counting every job they hold.
      const user = await repo.getUser(member.uid);
      const profile = studentProfileOf(user);
      const everywhere = await shiftsEverywhere(user, member.uid, workplace.id);
      const closed = latestView(chainNow).find((s) => s.checkOutEventId === event.id);
      const student = [
        ...assessStudentLimits(
          member.uid,
          studentReadings(profile, everywhere, workplace, local.date)
        ),
        ...(closed ? assessMinorNight(member.uid, closed, profile, workplace) : []),
      ];
      overLimit = [...assessLimits(member.uid, readings), ...student].filter(
        (d) => !existing.some((f) => f.code === d.code && f.subject.id === d.subject.id)
      );
    }
    const flags = await raiseFlags(workplace.id, [...assessed.flags, ...lateNote, ...overLimit]);
    const receipt = await issueReceipt(workplace.id, member.uid, event, seq);
    res.status(201).json({ event, receipt, evidence: assessed.evidence, flags });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ supervisor edits

workplaceRouter.post('/shifts/edit', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = editShiftSchema.parse(req.body);
    const { workplace, member: editor } = ctx(req);
    if (body.workerUid === editor.uid)
      throw new AppError(403, 'FORBIDDEN', 'You cannot edit your own shifts.');
    const repo = getRepo();
    const worker = await repo.getMember(workplace.id, body.workerUid);
    if (!worker || worker.status !== 'active')
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'Worker not found.');

    let kind: 'in' | 'out' = 'out';
    let shiftDate = '';
    let target: CheckPayload | undefined;
    const editEventId = newId('ev');
    const { event, seq } = await repo.appendToChain(workplace.id, worker.uid, (chain) => {
      const t = chain.find((e) => e.id === body.targetEventId);
      if (!t || t.type === 'EDIT')
        throw new AppError(404, 'EVENT_NOT_FOUND', 'Shift record not found.');
      target = t.payload as CheckPayload;
      kind = t.type === 'CHECK_IN' ? 'in' : 'out';
      shiftDate = target.date;
      const shift = latestView(chain).find((s) => s.date === shiftDate);
      const oldValue =
        (kind === 'in' ? shift?.checkInTime : shift?.checkOutTime) ?? target.timestamp;
      if (oldValue === body.newTime)
        throw new AppError(400, 'NO_CHANGE', 'That is already the recorded time.');
      // The other end of the shift stays as recorded; the corrected shift must still be a real shift.
      const otherEnd = kind === 'in' ? shift?.checkOutTime : shift?.checkInTime;
      if (otherEnd) {
        const [from, to] = kind === 'in' ? [body.newTime, otherEnd] : [otherEnd, body.newTime];
        if (minutesBetween(from, to) > MAX_SHIFT_MINUTES) {
          throw new AppError(
            400,
            'IMPOSSIBLE_SHIFT',
            `That would make the shift ${from} to ${to}, which is not possible. Check the time.`
          );
        }
      }
      const payload: LedgerEditPayload = {
        targetEventId: t.id,
        field: 'timestamp',
        oldValue,
        newValue: body.newTime,
        reason: body.reason,
        editorId: editor.uid,
        editorName: editor.name,
      };
      return append(chain, {
        id: editEventId,
        workerId: worker.uid,
        type: 'EDIT',
        createdAt: new Date().toISOString(),
        payload,
      }).at(-1)!;
    });
    const edit = event.payload as LedgerEditPayload;
    const editDate = today(workplace.timezone);

    // Evidence checks on the edit itself, and on this editor's recent pattern.
    const drafts = assessEdit({
      editEventId,
      workerUid: worker.uid,
      editorUid: editor.uid,
      kind,
      oldValue: target!.timestamp,
      newValue: body.newTime,
      originalEvidence: target!.evidence,
      editDate,
      payDate: periodFor(workplace, shiftDate).payDate,
    });
    const members = await repo.listMembers(workplace.id);
    const history = [];
    for (const m of members) {
      const chain = await repo.getChain(workplace.id, m.uid);
      for (const e of editsOf(chain)) {
        const t = chain.find((x) => x.id === e.payload.targetEventId);
        history.push({
          editorUid: e.payload.editorId,
          date: localParts(new Date(e.createdAt), workplace.timezone).date,
          reduced: reducesHours(
            t?.type === 'CHECK_IN' ? 'in' : 'out',
            e.payload.oldValue,
            e.payload.newValue
          ),
        });
      }
    }
    const pattern = assessEditorPattern(editor.uid, editor.name, history, editDate);
    const existingFlags = await repo.list<FlagRecord>(workplace.id, 'flags');
    const patternOpen = existingFlags.some(
      (f) => f.code === 'EDITOR_PATTERN' && f.subject.id === editor.uid && f.status === 'open'
    );
    const flags = await raiseFlags(
      workplace.id,
      pattern && !patternOpen ? [...drafts, pattern] : drafts
    );

    const notification: WorkerNotification = {
      id: newId('ntf'),
      workerId: worker.uid,
      workplaceId: workplace.id,
      type: 'SHIFT_EDITED',
      date: shiftDate,
      oldValue: edit.oldValue,
      newValue: edit.newValue,
      supervisorName: editor.name,
      reason: edit.reason,
      editEventId,
      status: 'unread',
      createdAt: event.createdAt,
    };
    await repo.put(workplace.id, 'notifications', notification);
    const receipt = await issueReceipt(workplace.id, worker.uid, event, seq);
    res.status(201).json({ event, receipt, flags, notification });
  } catch (err) {
    next(err);
  }
});

workplaceRouter.post('/notifications/respond', async (req, res, next) => {
  try {
    const body = respondNotificationSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const note = await repo.get<WorkerNotification>(
      workplace.id,
      'notifications',
      body.notificationId
    );
    if (!note || note.workerId !== member.uid)
      throw new AppError(404, 'NOT_FOUND', 'Notification not found.');
    const updated = { ...note, status: body.response };
    await repo.put(workplace.id, 'notifications', updated);

    let claim = null;
    if (body.response === 'disputed' && note.type === 'SHIFT_EDITED' && note.editEventId) {
      const chain = await repo.getChain(workplace.id, member.uid);
      const edit = chain.find((e) => e.id === note.editEventId);
      const target =
        edit && chain.find((e) => e.id === (edit.payload as LedgerEditPayload).targetEventId);
      const ev = evidenceOf(target);
      const backed = Boolean(ev?.insideSite && ev.deviceSignatureValid && ev.trust !== 'low');
      claim = {
        id: newId('clm'),
        workerId: member.uid,
        workerName: member.name,
        workplaceId: workplace.id,
        date: note.date,
        extraHours: 0,
        reason: body.note || 'I disagree with this change.',
        detectedLanguage: member.language,
        matchStatus: backed ? ('supported' as const) : ('unsupported' as const),
        supportedHours: 0,
        evidence: {
          shiftDate: note.date,
          originalCheckOut: note.oldValue,
          recordedCheckOut: note.newValue,
          recordedExtraHours: 0,
          claimedExtraHours: 0,
          supportedExtraHours: 0,
          hadSupervisorEdit: true,
          editReason: note.reason,
          explanation: backed
            ? `The original time ${note.oldValue} was signed on your phone while on site.`
            : 'There is no signed on-site record for the original time.',
        },
        resolutionStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
        kind: 'edit_disagree' as const,
        relatedEditEventId: note.editEventId,
      };
      await repo.put(workplace.id, 'claims', claim);
    }
    res.json({ notification: updated, claim });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ records

/** A worker's shifts with their evidence. Workers see their own; supervisors see anyone's. */
workplaceRouter.get('/workers/:uid/record', async (req, res, next) => {
  try {
    const { workplace, member } = ctx(req);
    const uid = String(req.params.uid);
    if (uid !== member.uid && !atLeast(member.role, 'supervisor')) {
      throw new AppError(403, 'FORBIDDEN', 'You can only see your own record.');
    }
    const repo = getRepo();
    const worker = await repo.getMember(workplace.id, uid);
    if (!worker) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Worker not found.');
    const chain = await repo.getChain(workplace.id, uid);
    const flags = (await repo.list<FlagRecord>(workplace.id, 'flags')).filter(
      (f) => f.subject.workerUid === uid
    );
    res.json({
      worker: publicMember(worker),
      shifts: latestView(chain).sort((a, b) => b.date.localeCompare(a.date)),
      chain,
      verification: verify(chain),
      flags,
    });
  } catch (err) {
    next(err);
  }
});

const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** The sealed end-of-day fingerprint of everyone's records (sealed on first request after the day). */
workplaceRouter.get('/digests/:date', async (req, res, next) => {
  try {
    const date = dateParam.parse(req.params.date);
    const { workplace, member } = ctx(req);
    const digest = await sealDigest(workplace, date);
    if (!digest) throw new AppError(404, 'NOT_SEALED', 'This day has not ended yet.');
    // Leaves hold only opaque ids and hashes, so everyone gets the full digest and can recompute the root.
    const mine = digest.leaves.find((l) => l.uid === member.uid) ?? null;
    res.json({ digest, mine });
  } catch (err) {
    next(err);
  }
});
