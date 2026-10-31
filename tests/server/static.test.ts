import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';

/** The production image must carry public/ (icons, manifest, service worker, privacy page). */
describe('static files', () => {
  it('copies public/ into the image before the client build', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    const copyPublic = dockerfile.indexOf('COPY public');
    const build = dockerfile.indexOf('RUN npm run build');
    expect(copyPublic).toBeGreaterThan(-1);
    expect(copyPublic).toBeLessThan(build);
  });

  // These run against a built client (dist/client), as in production.
  it.runIf(existsSync('dist/client/index.html'))(
    'serves real files and 404s missing ones',
    async () => {
      const app = createApp();
      const privacy = await request(app).get('/privacy.html');
      expect(privacy.status).toBe(200);
      expect(privacy.text).toContain('Deleting your account');

      const missing = await request(app).get('/brand/no-such-icon.png');
      expect(missing.status).toBe(404);

      const route = await request(app).get('/w/some-workplace/pay');
      expect(route.status).toBe(200);
      expect(route.text).toContain('<div id="root">');
    }
  );
});
