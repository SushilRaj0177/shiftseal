import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { resetRepo } from '../../src/server/data/index.js';

/** Deleting an account erases the person, keeps the sealed records, and never strands a team. */

const app = createApp();
const owner = 'Bearer dev:boss1:+919800000101';
const worker = 'Bearer dev:mason1:+919800000102';
let wp = '';

beforeAll(async () => {
  resetRepo();
  const created = await request(app)
    .post('/api/workplaces')
    .set('Authorization', owner)
    .send({
      name: 'Delete test site',
      sector: 'construction',
      state: 'Tamil Nadu',
      shiftStart: '08:00',
      shiftEnd: '17:00',
      payDay: 6,
      geofence: { center: { lat: 12.9716, lng: 80.2209 }, radiusM: 150 },
      zones: [{ code: 'GATE', name: 'Gate', kind: 'gate' }],
      ownerName: 'Boss',
    });
  wp = created.body.workplace.id;
  await request(app)
    .post('/api/invites/accept')
    .set('Authorization', worker)
    .send({ code: created.body.workplace.inviteCode, name: 'Mason One', language: 'ta' });
});

describe('account deletion', () => {
  it('will not leave a team without its owner', async () => {
    const res = await request(app).delete('/api/me').set('Authorization', owner);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('OWNER_HAS_PEOPLE');
  });

  it('erases a worker and keeps their sealed records anonymous', async () => {
    const res = await request(app).delete('/api/me').set('Authorization', worker);
    expect(res.status).toBe(200);

    const dash = await request(app)
      .get(`/api/workplaces/${wp}/dashboard`)
      .set('Authorization', owner);
    expect(JSON.stringify(dash.body)).not.toContain('Mason One');
    expect(JSON.stringify(dash.body)).not.toContain('+919800000102');

    const me = await request(app).get('/api/me').set('Authorization', worker);
    expect(me.body.workplaces).toEqual([]);
    expect(me.body.user.name).toBe('');
  });

  it('lets the owner go once nobody else is left', async () => {
    const res = await request(app).delete('/api/me').set('Authorization', owner);
    expect(res.status).toBe(200);
  });
});
