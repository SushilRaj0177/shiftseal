import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { MemoryStore } from '../../src/server/store/memory.js';
import { setStoreForTests } from '../../src/server/store/firestore.js';

describe('API Routes — Worker, AI (with fallback/mock), and Admin security & privacy', () => {
  let memStore: MemoryStore;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY; // Force deterministic mock/demo fallback for unit tests
    memStore = new MemoryStore();
    setStoreForTests(memStore);
  });

  it('POST /api/ai/claim returns a structured claim and ledger match result for Murugan Saturday slab overtime', async () => {
    const app = createApp();
    const res = await request(app).post('/api/ai/claim').send({
      workerId: 'w-murugan',
      lang: 'ta',
      text: 'நேத்து சனிக்கிழமை ஸ்லாப் போடறதுக்கு ரெண்டு மணி நேரம் கூடுதலா இருந்தேன்',
    });

    expect(res.status).toBe(200);
    expect(res.body.structuredClaim.date).toBe('2026-10-24');
    expect(res.body.structuredClaim.extraHours).toBe(2);
    expect(res.body.matchResult.status).toBe('supported');
    expect(res.body.matchResult.supportedHours).toBe(2);
  });

  it('POST /api/ai/hazard enforces the deterministic high-severity floor on electrical hazards', async () => {
    const app = createApp();
    const res = await request(app).post('/api/ai/hazard').send({
      workplaceId: 'wp-campus',
      zoneId: 'z-hostel-a',
      lang: 'hi',
      text: 'हॉस्टल ब्लॉक A में बिजली का तार खुला लटक रहा है',
    });

    expect(res.status).toBe(200);
    expect(res.body.structuredHazard.hazardType).toBe('electrical');
    expect(res.body.severityEvaluation.finalSeverity).toBe('high');
  });

  it('Admin route rejects requests without x-shiftseal-role: admin header', async () => {
    const app = createApp();
    const res = await request(app).get('/api/admin/dashboard/wp-tower-b');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');

    const okRes = await request(app)
      .get('/api/admin/dashboard/wp-tower-b')
      .set('x-shiftseal-role', 'admin');
    expect(okRes.status).toBe(200);
    expect(okRes.body.workplace.id).toBe('wp-tower-b');
  });

  it('Feedback preview and submission never store the original identifying text in the store', async () => {
    const app = createApp();
    const rawIdentifyingMessage =
      'Supervisor Ravi shouted at me near Gate 2 at 7:15 PM when I asked why my Tuesday overtime hours were reduced.';

    const previewRes = await request(app).post('/api/ai/feedback-preview').send({
      workplaceId: 'wp-campus',
      team: 'Campus Security & Operations',
      lang: 'en',
      text: rawIdentifyingMessage,
    });

    expect(previewRes.status).toBe(200);
    const cleaned = previewRes.body.preview;
    expect(cleaned.cleanText).not.toContain('Ravi');
    expect(cleaned.cleanText).not.toContain('Gate 2');
    expect(cleaned.removed).toContain('name');

    // Verify store was NOT touched by preview
    const beforeFeedback = await memStore.getFeedback('wp-campus');
    expect(beforeFeedback).toHaveLength(3);

    // Submit only the cleaned text
    const submitRes = await request(app).post('/api/worker/feedback').send({
      workplaceId: 'wp-campus',
      team: 'Campus Security & Operations',
      cleanText: cleaned.cleanText,
      cleanTextEnglish: cleaned.cleanTextEnglish,
      removed: cleaned.removed,
      themes: cleaned.themes,
      sentiment: cleaned.sentiment,
    });

    expect(submitRes.status).toBe(201);
    const afterFeedback = await memStore.getFeedback('wp-campus');
    expect(afterFeedback).toHaveLength(4);
    for (const entry of afterFeedback) {
      expect(JSON.stringify(entry)).not.toContain('Supervisor Ravi shouted');
    }
  });

  it('Admin shift edit appends an EDIT event to the ledger and creates a worker notification', async () => {
    const app = createApp();
    const editRes = await request(app)
      .post('/api/admin/shifts/edit')
      .set('x-shiftseal-role', 'admin')
      .send({
        workerId: 'w-murugan',
        targetEventId: 'ev-w-murugan-2026-10-22-out',
        newTimestamp: '17:00',
        reason: 'Adjusted Thursday checkout log',
        editorName: 'Supervisor Ravi',
      });

    expect(editRes.status).toBe(201);
    expect(editRes.body.editEvent.type).toBe('EDIT');
    expect(editRes.body.notification.oldValue).toBe('18:00');
    expect(editRes.body.notification.newValue).toBe('17:00');
  });
});
