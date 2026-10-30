import { describe, it, expect } from 'vitest';
import {
  checkToken,
  printedToken,
  rotatingToken,
  WINDOW_SECONDS,
} from '../../src/server/qr/tokens.js';

const secret = Buffer.from('test-secret-test-secret-test-secret');
const t0 = Date.parse('2026-10-27T03:00:05Z');

describe('site QR codes', () => {
  it('accepts a fresh rotating code for the right workplace', () => {
    const { token, expiresInS } = rotatingToken(secret, 'wp_a', 'GATE', t0);
    expect(expiresInS).toBeGreaterThan(0);
    expect(expiresInS).toBeLessThanOrEqual(WINDOW_SECONDS);
    expect(checkToken(secret, token, 'wp_a', t0)).toEqual({
      kind: 'rotating',
      valid: true,
      zoneCode: 'GATE',
    });
    // Still valid shortly after it rotates, to allow for scan-to-send delay.
    expect(checkToken(secret, token, 'wp_a', t0 + 60_000).valid).toBe(true);
  });

  it('rejects old, foreign, forged and future codes', () => {
    const { token } = rotatingToken(secret, 'wp_a', 'GATE', t0);
    expect(checkToken(secret, token, 'wp_a', t0 + 5 * 60_000).valid).toBe(false);
    expect(checkToken(secret, token, 'wp_b', t0).valid).toBe(false);
    expect(checkToken(Buffer.from('other'), token, 'wp_a', t0).valid).toBe(false);
    expect(checkToken(secret, token.replace('GATE', 'CRANE'), 'wp_a', t0).valid).toBe(false);
    const future = rotatingToken(secret, 'wp_a', 'GATE', t0 + 10 * 60_000).token;
    expect(checkToken(secret, future, 'wp_a', t0).valid).toBe(false);
  });

  it('accepts printed codes for the right workplace and treats missing codes as none', () => {
    const token = printedToken(secret, 'wp_a', 'GATE');
    expect(checkToken(secret, token, 'wp_a', t0)).toEqual({
      kind: 'printed',
      valid: true,
      zoneCode: 'GATE',
    });
    expect(checkToken(secret, token, 'wp_b', t0).valid).toBe(false);
    expect(checkToken(secret, undefined, 'wp_a', t0)).toEqual({ kind: 'none', valid: false });
    expect(checkToken(secret, 'hello', 'wp_a', t0).kind).toBe('none');
    expect(checkToken(secret, 'ss1.x.wp_a.GATE.sig', 'wp_a', t0).kind).toBe('none');
  });
});
