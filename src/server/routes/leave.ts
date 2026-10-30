import { Router } from 'express';
import type { OvertimeClaim, WorkerNotification } from '../../shared/types.js';
import type {
  LeaveRequest,
  LedgerLeavePayload,
  MemberRecord,
  WorkplaceRecord,
} from '../../shared/model.js';
import {
  decideLeaveSchema,
  leaveIdSchema,
  requestLeaveSchema,
  revokeLeaveSchema,
} from '../../shared/apiSchemas.js';
import { append } from '../../shared/ledger/ledger.js';
import { findOverlap, leaveBalances, leaveDays, leaveTypes } from '../../shared/rules/leave.js';
import { leaveRevoked } from '../../shared/rules/flags.js';
import { addDays, localParts } from '../../shared/time.js';
import { atLeast, ctx, requireRole } from '../auth/membership.js';
import { getRepo } from '../data/index.js';
import { AppError } from '../middleware/errors.js';
import { raiseFlags } from '../services/flags.js';
import { newId } from '../services/ids.js';
import { compOffHours, weeklyOffOf } from '../services/payroll.js';

/** Leave and work-from-home requests. Every change is also sealed into the worker's chain. */
export const leaveRouter = Router({ mergeParams: true });

const today = (tz: string) => localParts(new Date(), tz).date;

async function seal(
  wp: WorkplaceRecord,
  r: LeaveRequest,
  action: LedgerLeavePayload['action'],
  by: MemberRecord,
  reason?: string
) {
  const payload: LedgerLeavePayload = {
    leaveId: r.id,
    action,
    type: r.type,
    from: r.from,
    to: r.to,
    days: r.days,
    byUid: by.uid,
    byName: by.name,
    reason,
  };
  await getRepo().appendToChain(wp.id, r.workerUid, (chain) =>
    append(chain, {
      id: newId('ev'),
      workerId: r.workerUid,
      type: 'LEAVE',
      createdAt: new Date().toISOString(),
      payload,
    }).at(-1)!
  );
}

async function notify(
  wp: WorkplaceRecord,
  r: LeaveRequest,
  type: WorkerNotification['type'],
  by: MemberRecord,
  reason: string
) {
  const note: WorkerNotification = {
    id: newId('ntf'),
    workerId: r.workerUid,
    workplaceId: wp.id,
    type,
    date: r.from,
    supervisorName: by.name,
    reason,
    status: 'unread',
    createdAt: new Date().toISOString(),
  };
  await getRepo().put(wp.id, 'notifications', note);
}

export async function balancesFor(
  wp: WorkplaceRecord,
  member: MemberRecord,
  year: string,
  date: string
) {
  const uid = member.uid;
  const repo = getRepo();
  const [leave, claims] = await Promise.all([
    repo.list<LeaveRequest>(wp.id, 'leave'),
    repo.list<OvertimeClaim>(wp.id, 'claims'),
  ]);
  const mine = leave.filter((r) => r.workerUid === uid);
  return {
    requests: mine,
    balances: leaveBalances(
      mine,
      year,
      wp.leavePolicy,
      wp,
      compOffHours(claims.filter((c) => c.workerId === uid)),
      { from: member.serviceFrom ?? member.joinedAt.slice(0, 10), today: date }
    ),
    types: leaveTypes(wp).map((t) => ({ type: t.type, paid: t.paid })),
  };
}

leaveRouter.get('/leave', async (req, res, next) => {
  try {
    const { workplace, member } = ctx(req);
    const date = today(workplace.timezone);
    const mine = await balancesFor(workplace, member, date.slice(0, 4), date);
    const all = atLeast(member.role, 'supervisor')
      ? await getRepo().list<LeaveRequest>(workplace.id, 'leave')
      : [];
    res.json({
      today: date,
      balances: mine.balances,
      types: mine.types,
      requests: mine.requests.sort((a, b) => b.from.localeCompare(a.from)),
      team: all
        .filter((r) => r.workerUid !== member.uid)
        .sort((a, b) => a.from.localeCompare(b.from)),
    });
  } catch (err) {
    next(err);
  }
});

