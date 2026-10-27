import { describe, it, expect } from 'vitest';
import { createSessionToken, verifySessionToken } from '../../src/server/auth/session.js';

describe('signed admin sessions', () => {
  const now = 1_800_000_000;

  it('verifies a freshly issued token and returns its claims', () => {
    const claims = verifySessionToken(createSessionToken('admin', 'wp-tower-b', now), now + 60);
    expect(claims).toMatchObject({ role: 'admin', workplaceId: 'wp-tower-b' });
  });

  it('rejects a token whose payload was altered', () => {
    const [payload, signature] = createSessionToken('admin', 'wp-tower-b', now).split('.');
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), workplaceId: 'wp-campus' })
    ).toString('base64url');
    expect(verifySessionToken(`${forged}.${signature}`, now)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = createSessionToken('admin', 'wp-tower-b', now);
    expect(verifySessionToken(token, now + 9 * 60 * 60)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifySessionToken('not-a-token')).toBeNull();
    expect(verifySessionToken('a.b.c')).toBeNull();
    expect(verifySessionToken('')).toBeNull();
  });
});
