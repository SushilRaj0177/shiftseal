import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Stateless, HMAC-SHA256 signed session tokens (`payload.signature`, base64url).
 * The demo sign-in issues short-lived, workplace-scoped admin sessions; every
 * admin request is verified with a constant-time signature comparison.
 */

export type SessionRole = 'admin';

export interface SessionClaims {
  role: SessionRole;
  workplaceId: string;
  /** Expiry, seconds since epoch. */
  exp: number;
}

const SESSION_TTL_SECONDS = 8 * 60 * 60;

// A per-process random secret is used only when SESSION_SECRET is not configured.
const secret: Buffer = process.env.SESSION_SECRET
  ? Buffer.from(process.env.SESSION_SECRET, 'utf8')
  : randomBytes(32);

function sign(payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(
  role: SessionRole,
  workplaceId: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): string {
  const claims: SessionClaims = { role, workplaceId, exp: nowSeconds + SESSION_TTL_SECONDS };
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): SessionClaims | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const expected = Buffer.from(sign(payload), 'utf8');
  const actual = Buffer.from(signature, 'utf8');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
    if (claims.role !== 'admin' || typeof claims.workplaceId !== 'string') return null;
    if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) return null;
    return claims;
  } catch {
    return null;
  }
}
