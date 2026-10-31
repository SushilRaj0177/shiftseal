import { minorRules, studentReadings } from '../../shared/rules/students.js';
import { shiftsEverywhere, studentProfileOf } from '../services/students.js';
import { Router } from 'express';
import { createHash } from 'node:crypto';
import { z } from 'zod/v3';
import type {
  AnonymousFeedbackEntry,
  HazardReport,
  OvertimeClaim,
  WorkerNotification,
} from '../../shared/types.js';
import type {
  Complaint,
  FlagRecord,
  LeaveRequest,
  PaymentConfirmation,
} from '../../shared/model.js';
import {
  aiClaimSchema,
  aiExplainPaySchema,
  aiHazardSchema,
  confirmPaymentSchema,
  disputeHazardFixSchema,
  photoSchema,
  resolveClaimSchema,
  resolveFlagSchema,
  submitClaimRequestSchema,
  submitFeedbackRequestSchema,
  submitHazardRequestSchema,
  updateHazardSchema,
} from '../../shared/apiSchemas.js';
import { latestView, verify } from '../../shared/ledger/ledger.js';
import { matchClaimAgainstLedger } from '../../shared/rules/claims.js';
import { evaluateSeverityFloor } from '../../shared/rules/severity.js';
import { evaluateGroupAnonymity } from '../../shared/rules/anonymity.js';
import { evaluateWorkerFatigueAndAttrition } from '../../shared/rules/fatigue.js';
import { getRule } from '../../shared/rules/index.js';
import { countryPack, payDueDate } from '../../shared/countries/index.js';
import { limitReadings } from '../../shared/rules/limits.js';
import { annualPaymentsFor } from '../services/payroll.js';
import {
  assessClaim,
  assessHazardReport,
  assessHazardResolution,
  assessPayment,
  hazardFixDisputed,
} from '../../shared/rules/flags.js';
import { addDays, localParts, minutesBetween, periodFor } from '../../shared/time.js';
import { evaluateBurnout } from '../../shared/rules/burnout.js';
import { leaveBalances, leaveOn, minLeaveTaken } from '../../shared/rules/leave.js';
import type { FlagDraft } from '../../shared/rules/flags.js';
import { assessComplaintCompliance } from '../../shared/rules/flags.js';
import { complaintCounts } from './complaints.js';
import { balancesFor } from './leave.js';
import { atLeast, ctx, requireRole } from '../auth/membership.js';
import { getRepo } from '../data/index.js';
import { aiRateLimiter } from '../middleware/security.js';
import { AppError } from '../middleware/errors.js';
import {
  anonymiseFeedback,
  explainPay,
  structureClaim,
  structureHazard,
} from '../gemini/client.js';
import { openShift } from '../services/chain.js';
import { raiseFlags, visibleFlags } from '../services/flags.js';
import { newId } from '../services/ids.js';
import {
  memberAsProfile,
  payslipFor,
  weeklyOffOf,
  type StoredDeduction,
} from '../services/payroll.js';

export const reportsRouter = Router({ mergeParams: true });

const nowIso = () => new Date().toISOString();
const today = (tz: string) => localParts(new Date(), tz).date;

async function savePhoto(
  workplaceId: string,
  uploaderUid: string,
  photo: z.infer<typeof photoSchema>
) {
  const id = newId('pho');
  const sha256 = createHash('sha256').update(photo.dataUrl).digest('hex');
  await getRepo().put(workplaceId, 'photos', {
    id,
    ...photo,
    sha256,
    uploaderUid,
    uploadedAt: nowIso(),
  });
  return id;
}

async function loadWorkerData(workplaceId: string, uid: string) {
  const repo = getRepo();
  const [chain, claims, deductions, leave] = await Promise.all([
    repo.getChain(workplaceId, uid),
    repo.list<OvertimeClaim>(workplaceId, 'claims'),
    repo.list<StoredDeduction>(workplaceId, 'deductions'),
    repo.list<LeaveRequest>(workplaceId, 'leave'),
  ]);
  return {
    chain,
    claims: claims.filter((c) => c.workerId === uid),
    deductions,
    leave: leave.filter((r) => r.workerUid === uid),
  };
}

