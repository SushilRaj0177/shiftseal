import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';

describe('HTTP security hardening', () => {
  const app = createApp();

  it('sends a strict Content-Security-Policy and hides the framework', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('restricts powerful browser features to this origin', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['permissions-policy']).toContain('microphone=(self)');
    expect(res.headers['permissions-policy']).toContain('geolocation=(self)');
  });

  it('returns a generic 400 for invalid input without leaking internals', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', 'Bearer dev:sec-user')
      .send({ language: 'xx' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body)).not.toMatch(/at \w+ \(|node_modules/);
  });

  it('rejects malformed JSON bodies with a client error, not a crash', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', 'Bearer dev:sec-user')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('rejects oversized text input', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', 'Bearer dev:sec-user')
      .send({ name: 'a'.repeat(5000) });
    expect(res.status).toBe(400);
  });

  it('requires sign-in for account and workplace routes', async () => {
    expect((await request(app).get('/api/me')).status).toBe(401);
    expect((await request(app).get('/api/workplaces/wp_x/me')).status).toBe(401);
    const bad = await request(app).get('/api/me').set('Authorization', 'Bearer not-a-token');
    expect(bad.status).toBe(401);
  });
});

describe('body size limits', () => {
  it('rejects request bodies above the configured limit with 413', async () => {
    const app = createApp();
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', 'Bearer dev:sec-user')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'A'.repeat(5 * 1024 * 1024) }));
    expect(res.status).toBe(413);
    expect(res.body.error).toBe('PAYLOAD_TOO_LARGE');
  });
});
