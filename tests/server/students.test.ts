import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { resetRepo } from '../../src/server/data/index.js';

/** A student's profile travels with them: set it, read it back, clear it when they graduate. */

const app = createApp();
const me = 'Bearer dev:yuki1:+819000000001';

beforeAll(() => resetRepo());

describe('student profile', () => {
  it('saves studies, a school break and a birth date', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', me)
      .send({ student: 'international', breakUntil: '2026-08-31', birthDate: '2005-04-02' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      student: 'international',
      breakUntil: '2026-08-31',
      birthDate: '2005-04-02',
    });
  });

  it('clears fields sent as null', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', me)
      .send({ student: null, breakUntil: null });
    expect(res.body.user.student).toBeUndefined();
    expect(res.body.user.breakUntil).toBeUndefined();
    expect(res.body.user.birthDate).toBe('2005-04-02');
  });

  it('rejects a malformed date', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', me)
      .send({ birthDate: '2 April 2005' });
    expect(res.status).toBe(400);
  });
});
