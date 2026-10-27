import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';

describe('GET /api/health', () => {
  it('returns status ok and service metadata', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('shiftseal');
  });
});