leaveRouter.post('/leave', async (req, res, next) => {
  try {
    const body = requestLeaveSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const date = today(workplace.timezone);
    if (body.to < body.from)
      throw new AppError(400, 'BAD_DATES', 'The end date is before the start date.');
    if (body.halfDay && body.from !== body.to) {
      throw new AppError(400, 'BAD_DATES', 'A half day must be a single date.');
    }
    if (body.from < addDays(date, -30) || body.to > addDays(date, 365)) {
      throw new AppError(400, 'BAD_DATES', 'Leave can cover from 30 days ago to a year ahead.');
    }
    if (!leaveTypes(workplace).some((t) => t.type === body.type)) {
      throw new AppError(400, 'LEAVE_TYPE', 'That kind of leave does not apply here.');
    }
    const days = leaveDays(
      workplace,
      body.type,
      body.from,
      body.to,
      weeklyOffOf(workplace),
      body.halfDay
    );
    if (days === 0) throw new AppError(400, 'NO_WORKING_DAYS', 'Those dates are all weekly offs.');

    const { requests, balances } = await balancesFor(
      workplace,
      member,
      body.from.slice(0, 4),
      date
    );
    const clash = findOverlap(requests, body.from, body.to);
    if (clash) {
      throw new AppError(
        409,
        'OVERLAPS',
        `You already have ${clash.type.replace('_', ' ')} from ${clash.from} to ${clash.to}.`
      );
    }
    const bal = balances.find((b) => b.type === body.type);
    if (bal) {
      if (bal.available < days) {
        throw new AppError(
          409,
          'NOT_ENOUGH_LEAVE',
          `You have ${bal.available} day(s) of ${body.type.replace('_', ' ')} left.`
        );
      }
    }

    const request: LeaveRequest = {
      id: newId('lv'),
      workplaceId: workplace.id,
      workerUid: member.uid,
      workerName: member.name,
      type: body.type,
      from: body.from,
      to: body.to,
      halfDay: body.halfDay,
      days,
      reason: body.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await getRepo().put(workplace.id, 'leave', request);
    await seal(workplace, request, 'requested', member, body.reason);
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

leaveRouter.post('/leave/decide', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = decideLeaveSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const r = await repo.get<LeaveRequest>(workplace.id, 'leave', body.leaveId);
    if (!r) throw new AppError(404, 'NOT_FOUND', 'Leave request not found.');
    if (r.workerUid === member.uid)
      throw new AppError(403, 'FORBIDDEN', 'Someone else must decide your leave.');
    if (r.status !== 'pending')
      throw new AppError(409, 'ALREADY_DECIDED', 'This request was already decided.');
    if (body.decision === 'rejected' && !body.reason) {
      throw new AppError(400, 'REASON_REQUIRED', 'Give a reason when rejecting leave.');
    }
    const updated: LeaveRequest = {
      ...r,
      status: body.decision,
      decidedBy: member.name,
      decidedAt: new Date().toISOString(),
      decisionReason: body.reason,
    };
    await repo.put(workplace.id, 'leave', updated);
    await seal(workplace, updated, body.decision, member, body.reason);
    await notify(
      workplace,
      updated,
      'LEAVE_DECIDED',
      member,
      `${body.decision === 'approved' ? 'Approved' : 'Rejected'}: ${r.type.replace('_', ' ')} ${r.from}${r.to !== r.from ? ` to ${r.to}` : ''}${body.reason ? `. ${body.reason}` : ''}`
    );
    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

/** The worker withdraws their own pending or future leave. */
leaveRouter.post('/leave/cancel', async (req, res, next) => {
  try {
    const { leaveId } = leaveIdSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const r = await repo.get<LeaveRequest>(workplace.id, 'leave', leaveId);
    if (!r || r.workerUid !== member.uid)
      throw new AppError(404, 'NOT_FOUND', 'Leave request not found.');
    if (
      r.status !== 'pending' &&
      !(r.status === 'approved' && r.from > today(workplace.timezone))
    ) {
      throw new AppError(409, 'CANNOT_CANCEL', 'Only pending or future leave can be cancelled.');
    }
    const updated: LeaveRequest = { ...r, status: 'cancelled' };
    await repo.put(workplace.id, 'leave', updated);
    await seal(workplace, updated, 'cancelled', member);
    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

/** Withdrawing approved leave is allowed, but always flagged and always told to the worker. */
leaveRouter.post('/leave/revoke', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = revokeLeaveSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const r = await repo.get<LeaveRequest>(workplace.id, 'leave', body.leaveId);
    if (!r) throw new AppError(404, 'NOT_FOUND', 'Leave request not found.');
    if (r.workerUid === member.uid)
      throw new AppError(403, 'FORBIDDEN', 'You cannot revoke your own leave.');
    if (r.status !== 'approved')
      throw new AppError(409, 'NOT_APPROVED', 'Only approved leave can be revoked.');
    const updated: LeaveRequest = {
      ...r,
      status: 'revoked',
      decidedBy: member.name,
      decidedAt: new Date().toISOString(),
      decisionReason: body.reason,
    };
    await repo.put(workplace.id, 'leave', updated);
    await seal(workplace, updated, 'revoked', member, body.reason);
    await notify(
      workplace,
      updated,
      'LEAVE_REVOKED',
      member,
      `Approved leave ${r.from}${r.to !== r.from ? ` to ${r.to}` : ''} was withdrawn. Reason: ${body.reason}`
    );
    const flags = await raiseFlags(workplace.id, [
      leaveRevoked(r.id, r.workerUid, member.name, r.from, r.to, body.reason),
    ]);
    res.json({ request: updated, flags });
  } catch (err) {
    next(err);
  }
});
