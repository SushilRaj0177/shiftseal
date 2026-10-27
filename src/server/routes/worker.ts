import { Router } from 'express';
import { getStore } from '../store/firestore.js';
import { DEMO_TODAY } from '../store/seed.js';
import { append, verify, latestView } from '../../shared/ledger/ledger.js';
import { calculateWeekHours } from '../../shared/rules/hours.js';
import { calculatePayslip } from '../../shared/rules/pay.js';
import { matchClaimAgainstLedger } from '../../shared/rules/claims.js';
import { evaluateSeverityFloor } from '../../shared/rules/severity.js';
import { evaluateGroupAnonymity } from '../../shared/rules/anonymity.js';
import {
  checkInOutInputSchema,
  notificationResponseSchema,
  submitClaimSchema,
  submitHazardSchema,
  submitFeedbackSchema,
} from '../../shared/schemas.js';
import { AppError } from '../middleware/errors.js';
import type { OvertimeClaim, HazardReport, AnonymousFeedbackEntry } from '../../shared/types.js';

export const workerRouter = Router();

workerRouter.get('/:workerId/overview', async (req, res, next) => {
  try {
    const store = getStore();
    const workerId = req.params.workerId;
    const worker = await store.getWorker(workerId);
    if (!worker) {
      throw new AppError(404, 'WORKER_NOT_FOUND', 'Worker profile not found.');
    }

    const workplace = await store.getWorkplace(worker.workplaceId);
    if (!workplace) {
      throw new AppError(404, 'WORKPLACE_NOT_FOUND', 'Workplace not found.');
    }

    const chain = await store.getWorkerChain(workerId);
    const chainVerification = verify(chain);
    const shifts = latestView(chain);
    const hoursResult = calculateWeekHours(shifts, worker.sector);

    const claims = await store.getWorkerClaims(workerId);
    const approvedClaimHours = claims
      .filter((c) => c.matchStatus === 'supported' || c.resolutionStatus === 'approved')
      .reduce((acc, c) => acc + (c.supportedHours > 0 ? c.supportedHours : c.extraHours), 0);

    const deductions = await store.getWorkerDeductions(workerId);
    const payslip = calculatePayslip({
      workerId,
      weekLabel: '19 Oct – 27 Oct 2026',
      sector: worker.sector,
      hourlyRate: worker.hourlyRate,
      dailyWage: worker.dailyWage,
      hoursResult,
      approvedClaimHours,
      deductions,
    });

    const notifications = await store.getWorkerNotifications(workerId);
    const hazards = (await store.getHazards(worker.workplaceId)).filter(
      (h) => !h.workerId || h.workerId === workerId
    );
    const allFeedback = await store.getFeedback(worker.workplaceId);
    const feedbackStatus = evaluateGroupAnonymity(
      worker.workplaceId,
      worker.team,
      allFeedback
    );

    const todayShift = shifts.find((s) => s.date === DEMO_TODAY);

    res.json({
      worker,
      workplace,
      todayDate: DEMO_TODAY,
      todayShift: todayShift ?? null,
      chain,
      chainVerification,
      shifts,
      hoursResult,
      payslip,
      claims,
      notifications,
      hazards,
      feedbackGroupStatus: {
        team: feedbackStatus.team,
        count: feedbackStatus.count,
        threshold: feedbackStatus.threshold,
        visible: feedbackStatus.visible,
        statusMessage: feedbackStatus.statusMessage,
      },
    });
  } catch (err) {
    next(err);
  }
});

workerRouter.post('/check-in-out', async (req, res, next) => {
  try {
    const parsed = checkInOutInputSchema.parse(req.body);
    const store = getStore();
    const worker = await store.getWorker(parsed.workerId);
    if (!worker) {
      throw new AppError(404, 'WORKER_NOT_FOUND', 'Worker not found.');
    }

    const chain = await store.getWorkerChain(parsed.workerId);
    const date = parsed.date ?? DEMO_TODAY;
    const nowTime =
      parsed.timestamp ??
      (parsed.action === 'CHECK_IN' ? '08:55' : '18:05');

    const eventId = `ev-${parsed.workerId}-${date}-${parsed.action.toLowerCase()}-${Date.now()}`;
    const updatedChain = append(chain, {
      id: eventId,
      workerId: parsed.workerId,
      type: parsed.action,
      createdAt: new Date().toISOString(),
      payload: {
        date,
        timestamp: nowTime,
        zoneCode: parsed.zoneCode,
        source: parsed.source ?? 'qr',
      },
    });

    await store.saveWorkerChain(parsed.workerId, updatedChain);
    const latestEvent = updatedChain[updatedChain.length - 1];

    res.status(201).json({
      event: latestEvent,
      chain: updatedChain,
      verification: verify(updatedChain),
    });
  } catch (err) {
    next(err);
  }
});

