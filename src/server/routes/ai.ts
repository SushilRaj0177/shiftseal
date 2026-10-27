import { Router } from 'express';
import { getStore } from '../store/firestore.js';
import { aiRateLimiter } from '../middleware/security.js';
import { AppError } from '../middleware/errors.js';
import {
  aiClaimRequestSchema,
  aiExplainPayRequestSchema,
  aiHazardRequestSchema,
  aiFeedbackPreviewRequestSchema,
} from '../../shared/schemas.js';
import { latestView } from '../../shared/ledger/ledger.js';
import { calculateWeekHours } from '../../shared/rules/hours.js';
import { calculatePayslip } from '../../shared/rules/pay.js';
import { matchClaimAgainstLedger } from '../../shared/rules/claims.js';
import { evaluateSeverityFloor } from '../../shared/rules/severity.js';
import {
  structureClaim,
  explainPay,
  structureHazard,
  anonymiseFeedback,
} from '../gemini/client.js';

export const aiRouter = Router();

aiRouter.use(aiRateLimiter);

aiRouter.post('/claim', async (req, res, next) => {
  try {
    const parsed = aiClaimRequestSchema.parse(req.body);
    const store = getStore();
    const worker = await store.getWorker(parsed.workerId);
    if (!worker) {
      throw new AppError(404, 'WORKER_NOT_FOUND', 'Worker not found.');
    }

    const structured = await structureClaim(
      {
        text: parsed.text,
        audioBase64: parsed.audioBase64,
        audioMimeType: parsed.audioMimeType,
      },
      parsed.lang
    );

    const chain = await store.getWorkerChain(parsed.workerId);
    const shifts = latestView(chain);
    const match = matchClaimAgainstLedger(
      {
        date: structured.date,
        extraHours: structured.extraHours,
        reason: structured.reason,
      },
      shifts,
      worker.sector
    );

    res.json({
      structuredClaim: structured,
      matchResult: match,
    });
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/explain-pay', async (req, res, next) => {
  try {
    const parsed = aiExplainPayRequestSchema.parse(req.body);
    const store = getStore();
    const worker = await store.getWorker(parsed.workerId);
    if (!worker) {
      throw new AppError(404, 'WORKER_NOT_FOUND', 'Worker not found.');
    }

    const chain = await store.getWorkerChain(parsed.workerId);
    const shifts = latestView(chain);
    const hoursResult = calculateWeekHours(shifts, worker.sector);
    const claims = await store.getWorkerClaims(parsed.workerId);
    const approvedClaimHours = claims
      .filter((c) => c.matchStatus === 'supported' || c.resolutionStatus === 'approved')
      .reduce((acc, c) => acc + (c.supportedHours > 0 ? c.supportedHours : c.extraHours), 0);
    const deductions = await store.getWorkerDeductions(parsed.workerId);

    const payslip = calculatePayslip({
      workerId: worker.id,
      weekLabel: '19 Oct – 27 Oct 2026',
      sector: worker.sector,
      hourlyRate: worker.hourlyRate,
      dailyWage: worker.dailyWage,
      hoursResult,
      approvedClaimHours,
      deductions,
    });

    const result = await explainPay(
      {
        question: parsed.question,
        audioBase64: parsed.audioBase64,
        audioMimeType: parsed.audioMimeType,
      },
      payslip,
      parsed.lang
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/hazard', async (req, res, next) => {
  try {
    const parsed = aiHazardRequestSchema.parse(req.body);
    const store = getStore();
    const workplace = await store.getWorkplace(parsed.workplaceId);
    if (!workplace) {
      throw new AppError(404, 'WORKPLACE_NOT_FOUND', 'Workplace not found.');
    }

    const zone =
      workplace.zones.find((z) => z.id === parsed.zoneId || z.code === parsed.zoneId) ??
      workplace.zones[0];

    const structured = await structureHazard(
      {
        text: parsed.text,
        audioBase64: parsed.audioBase64,
        audioMimeType: parsed.audioMimeType,
      },
      workplace.sector,
      zone.name,
      parsed.lang
    );

    const severityEval = evaluateSeverityFloor(
      workplace.sector,
      structured.hazardType,
      structured.aiSeverity
    );

    res.json({
      structuredHazard: structured,
      severityEvaluation: severityEval,
    });
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/feedback-preview', async (req, res, next) => {
  try {
    // Strictly never log or persist req.body.text or req.body.audioBase64
    const parsed = aiFeedbackPreviewRequestSchema.parse(req.body);
    const preview = await anonymiseFeedback(
      {
        text: parsed.text,
        audioBase64: parsed.audioBase64,
        audioMimeType: parsed.audioMimeType,
      },
      parsed.lang
    );

    res.json({
      preview,
      privacyNote: 'Your voice and original words are not stored.',
    });
  } catch (err) {
    next(err);
  }
});
