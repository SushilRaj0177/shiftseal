import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { MemoryStore } from '../../src/server/store/memory.js';
import { setStoreForTests } from '../../src/server/store/firestore.js';
import { setGeminiGeneratorForTests } from '../../src/server/gemini/client.js';

describe('API Routes — Worker, AI (with mocked Gemini & fallback), and Admin security/privacy', () => {
  let memStore: MemoryStore;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
    memStore = new MemoryStore();
    setStoreForTests(memStore);
    setGeminiGeneratorForTests(null);
  });

  afterEach(() => {
    setGeminiGeneratorForTests(null);
    vi.restoreAllMocks();
  });

  it('rejects admin routes when called with worker or missing credentials', async () => {
    const app = createApp();
    const resNoHeader = await request(app).get('/api/admin/dashboard/wp-tower-b');
    expect(resNoHeader.status).toBe(403);

    const resWorkerHeader = await request(app)
      .get('/api/admin/dashboard/wp-tower-b')
      .set('x-shiftseal-role', 'worker');
    expect(resWorkerHeader.status).toBe(403);

    const resEditRejected = await request(app)
      .post('/api/admin/shifts/edit')
      .set('x-shiftseal-role', 'worker')
      .send({
        workerId: 'w-murugan',
        targetEventId: 'ev-1',
        newTimestamp: '18:00',
        reason: 'Attempted unauthorized edit',
      });
    expect(resEditRejected.status).toBe(403);
  });

  it('allows admin routes when x-shiftseal-role: admin is set', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/admin/dashboard/wp-tower-b')
      .set('x-shiftseal-role', 'admin');
    expect(res.status).toBe(200);
    expect(res.body.workplace.id).toBe('wp-tower-b');
    expect(res.body.hotspots.length).toBeGreaterThan(0);
  });

  it('POST /api/ai/claim with mocked Gemini returns structured claim and ledger match result (isDemoFallback: false)', async () => {
    setGeminiGeneratorForTests(async () => ({
      date: '2026-10-24',
      extraHours: 2,
      reason: 'Saturday slab concrete pouring',
      detectedLanguage: 'ta',
      confidence: 0.98,
    }));

    const app = createApp();
    const res = await request(app).post('/api/ai/claim').send({
      workerId: 'w-murugan',
      lang: 'ta',
      text: 'நேத்து சனிக்கிழமை ஸ்லாப் போடறதுக்கு ரெண்டு மணி நேரம் கூடுதலா இருந்தேன்',
    });

    expect(res.status).toBe(200);
    expect(res.body.structuredClaim.isDemoFallback).toBe(false);
    expect(res.body.structuredClaim.date).toBe('2026-10-24');
    expect(res.body.structuredClaim.extraHours).toBe(2);
    expect(res.body.matchResult.status).toBe('supported');
    expect(res.body.matchResult.supportedHours).toBe(2);
  });

  it('POST /api/ai/explain-pay passes factcheck when mocked Gemini cites accurate payFacts', async () => {
    const app = createApp();
    const overview = await request(app).get('/api/worker/w-murugan/overview');
    const netPay = overview.body.payslip.netPay;
    const normalHours = overview.body.payslip.normalHours;

    setGeminiGeneratorForTests(async () => ({
      answer: `Your net pay is ₹${netPay} for ${normalHours} normal hours.`,
      citedFacts: [
        { ref: 'netPay', value: netPay },
        { ref: 'normalHours', value: normalHours },
      ],
    }));

    const res = await request(app).post('/api/ai/explain-pay').send({
      workerId: 'w-murugan',
      lang: 'en',
      question: 'Why is my pay this amount?',
    });

    expect(res.status).toBe(200);
    expect(res.body.verificationStatus).toBe('checked');
    expect(res.body.isDemoFallback).toBe(false);
    expect(res.body.answer).toContain(String(netPay));
  });

  it('POST /api/ai/explain-pay falls back to template_fallback when Gemini hallucinates a wrong number', async () => {
    setGeminiGeneratorForTests(async () => ({
      answer: 'Your net pay is ₹99999 this week.',
      citedFacts: [{ ref: 'netPay', value: 99999 }],
    }));

    const app = createApp();
    const res = await request(app).post('/api/ai/explain-pay').send({
      workerId: 'w-murugan',
      lang: 'en',
      question: 'Why is my pay this amount?',
    });

    expect(res.status).toBe(200);
    expect(res.body.verificationStatus).toBe('template_fallback');
    expect(res.body.isDemoFallback).toBe(false);
    expect(res.body.answer).not.toContain('99999');
  });

  it('POST /api/ai/explain-pay returns template_fallback and isDemoFallback: true when Gemini throws', async () => {
    setGeminiGeneratorForTests(async () => {
      throw new Error('VERTEX_UNAVAILABLE');
    });

    const app = createApp();
    const res = await request(app).post('/api/ai/explain-pay').send({
      workerId: 'w-murugan',
      lang: 'ta',
      question: 'என் சம்பள கணக்கு என்ன?',
    });

    expect(res.status).toBe(200);
    expect(res.body.verificationStatus).toBe('template_fallback');
    expect(res.body.isDemoFallback).toBe(true);
  });

  it('feedback route never stores or logs the original identifying text (verified via store and console spies)', async () => {
    const saveFeedbackSpy = vi.spyOn(memStore, 'saveFeedback');
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const secretRawText =
      'Supervisor Ravi badge #99412 shouted at Murugan near Gate 2 at 7:15 PM on Tuesday.';

    setGeminiGeneratorForTests(async () => ({
      cleanText: 'A supervisor spoke harshly when asked about overtime.',
      cleanTextEnglish: 'A supervisor spoke harshly when asked about overtime.',
      removed: ['name', 'place', 'time'],
      themes: ['supervisor_conduct', 'overtime_pay'],
      sentiment: -0.8,
    }));

    const app = createApp();
    const previewRes = await request(app).post('/api/ai/feedback-preview').send({
      workplaceId: 'wp-campus',
      team: 'Campus Security & Operations',
      lang: 'en',
      text: secretRawText,
    });

    expect(previewRes.status).toBe(200);
    expect(saveFeedbackSpy).not.toHaveBeenCalled();

    const submitRes = await request(app).post('/api/worker/feedback').send({
      workplaceId: 'wp-campus',
      team: 'Campus Security & Operations',
      cleanText: previewRes.body.preview.cleanText,
      cleanTextEnglish: previewRes.body.preview.cleanTextEnglish,
      removed: previewRes.body.preview.removed,
      themes: previewRes.body.preview.themes,
      sentiment: previewRes.body.preview.sentiment,
    });

    expect(submitRes.status).toBe(201);
    expect(saveFeedbackSpy).toHaveBeenCalledTimes(1);

    const savedArg = JSON.stringify(saveFeedbackSpy.mock.calls[0][0]);
    expect(savedArg).not.toContain('99412');
    expect(savedArg).not.toContain('Ravi');

    const allLogs = [
      ...consoleLogSpy.mock.calls.flat(),
      ...consoleErrorSpy.mock.calls.flat(),
      ...consoleWarnSpy.mock.calls.flat(),
    ].join(' ');
    expect(allLogs).not.toContain('99412');
    expect(allLogs).not.toContain(secretRawText);
  });

  it('POST /api/ai/hazard enforces severity floor even when mocked AI grades electrical as low', async () => {
    setGeminiGeneratorForTests(async () => ({
      hazardType: 'electrical',
      description: 'Loose wire near corridor',
      aiSeverity: 'low',
      englishSummary: 'Loose wire near corridor',
      detectedLanguage: 'en',
    }));

    const app = createApp();
    const res = await request(app).post('/api/ai/hazard').send({
      workplaceId: 'wp-campus',
      zoneId: 'z-hostel-a',
      lang: 'en',
      text: 'Loose wire near corridor',
    });

    expect(res.status).toBe(200);
    expect(res.body.severityEvaluation.aiSeverity).toBe('low');
    expect(res.body.severityEvaluation.finalSeverity).toBe('high');
    expect(res.body.severityEvaluation.floorApplied).toBe(true);
  });

  it('POST /api/ai/hazard demo fallback uses worker own text trimmed without inventing canned summary', async () => {
    setGeminiGeneratorForTests(async () => {
      throw new Error('NO_CREDENTIALS');
    });

    const app = createApp();
    const res = await request(app).post('/api/ai/hazard').send({
      workplaceId: 'wp-tower-b',
      zoneId: 'z-scaffold-b',
      lang: 'en',
      text: '   Cracked wooden plank on Scaffold B level 2   ',
    });

    expect(res.status).toBe(200);
    expect(res.body.structuredHazard.isDemoFallback).toBe(true);
    expect(res.body.structuredHazard.englishSummary).toBe(
      'Cracked wooden plank on Scaffold B level 2'
    );
    expect(res.body.severityEvaluation.finalSeverity).toBe('high');
  });

  it('supports worker check-in/out, notification disagree -> dispute creation, and admin dispute resolution', async () => {
    const app = createApp();

    // Worker check-in
    const checkInRes = await request(app).post('/api/worker/check-in-out').send({
      workerId: 'w-murugan',
      action: 'CHECK_IN',
      zoneCode: 'TB-GATE',
    });
    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.verification.ok).toBe(true);

    // Worker disagrees with supervisor edit notification
    const disagreeRes = await request(app).post('/api/worker/notifications/respond').send({
      workerId: 'w-murugan',
      notificationId: 'notif-murugan-edit-1',
      response: 'disagree',
    });
    expect(disagreeRes.status).toBe(200);
    expect(disagreeRes.body.dispute).toBeDefined();

    // Admin resolves the created dispute
    const resolveRes = await request(app)
      .post('/api/admin/disputes/resolve')
      .set('x-shiftseal-role', 'admin')
      .send({
        claimId: disagreeRes.body.dispute.id,
        decision: 'approved',
        reason: 'Verified against concrete mixer log',
      });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.claim.resolutionStatus).toBe('approved');
  });

  it('serves zone QR SVG on GET /api/admin/qr-svg', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/admin/qr-svg?code=TB-SCAF-B')
      .set('x-shiftseal-role', 'admin');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/svg+xml');
  });
});
