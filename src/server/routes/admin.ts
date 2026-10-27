import { Router } from 'express';
import QRCode from 'qrcode';
import { getStore } from '../store/firestore.js';
import { DEMO_TODAY } from '../store/seed.js';
import { requireAdminRole } from '../middleware/security.js';
import { AppError } from '../middleware/errors.js';
import {
  adminEditShiftSchema,
  adminResolveDisputeSchema,
  adminUpdateHazardSchema,
} from '../../shared/schemas.js';
import { append, latestView, verify } from '../../shared/ledger/ledger.js';
import { calculateWeekHours, parseTimeMinutes } from '../../shared/rules/hours.js';
import { calculatePayslip } from '../../shared/rules/pay.js';
import { evaluateWorkerFatigueAndAttrition } from '../../shared/rules/fatigue.js';
import { evaluateGroupAnonymity } from '../../shared/rules/anonymity.js';
import { getRule } from '../../shared/rules/index.js';
import type { WorkerNotification, LedgerCheckOutPayload } from '../../shared/types.js';

export const adminRouter = Router();

adminRouter.use(requireAdminRole);

adminRouter.get('/dashboard/:workplaceId', async (req, res, next) => {
  try {
    const store = getStore();
    const workplaceId = req.params.workplaceId;
    const workplace = await store.getWorkplace(workplaceId);
    if (!workplace) {
      throw new AppError(404, 'WORKPLACE_NOT_FOUND', 'Workplace not found.');
    }

    const workers = await store.getWorkers(workplaceId);
    const allClaims = await store.getClaims(workplaceId);
    const hazards = await store.getHazards(workplaceId);
    const allFeedback = await store.getFeedback(workplaceId);

    const hotspotRule = getRule(workplace.sector, 'hazard.hotspotThreshold');
    const cutoffMs = Date.parse(`${DEMO_TODAY}T23:59:59Z`) - 14 * 24 * 3600 * 1000;

    const hotspots = workplace.zones.map((z) => {
      const count = hazards.filter(
        (h) => h.zoneId === z.id && Date.parse(h.createdAt) >= cutoffMs
      ).length;
      return {
        zoneId: z.id,
        zoneName: z.name,
        code: z.code,
        icon: z.icon,
        reportCount14d: count,
        threshold: hotspotRule.value,
        isHotspot: count >= hotspotRule.value,
      };
    });

    const workerSummaries = [];
    const fatigueSignals = [];
    let totalOvertimeOwedAmount = 0;
    let totalOvertimeHours = 0;

    let checkedInToday = 0;
    let lateToday = 0;
    let absentToday = 0;

    for (const w of workers) {
      const chain = await store.getWorkerChain(w.id);
      const shifts = latestView(chain);
      const hoursResult = calculateWeekHours(shifts, w.sector);
      const workerClaims = allClaims.filter((c) => c.workerId === w.id);
      const approvedClaimHours = workerClaims
        .filter((c) => c.matchStatus === 'supported' || c.resolutionStatus === 'approved')
        .reduce((acc, c) => acc + (c.supportedHours > 0 ? c.supportedHours : c.extraHours), 0);

      const deductions = await store.getWorkerDeductions(w.id);
      const payslip = calculatePayslip({
        workerId: w.id,
        weekLabel: '19 Oct – 27 Oct 2026',
        sector: w.sector,
        hourlyRate: w.hourlyRate,
        dailyWage: w.dailyWage,
        hoursResult,
        approvedClaimHours,
        deductions,
      });

      const otLine = payslip.lines.find((l) => l.kind === 'overtime');
      const claimOtLine = payslip.lines.find((l) => l.kind === 'claim_overtime');
      const workerOtOwed = (otLine?.amount ?? 0) + (claimOtLine?.amount ?? 0);
      const workerOtHours = hoursResult.otHours + approvedClaimHours;

      totalOvertimeOwedAmount += workerOtOwed;
      totalOvertimeHours += workerOtHours;

      const signal = evaluateWorkerFatigueAndAttrition(w, shifts, workerClaims);
      fatigueSignals.push(signal);

      const todayShift = shifts.find((s) => s.date === DEMO_TODAY);
      let todayAttendance: 'checked_in' | 'late' | 'absent' = 'absent';
      if (todayShift) {
        checkedInToday += 1;
        const inMin = parseTimeMinutes(todayShift.checkInTime);
        if (inMin > 9 * 60 + 15 && inMin < 18 * 60) {
          lateToday += 1;
          todayAttendance = 'late';
        } else {
          todayAttendance = 'checked_in';
        }
      } else {
        absentToday += 1;
      }

      workerSummaries.push({
        worker: w,
        shifts,
        chainOk: verify(chain).ok,
        normalHours: hoursResult.normalHours,
        otHours: workerOtHours,
        otAmountOwed: Math.round(workerOtOwed * 100) / 100,
        netPay: payslip.netPay,
        todayAttendance,
        todayCheckIn: todayShift?.checkInTime ?? null,
      });
    }

    // Group feedback by unique team
    const teams = Array.from(new Set(workers.map((w) => w.team)));
    const feedbackGroups = teams.map((team) =>
      evaluateGroupAnonymity(workplaceId, team, allFeedback)
    );

    res.json({
      workplace,
      todayDate: DEMO_TODAY,
      disputes: allClaims,
      hazards,
      hotspots,
      fatigueSignals,
      overtimeSummary: {
        totalHours: Math.round(totalOvertimeHours * 100) / 100,
        totalAmount: Math.round(totalOvertimeOwedAmount * 100) / 100,
        workers: workerSummaries,
      },
      feedbackGroups,
      attendanceToday: {
        checkedIn: checkedInToday,
        late: lateToday,
        absent: absentToday,
        total: workers.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/shifts/edit', async (req, res, next) => {
  try {
    const parsed = adminEditShiftSchema.parse(req.body);
    const store = getStore();
    const worker = await store.getWorker(parsed.workerId);
    if (!worker) {
      throw new AppError(404, 'WORKER_NOT_FOUND', 'Worker not found.');
    }

    const chain = await store.getWorkerChain(parsed.workerId);
    const targetEvent = chain.find((e) => e.id === parsed.targetEventId);
    if (!targetEvent || (targetEvent.type !== 'CHECK_IN' && targetEvent.type !== 'CHECK_OUT')) {
      throw new AppError(404, 'EVENT_NOT_FOUND', 'Target check-in/out event not found.');
    }

    const shifts = latestView(chain);
    const targetPayload = targetEvent.payload as LedgerCheckOutPayload;
    const shiftRecord = shifts.find((s) => s.date === targetPayload.date);
    const oldValue =
      targetEvent.type === 'CHECK_OUT'
        ? (shiftRecord?.checkOutTime ?? targetPayload.timestamp)
        : (shiftRecord?.checkInTime ?? targetPayload.timestamp);

    const editEventId = `ev-${parsed.workerId}-edit-${Date.now()}`;
    const updatedChain = append(chain, {
      id: editEventId,
      workerId: parsed.workerId,
      type: 'EDIT',
      createdAt: new Date().toISOString(),
      payload: {
        targetEventId: parsed.targetEventId,
        field: 'timestamp',
        oldValue,
        newValue: parsed.newTimestamp,
        reason: parsed.reason,
        editorId: 'admin-supervisor',
        editorName: parsed.editorName,
      },
    });

    await store.saveWorkerChain(parsed.workerId, updatedChain);

    const notification: WorkerNotification = {
      id: `notif-${parsed.workerId}-${Date.now()}`,
      workerId: parsed.workerId,
      workplaceId: worker.workplaceId,
      type: 'SHIFT_EDITED',
      date: targetPayload.date,
      oldValue,
      newValue: parsed.newTimestamp,
      supervisorName: parsed.editorName,
      reason: parsed.reason,
      editEventId,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    await store.saveNotification(notification);

    res.status(201).json({
      editEvent: updatedChain[updatedChain.length - 1],
      notification,
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/disputes/resolve', async (req, res, next) => {
  try {
    const parsed = adminResolveDisputeSchema.parse(req.body);
    const store = getStore();
    const allClaims = await store.getClaims();
    const claim = allClaims.find((c) => c.id === parsed.claimId);
    if (!claim) {
      throw new AppError(404, 'CLAIM_NOT_FOUND', 'Dispute or claim not found.');
    }

    claim.resolutionStatus = parsed.decision;
    claim.resolutionReason = parsed.reason;
    claim.resolvedBy = parsed.resolvedBy;
    claim.resolvedAt = new Date().toISOString();
    if (parsed.decision === 'approved' && claim.supportedHours === 0) {
      claim.supportedHours = claim.extraHours;
    }

    await store.saveClaim(claim);
    res.json({ claim });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/hazards/status', async (req, res, next) => {
  try {
    const parsed = adminUpdateHazardSchema.parse(req.body);
    const store = getStore();
    const allHazards = await store.getHazards();
    const hazard = allHazards.find((h) => h.id === parsed.hazardId);
    if (!hazard) {
      throw new AppError(404, 'HAZARD_NOT_FOUND', 'Hazard report not found.');
    }

    const nowIso = new Date().toISOString();
    hazard.status = parsed.status;
    if (parsed.status === 'acknowledged' && !hazard.acknowledgedAt) {
      hazard.acknowledgedAt = nowIso;
    }
    if (parsed.status === 'resolved') {
      if (!hazard.acknowledgedAt) hazard.acknowledgedAt = nowIso;
      hazard.resolvedAt = nowIso;
    }

    await store.saveHazard(hazard);
    res.json({ hazard });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/qr-svg', async (req, res, next) => {
  try {
    const code = String(req.query.code || 'SHIFTSEAL').slice(0, 120);
    const svg = await QRCode.toString(code, {
      type: 'svg',
      margin: 1,
      width: 148,
      color: {
        dark: '#1b1b1f',
        light: '#ffffff',
      },
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    next(err);
  }
});