workerRouter.post('/notifications/respond', async (req, res, next) => {
  try {
    const parsed = notificationResponseSchema.parse(req.body);
    const store = getStore();
    const worker = await store.getWorker(parsed.workerId);
    if (!worker) {
      throw new AppError(404, 'WORKER_NOT_FOUND', 'Worker not found.');
    }

    const notifications = await store.getWorkerNotifications(parsed.workerId);
    const target = notifications.find((n) => n.id === parsed.notificationId);
    if (!target) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    }

    target.status = parsed.response === 'ok' ? 'acknowledged' : 'disputed';
    await store.saveNotification(target);

    let createdDispute: OvertimeClaim | null = null;
    if (parsed.response === 'disagree') {
      const chain = await store.getWorkerChain(parsed.workerId);
      const shifts = latestView(chain);
      const match = matchClaimAgainstLedger(
        {
          date: target.date,
          extraHours: 2.67,
          reason:
            parsed.note ||
            `Worker disagreed with checkout edit (${target.oldValue} → ${target.newValue})`,
        },
        shifts,
        worker.sector
      );

      createdDispute = {
        id: `dispute-${parsed.workerId}-${Date.now()}`,
        workerId: worker.id,
        workerName: worker.name,
        workplaceId: worker.workplaceId,
        date: target.date,
        extraHours: 2.67,
        reason:
          parsed.note ||
          `Disputed checkout edit from ${target.oldValue} to ${target.newValue} by ${target.supervisorName ?? 'Supervisor'}`,
        detectedLanguage: worker.preferredLanguage,
        matchStatus: match.status,
        supportedHours: match.supportedHours,
        evidence: match.evidence,
        resolutionStatus: 'pending',
        createdAt: new Date().toISOString(),
        kind: 'edit_disagree',
        relatedEditEventId: target.editEventId,
      };
      await store.saveClaim(createdDispute);
    }

    res.json({
      notification: target,
      dispute: createdDispute,
    });
  } catch (err) {
    next(err);
  }
});

workerRouter.post('/claims', async (req, res, next) => {
  try {
    const parsed = submitClaimSchema.parse(req.body);
    const store = getStore();
    const worker = await store.getWorker(parsed.workerId);
    if (!worker) {
      throw new AppError(404, 'WORKER_NOT_FOUND', 'Worker not found.');
    }

    const chain = await store.getWorkerChain(parsed.workerId);
    const shifts = latestView(chain);
    const match = matchClaimAgainstLedger(
      {
        date: parsed.date,
        extraHours: parsed.extraHours,
        reason: parsed.reason,
      },
      shifts,
      worker.sector
    );

    const claim: OvertimeClaim = {
      id: `claim-${parsed.workerId}-${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workplaceId: worker.workplaceId,
      date: parsed.date,
      extraHours: parsed.extraHours,
      reason: parsed.reason,
      detectedLanguage: parsed.detectedLanguage,
      matchStatus: match.status,
      supportedHours: match.supportedHours,
      evidence: match.evidence,
      resolutionStatus: match.status === 'supported' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      kind: 'overtime_claim',
      isDemoFallback: parsed.isDemoFallback,
    };

    await store.saveClaim(claim);
    res.status(201).json({ claim });
  } catch (err) {
    next(err);
  }
});

workerRouter.post('/hazards', async (req, res, next) => {
  try {
    const parsed = submitHazardSchema.parse(req.body);
    const store = getStore();
    const workplace = await store.getWorkplace(parsed.workplaceId);
    if (!workplace) {
      throw new AppError(404, 'WORKPLACE_NOT_FOUND', 'Workplace not found.');
    }

    const zone =
      workplace.zones.find((z) => z.id === parsed.zoneId || z.code === parsed.zoneId) ??
      workplace.zones[0];

    const severityEval = evaluateSeverityFloor(
      workplace.sector,
      parsed.hazardType,
      parsed.aiSeverity
    );

    const nowMs = Date.now();
    const deadlineMs = nowMs + severityEval.deadlineHours * 3600 * 1000;

    const hazard: HazardReport = {
      id: `haz-${workplace.id}-${nowMs}`,
      workplaceId: workplace.id,
      sector: workplace.sector,
      zoneId: zone.id,
      zoneName: zone.name,
      workerId: parsed.workerId,
      hazardType: parsed.hazardType,
      description: parsed.description,
      englishSummary: parsed.englishSummary,
      aiSeverity: parsed.aiSeverity,
      floorSeverity: severityEval.floorSeverity,
      finalSeverity: severityEval.finalSeverity,
      floorApplied: severityEval.floorApplied,
      ruleRef: severityEval.ruleRef,
      status: 'received',
      createdAt: new Date(nowMs).toISOString(),
      deadlineAt: new Date(deadlineMs).toISOString(),
      hasPhoto: Boolean(parsed.photoBase64),
      photoNote: parsed.photoBase64
        ? 'Compressed photo checked (<300 KB); description retained for privacy.'
        : undefined,
      detectedLanguage: parsed.detectedLanguage,
      isDemoFallback: parsed.isDemoFallback,
    };

    await store.saveHazard(hazard);
    res.status(201).json({ hazard });
  } catch (err) {
    next(err);
  }
});

workerRouter.post('/feedback', async (req, res, next) => {
  try {
    // Only cleaned text is accepted and saved. Original text/audio is NEVER stored.
    const parsed = submitFeedbackSchema.parse(req.body);
    const store = getStore();

    const entry: AnonymousFeedbackEntry = {
      id: `fb-${parsed.workplaceId}-${Date.now()}`,
      workplaceId: parsed.workplaceId,
      team: parsed.team,
      cleanText: parsed.cleanText,
      cleanTextEnglish: parsed.cleanTextEnglish,
      removed: parsed.removed,
      themes: parsed.themes,
      sentiment: parsed.sentiment,
      createdAt: new Date().toISOString(),
    };

    await store.saveFeedback(entry);

    const allFeedback = await store.getFeedback(parsed.workplaceId);
    const groupStatus = evaluateGroupAnonymity(
      parsed.workplaceId,
      parsed.team,
      allFeedback
    );

    res.status(201).json({
      saved: true,
      groupStatus: {
        team: groupStatus.team,
        count: groupStatus.count,
        threshold: groupStatus.threshold,
        visible: groupStatus.visible,
        statusMessage: groupStatus.statusMessage,
      },
    });
  } catch (err) {
    next(err);
  }
});