// ------------------------------------------------------------------ worker overview

reportsRouter.get('/me', async (req, res, next) => {
  try {
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const date = today(workplace.timezone);
    const period = periodFor(workplace, date);
    const lastPeriod = periodFor(workplace, addDays(period.start, -1));
    const { chain, claims, deductions, leave } = await loadWorkerData(workplace.id, member.uid);
    const { balances, types: leaveKinds } = await balancesFor(
      workplace,
      member,
      date.slice(0, 4),
      date
    );
    const shifts = latestView(chain);
    const user = await repo.getUser(member.uid);
    const [notifications, hazards, feedback, flags, payments, receipts] = await Promise.all([
      repo.list<WorkerNotification>(workplace.id, 'notifications'),
      repo.list<HazardReport>(workplace.id, 'hazards'),
      repo.list<AnonymousFeedbackEntry>(workplace.id, 'feedback'),
      repo.list<FlagRecord>(workplace.id, 'flags'),
      repo.list<PaymentConfirmation>(workplace.id, 'payments'),
      repo.list<{ id: string; workerUid: string }>(workplace.id, 'receipts'),
    ]);

    res.json({
      today: date,
      period,
      openShift: openShift(chain) ?? null,
      shifts: shifts.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60),
      chain,
      chainVerification: verify(chain),
      receipts: receipts.filter((r) => r.workerUid === member.uid),
      payslip: payslipFor(member, workplace, shifts, claims, deductions, period, leave),
      lastPayslip: payslipFor(member, workplace, shifts, claims, deductions, lastPeriod, leave),
      payType: member.payType ?? (member.hourlyRate > 0 ? 'hourly' : 'daily'),
      overtime: member.overtime ?? 'paid',
      country: workplace.country ?? 'IN',
      currency: countryPack(workplace).currency,
      limits: [
        ...studentReadings(
          studentProfileOf(user),
          await shiftsEverywhere(user, member.uid, workplace.id),
          workplace,
          date
        ),
        ...limitReadings(shifts, workplace, date),
      ],
      student: studentProfileOf(user),
      studentRules: countryPack(workplace).students ?? null,
      annualPayments: annualPaymentsFor(workplace, member, date),
      leave: {
        types: leaveKinds,
        balances,
        minTaken: minLeaveTaken(workplace, balances),
        pending: leave.filter((r) => r.status === 'pending').length,
        today: leaveOn(leave, date) ?? null,
        upcoming: leave
          .filter((r) => r.status === 'approved' && r.from > date)
          .sort((a, b) => a.from.localeCompare(b.from))
          .slice(0, 3),
      },
      lastPeriod,
      lastPayment:
        payments.find((p) => p.workerUid === member.uid && p.periodStart === lastPeriod.start) ??
        null,
      claims: claims.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      notifications: notifications
        .filter((n) => n.workerId === member.uid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      hazards: hazards
        .filter((h) => h.status !== 'resolved' || h.reporterUids?.includes(member.uid))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 30),
      feedbackGroup: (({ team, count, threshold, visible }) => ({
        team,
        count,
        threshold,
        visible,
      }))(evaluateGroupAnonymity(workplace.id, member.team, feedback)),
      flags: visibleFlags(flags, member.uid, false),
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ employer dashboard

reportsRouter.get('/dashboard', requireRole('supervisor'), async (req, res, next) => {
  try {
    const { workplace } = ctx(req);
    const repo = getRepo();
    const date = today(workplace.timezone);
    const period = periodFor(workplace, date);
    const [members, claims, hazards, feedback, flags, deductions, leave, complaints] =
      await Promise.all([
        repo.listMembers(workplace.id),
        repo.list<OvertimeClaim>(workplace.id, 'claims'),
        repo.list<HazardReport>(workplace.id, 'hazards'),
        repo.list<AnonymousFeedbackEntry>(workplace.id, 'feedback'),
        repo.list<FlagRecord>(workplace.id, 'flags'),
        repo.list<StoredDeduction>(workplace.id, 'deductions'),
        repo.list<LeaveRequest>(workplace.id, 'leave'),
        repo.list<Complaint>(workplace.id, 'complaints'),
      ]);
    const active = members.filter((m) => m.status === 'active');
    const workers = active.filter((m) => m.role !== 'owner');

    const people = [];
    const fatigue = [];
    const burnout = [];
    let otOwed = 0;
    let onSite = 0;
    const leaveDrafts: FlagDraft[] = [];
    for (const m of workers) {
      const chain = await repo.getChain(workplace.id, m.uid);
      const shifts = latestView(chain);
      const todays = shifts.find((s) => s.date === date);
      // The employer sees that someone is a student or under 18, never their birth date.
      const account = await repo.getUser(m.uid);
      const youngRules = minorRules(
        countryPack(workplace).students,
        studentProfileOf(account),
        date
      );
      const open = openShift(chain);
      if (open) onSite += 1;
      const mine = claims.filter((c) => c.workerId === m.uid);
      const theirLeave = leave.filter((r) => r.workerUid === m.uid);
      // Japan: from October, flag anyone not yet given their 5 days of annual leave.
      if (date.slice(5, 7) >= '10') {
        const year = date.slice(0, 4);
        const min = minLeaveTaken(
          workplace,
          leaveBalances(theirLeave, year, workplace.leavePolicy, workplace, 0, {
            from: m.serviceFrom ?? m.joinedAt.slice(0, 10),
            today: date,
          })
        );
        const id = `${m.uid}:minleave:${year}`;
        if (min && min.taken < min.required && !flags.some((f) => f.subject.id === id)) {
          leaveDrafts.push({
            code: 'LEAVE_MIN_NOT_TAKEN',
            severity: 'review',
            concerns: 'employer',
            subject: { kind: 'workplace', id, workerUid: m.uid },
            message: `${m.name} has taken ${min.taken} of the ${min.required} days of annual leave the law requires the employer to ensure this year.`,
            facts: { taken: min.taken, required: min.required },
          });
        }
      }
      const slip = payslipFor(m, workplace, shifts, mine, deductions, period, theirLeave);
      const b = evaluateBurnout(
        shifts,
        theirLeave,
        date,
        weeklyOffOf(workplace),
        workplace,
        m.joinedAt.slice(0, 10)
      );
      if (b.level !== 'low') burnout.push({ workerId: m.uid, workerName: m.name, ...b });
      const away = leaveOn(theirLeave, date);
      otOwed +=
        slip?.lines
          .filter((l) => l.kind === 'overtime' || l.kind === 'claim_overtime')
          .reduce((a, l) => a + l.amount, 0) ?? 0;
      fatigue.push(
        evaluateWorkerFatigueAndAttrition(memberAsProfile(m, workplace, shifts, date), shifts, mine)
      );
      people.push({
        uid: m.uid,
        name: m.name,
        title: m.title,
        team: m.team,
        role: m.role,
        status: open
          ? 'on_site'
          : todays
            ? 'checked_out'
            : away
              ? away.type === 'wfh'
                ? 'wfh'
                : 'on_leave'
              : 'absent',
        checkIn: todays?.checkInTime ?? null,
        checkOut: todays?.checkOutTime ?? null,
        rateSet:
          m.payType === 'monthly'
            ? (m.monthlySalary ?? 0) > 0
            : m.hourlyRate > 0 || m.dailyWage > 0,
        icMember: Boolean(m.icMember),
        pendingDevice: Boolean(m.pendingDevice),
        student: account?.student ?? null,
        minor: Boolean(youngRules),
        hasDevice: Boolean(m.device),
        chainOk: verify(chain).ok,
        netPay: slip?.netPay ?? null,
      });
    }

    const since = addDays(date, -30);
    const hotspotRule = getRule(workplace, 'hazard.hotspotThreshold');
    const hotspots = workplace.zones.map((z) => {
      const count = hazards
        .filter((h) => h.zoneId === z.code && h.createdAt.slice(0, 10) >= since)
        .reduce((n, h) => n + (h.reporterUids?.length ?? 1), 0);
      return {
        code: z.code,
        name: z.name,
        kind: z.kind,
        count,
        isHotspot: count >= hotspotRule.value,
      };
    });
    const teams = [...new Set(workers.map((m) => m.team))];

    // Harassment complaint duties under this country's law: counts only, never details.
    const complaintRules = countryPack(workplace).complaints;
    const counts = complaintCounts(complaints, complaintRules.inquiryDays);
    const poshDrafts = assessComplaintCompliance(
      workplace.id,
      active.length,
      active.filter((m) => m.icMember).length,
      complaintRules.handlersRequiredFrom,
      counts.overdue,
      complaintRules.inquiryDays
    ).filter((d) => !flags.some((f) => f.code === d.code && f.status === 'open'));
    flags.push(...(await raiseFlags(workplace.id, [...poshDrafts, ...leaveDrafts])));

    res.json({
      today: date,
      period,
      workplace,
      people,
      kpis: {
        workers: workers.length,
        onSite,
        openClaims: claims.filter((c) => c.resolutionStatus === 'pending').length,
        openHazards: hazards.filter((h) => h.status !== 'resolved').length,
        openFlags: flags.filter((f) => f.status === 'open').length,
        pendingLeave: leave.filter((r) => r.status === 'pending').length,
        overtimeOwed: Math.round(otOwed),
      },
      claims: claims.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      hazards: hazards.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      flags: flags.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      hotspots,
      fatigue: fatigue.filter((f) => f.fatigueLevel !== 'low' || f.attritionLevel !== 'low'),
      burnout,
      leave: {
        pending: leave
          .filter((r) => r.status === 'pending')
          .sort((a, b) => a.from.localeCompare(b.from)),
        today: leave.filter((r) => r.status === 'approved' && r.from <= date && date <= r.to),
      },
      complaints: {
        committeeSize: active.filter((m) => m.icMember).length,
        open: counts.open,
        overdue: counts.overdue,
      },
      feedbackGroups: teams.map((t) => evaluateGroupAnonymity(workplace.id, t, feedback)),
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ claims

reportsRouter.post('/claims', async (req, res, next) => {
  try {
    const body = submitClaimRequestSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const date = today(workplace.timezone);
    if (body.date > date || body.date < addDays(date, -60)) {
      throw new AppError(400, 'DATE_OUT_OF_RANGE', 'Claims can cover the last 60 days.');
    }
    const repo = getRepo();
    const { chain, claims } = await loadWorkerData(workplace.id, member.uid);
    const shifts = latestView(chain);
    const match = matchClaimAgainstLedger(
      { date: body.date, extraHours: body.extraHours, reason: body.reason },
      shifts,
      workplace.sector
    );

    // Co-workers whose recorded checkout reaches the claimed end time back the claim up.
    const claimedEndMin = minutesBetween('00:00', workplace.shiftEnd) + body.extraHours * 60;
    let corroborating = 0;
    for (const m of await repo.listMembers(workplace.id)) {
      if (m.uid === member.uid) continue;
      const s = latestView(await repo.getChain(workplace.id, m.uid)).find(
        (x) => x.date === body.date
      );
      if (
        s?.originalCheckOutTime &&
        minutesBetween('00:00', s.originalCheckOutTime) >= claimedEndMin
      )
        corroborating += 1;
    }

    const claim: OvertimeClaim = {
      id: newId('clm'),
      workerId: member.uid,
      workerName: member.name,
      workplaceId: workplace.id,
      date: body.date,
      extraHours: body.extraHours,
      reason: body.reason,
      detectedLanguage: body.detectedLanguage,
      matchStatus: match.status,
      supportedHours: match.supportedHours,
      evidence: {
        ...match.evidence,
        explanation: `${match.evidence.explanation} Co-workers on site until then: ${corroborating}.`,
      },
      resolutionStatus: 'pending',
      createdAt: nowIso(),
      kind: 'overtime_claim',
      compensation: member.overtime === 'comp_off' ? 'comp_off' : 'pay',
    };
    const flags = await raiseFlags(
      workplace.id,
      assessClaim({
        claimId: claim.id,
        workerUid: member.uid,
        date: body.date,
        extraHours: body.extraHours,
        hasShift: shifts.some((s) => s.date === body.date),
        scheduledHours: minutesBetween(workplace.shiftStart, workplace.shiftEnd) / 60,
        otherClaimDates: claims
          .filter((c) => c.kind === 'overtime_claim' && c.resolutionStatus !== 'rejected')
          .map((c) => c.date),
        corroboratingCoworkers: corroborating,
        supported: match.status === 'supported',
      })
    );
    await repo.put(workplace.id, 'claims', claim);
    res.status(201).json({ claim, flags });
  } catch (err) {
    next(err);
  }
});

reportsRouter.post('/claims/resolve', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = resolveClaimSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const claim = await repo.get<OvertimeClaim>(workplace.id, 'claims', body.claimId);
    if (!claim) throw new AppError(404, 'NOT_FOUND', 'Claim not found.');
    if (claim.workerId === member.uid)
      throw new AppError(403, 'FORBIDDEN', 'You cannot decide your own claim.');
    if (claim.resolutionStatus !== 'pending')
      throw new AppError(409, 'ALREADY_RESOLVED', 'This claim was already decided.');
    const updated: OvertimeClaim = {
      ...claim,
      resolutionStatus: body.decision,
      resolutionReason: body.reason,
      resolvedBy: member.name,
      resolvedAt: nowIso(),
    };
    await repo.put(workplace.id, 'claims', updated);
    const note: WorkerNotification = {
      id: newId('ntf'),
      workerId: claim.workerId,
      workplaceId: workplace.id,
      type: 'DISPUTE_RESOLVED',
      date: claim.date,
      supervisorName: member.name,
      reason: `${body.decision === 'approved' ? 'Approved' : 'Rejected'}: ${body.reason}`,
      status: 'unread',
      createdAt: nowIso(),
    };
    await repo.put(workplace.id, 'notifications', note);
    res.json({ claim: updated });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ hazards

reportsRouter.post('/hazards', async (req, res, next) => {
  try {
    const body = submitHazardRequestSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const zone = workplace.zones.find((z) => z.code === body.zoneCode);
    if (!zone) throw new AppError(404, 'ZONE_NOT_FOUND', 'Zone not found.');
    const repo = getRepo();
    const severity = evaluateSeverityFloor(workplace.sector, body.hazardType, body.aiSeverity);
    const hasCameraPhoto = body.photo?.source === 'camera';

    // A repeat report of the same open hazard is merged rather than duplicated.
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const existing = (await repo.list<HazardReport>(workplace.id, 'hazards')).find(
      (h) =>
        h.zoneId === zone.code &&
        h.hazardType === body.hazardType &&
        h.status !== 'resolved' &&
        h.createdAt >= dayAgo
    );
    if (existing) {
      const merged = {
        ...existing,
        reporterUids: [...new Set([...(existing.reporterUids ?? []), member.uid])],
      };
      await repo.put(workplace.id, 'hazards', merged);
      res.status(200).json({ hazard: merged, merged: true, flags: [] });
      return;
    }

    const photoId = body.photo ? await savePhoto(workplace.id, member.uid, body.photo) : undefined;
    const createdAt = nowIso();
    const hazard: HazardReport = {
      id: newId('hz'),
      workplaceId: workplace.id,
      sector: workplace.sector,
      zoneId: zone.code,
      zoneName: zone.name,
      workerId: member.uid,
      hazardType: body.hazardType,
      description: body.description,
      englishSummary: body.englishSummary,
      aiSeverity: body.aiSeverity,
      floorSeverity: severity.floorSeverity,
      finalSeverity: severity.finalSeverity,
      floorApplied: severity.floorApplied,
      ruleRef: severity.ruleRef,
      status: 'received',
      createdAt,
      deadlineAt: new Date(
        Date.parse(createdAt) + severity.deadlineHours * 3600 * 1000
      ).toISOString(),
      hasPhoto: Boolean(photoId),
      photoId,
      detectedLanguage: body.detectedLanguage,
      isDemoFallback: body.aiUnavailable,
      reporterUids: [member.uid],
    };
    await repo.put(workplace.id, 'hazards', hazard);
    const flags = await raiseFlags(
      workplace.id,
      assessHazardReport({
        hazardId: hazard.id,
        workerUid: member.uid,
        hasPhoto: hasCameraPhoto,
        fix: body.location,
        fence: zone.geofence ?? workplace.geofence,
      })
    );
    res.status(201).json({ hazard, merged: false, flags });
  } catch (err) {
    next(err);
  }
});

reportsRouter.post('/hazards/status', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = updateHazardSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const hazard = await repo.get<HazardReport>(workplace.id, 'hazards', body.hazardId);
    if (!hazard) throw new AppError(404, 'NOT_FOUND', 'Hazard not found.');
    const at = nowIso();
    const updated: HazardReport = { ...hazard, status: body.status, fixDisputed: false };
    let flags: FlagRecord[] = [];
    if (body.status === 'acknowledged') updated.acknowledgedAt = hazard.acknowledgedAt ?? at;
    if (body.status === 'resolved') {
      updated.resolvedAt = at;
      updated.resolvedBy = member.name;
      if (body.photo) updated.fixPhotoId = await savePhoto(workplace.id, member.uid, body.photo);
      const draft = assessHazardResolution(hazard.id, body.photo?.source === 'camera');
      if (draft) flags = await raiseFlags(workplace.id, [draft]);
    }
    await repo.put(workplace.id, 'hazards', updated);
    for (const uid of hazard.reporterUids ?? []) {
      const note: WorkerNotification = {
        id: newId('ntf'),
        workerId: uid,
        workplaceId: workplace.id,
        type: 'HAZARD_UPDATED',
        date: today(workplace.timezone),
        supervisorName: member.name,
        reason:
          body.status === 'resolved'
            ? `${hazard.zoneName}: marked fixed. Tell us if it is not.`
            : `${hazard.zoneName}: seen and being handled.`,
        status: 'unread',
        createdAt: at,
      };
      await repo.put(workplace.id, 'notifications', note);
    }
    res.json({ hazard: updated, flags });
  } catch (err) {
    next(err);
  }
});

/** The reporter says a hazard marked fixed is not fixed. */
reportsRouter.post('/hazards/dispute', async (req, res, next) => {
  try {
    const body = disputeHazardFixSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const hazard = await repo.get<HazardReport>(workplace.id, 'hazards', body.hazardId);
    if (!hazard || !hazard.reporterUids?.includes(member.uid))
      throw new AppError(404, 'NOT_FOUND', 'Hazard not found.');
    if (hazard.status !== 'resolved')
      throw new AppError(409, 'NOT_RESOLVED', 'This hazard is still open.');
    if (body.photo) await savePhoto(workplace.id, member.uid, body.photo);
    const updated: HazardReport = { ...hazard, status: 'acknowledged', fixDisputed: true };
    await repo.put(workplace.id, 'hazards', updated);
    const flags = await raiseFlags(workplace.id, [
      hazardFixDisputed(hazard.id, member.uid, body.note),
    ]);
    res.json({ hazard: updated, flags });
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/photos/:id', async (req, res, next) => {
  try {
    const { workplace, member } = ctx(req);
    const photo = await getRepo().get<{ id: string; dataUrl: string; uploaderUid: string }>(
      workplace.id,
      'photos',
      String(req.params.id)
    );
    if (!photo || (photo.uploaderUid !== member.uid && !atLeast(member.role, 'supervisor'))) {
      throw new AppError(404, 'NOT_FOUND', 'Photo not found.');
    }
    const [, b64] = photo.dataUrl.split(',');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(Buffer.from(b64, 'base64'));
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ anonymous feedback

reportsRouter.post('/feedback', async (req, res, next) => {
  try {
    const body = submitFeedbackRequestSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    // Stored without any link to the person: only the team and the cleaned text.
    const entry: AnonymousFeedbackEntry = {
      id: newId('fb'),
      workplaceId: workplace.id,
      team: member.team,
      ...body,
      createdAt: `${today(workplace.timezone)}T00:00:00.000Z`,
    };
    await getRepo().put(workplace.id, 'feedback', entry);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ pay

reportsRouter.post('/payments/confirm', async (req, res, next) => {
  try {
    const body = confirmPaymentSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const period = periodFor(workplace, body.periodStart);
    if (period.start !== body.periodStart || period.payDate > today(workplace.timezone)) {
      throw new AppError(
        400,
        'PERIOD_NOT_PAID',
        'You can confirm a payment once payday has passed.'
      );
    }
    const { chain, claims, deductions, leave } = await loadWorkerData(workplace.id, member.uid);
    const slip = payslipFor(
      member,
      workplace,
      latestView(chain),
      claims,
      deductions,
      period,
      leave
    );
    if (!slip) throw new AppError(409, 'NO_PAYSLIP', 'Your wage has not been set yet.');
    const receivedOn = body.receivedOn ?? today(workplace.timezone);
    if (receivedOn > today(workplace.timezone))
      throw new AppError(400, 'BAD_DATE', 'That date is in the future.');
    // When pay is legally due in this country (India: the 7th; Brazil: 5th business day; ...).
    const dueDate = payDueDate(workplace, period);
    const confirmation: PaymentConfirmation = {
      id: `${member.uid}_${period.start}`,
      workplaceId: workplace.id,
      workerUid: member.uid,
      periodStart: period.start,
      periodEnd: period.end,
      expectedNet: slip.netPay,
      receivedAmount: body.receivedAmount,
      receivedOn,
      createdAt: nowIso(),
    };
    await getRepo().put(workplace.id, 'payments', confirmation);
    const flags = await raiseFlags(
      workplace.id,
      assessPayment(
        confirmation.id,
        member.uid,
        slip.netPay,
        body.receivedAmount,
        receivedOn,
        dueDate
      )
    );
    res.status(201).json({ confirmation, flags });
  } catch (err) {
    next(err);
  }
});

const deductionSchema = z.object({
  workerUid: z.string().min(1).max(128),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.string().trim().min(2).max(60),
  amount: z.number().min(1).max(1_000_000),
  reason: z.string().trim().min(5, 'A reason is required for every deduction').max(300),
});

reportsRouter.post('/deductions', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = deductionSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const target = await getRepo().getMember(workplace.id, body.workerUid);
    if (!target) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Worker not found.');
    if (target.uid === member.uid)
      throw new AppError(403, 'FORBIDDEN', 'You cannot change your own pay.');
    const item: StoredDeduction = {
      id: newId('ded'),
      ...body,
      periodStart: periodFor(workplace, body.periodStart).start,
      createdBy: member.uid,
      createdAt: nowIso(),
    };
    await getRepo().put(workplace.id, 'deductions', item);
    res.status(201).json({ deduction: item });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ flags

reportsRouter.get('/flags', async (req, res, next) => {
  try {
    const { workplace, member } = ctx(req);
    const flags = await getRepo().list<FlagRecord>(workplace.id, 'flags');
    res.json({
      flags: visibleFlags(flags, member.uid, atLeast(member.role, 'supervisor')).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    });
  } catch (err) {
    next(err);
  }
});

reportsRouter.post('/flags/resolve', requireRole('supervisor'), async (req, res, next) => {
  try {
    const body = resolveFlagSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const flag = await repo.get<FlagRecord>(workplace.id, 'flags', body.flagId);
    if (!flag) throw new AppError(404, 'NOT_FOUND', 'Flag not found.');
    // Nobody closes a flag about themselves, and only the owner closes flags that question the employer.
    if (
      flag.subject.workerUid === member.uid ||
      (flag.subject.kind === 'supervisor' && flag.subject.id === member.uid)
    ) {
      throw new AppError(403, 'FORBIDDEN', 'Someone else must review a flag about you.');
    }
    if (flag.concerns === 'employer' && member.role !== 'owner') {
      throw new AppError(403, 'FORBIDDEN', 'Only the owner can close this flag.');
    }
    const updated: FlagRecord = {
      ...flag,
      status: body.status,
      resolution: body.resolution,
      resolvedBy: member.name,
    };
    await repo.put(workplace.id, 'flags', updated);
    res.json({ flag: updated });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ AI assistance

reportsRouter.post('/ai/claim', aiRateLimiter, async (req, res, next) => {
  try {
    const body = aiClaimSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const structured = await structureClaim(body, body.lang, today(workplace.timezone));
    const shifts = latestView(await getRepo().getChain(workplace.id, member.uid));
    const match = matchClaimAgainstLedger(structured, shifts, workplace.sector);
    res.json({ structuredClaim: structured, matchResult: match });
  } catch (err) {
    next(err);
  }
});

reportsRouter.post('/ai/explain-pay', aiRateLimiter, async (req, res, next) => {
  try {
    const body = aiExplainPaySchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const { chain, claims, deductions, leave } = await loadWorkerData(workplace.id, member.uid);
    const period = periodFor(workplace, today(workplace.timezone));
    const slip = payslipFor(
      member,
      workplace,
      latestView(chain),
      claims,
      deductions,
      period,
      leave
    );
    if (!slip) throw new AppError(409, 'NO_PAYSLIP', 'Your wage has not been set yet.');
    res.json(await explainPay(body, slip, body.lang));
  } catch (err) {
    next(err);
  }
});

reportsRouter.post('/ai/hazard', aiRateLimiter, async (req, res, next) => {
  try {
    const body = aiHazardSchema.parse(req.body);
    const { workplace } = ctx(req);
    const zone = workplace.zones.find((z) => z.code === body.zoneCode);
    if (!zone) throw new AppError(404, 'ZONE_NOT_FOUND', 'Zone not found.');
    const structured = await structureHazard(body, workplace.sector, zone.name, body.lang);
    res.json({
      structuredHazard: structured,
      severityEvaluation: evaluateSeverityFloor(
        workplace.sector,
        structured.hazardType,
        structured.aiSeverity
      ),
    });
  } catch (err) {
    next(err);
  }
});

reportsRouter.post('/ai/feedback-preview', aiRateLimiter, async (req, res, next) => {
  try {
    // Never log or store the original text or audio.
    const body = aiClaimSchema.parse(req.body);
    const preview = await anonymiseFeedback(body, body.lang);
    res.json({ preview, privacyNote: 'Your voice and original words are not stored.' });
  } catch (err) {
    next(err);
  }
});
