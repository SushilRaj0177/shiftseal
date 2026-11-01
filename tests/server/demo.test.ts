import { createHash } from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { parseConfig, resetConfig } from '../../src/server/config.js';
import { findDemoLink, parseDemoLinks } from '../../src/server/routes/demo.js';

/** Private demo links: only the exact token signs its one account in. */

const token = 'k3Jx9QvT2mWbL8pZr4YdN6cHs0aEuF1g';
const hash = createHash('sha256').update(token).digest('hex');

describe('demo links', () => {
  const before = process.env.DEMO_LINKS;
  beforeAll(() => {
    process.env.DEMO_LINKS = `${hash}:demo-owner,${'0'.repeat(64)}:demo-w2:ta`;
    resetConfig();
  });
  afterAll(() => {
    if (before === undefined) delete process.env.DEMO_LINKS;
    else process.env.DEMO_LINKS = before;
    resetConfig();
  });

  it('matches only the exact token', () => {
    const links = parseDemoLinks(process.env.DEMO_LINKS);
    expect(findDemoLink(token, links)?.uid).toBe('demo-owner');
    expect(findDemoLink(token.slice(0, -1) + 'h', links)).toBeUndefined();
  });

  it('rejects a malformed DEMO_LINKS setting', () => {
    expect(() => parseConfig({ DEMO_LINKS: 'owner1' })).toThrow(/DEMO_LINKS/);
  });

  it('signs the linked account in, and answers anything else with the same 404', async () => {
    const app = createApp();
    const ok = await request(app).post('/api/demo/session').send({ token });
    expect(ok.status).toBe(200);
    expect(ok.body.devUid).toBe('demo-owner');
    expect(ok.headers['cache-control']).toBe('no-store');
    for (const body of [{ token: 'x'.repeat(32) }, { token: 'short' }, {}]) {
      const bad = await request(app).post('/api/demo/session').send(body);
      expect(bad.status).toBe(404);
    }
  });
});
