import { createHmac, timingSafeEqual } from 'node:crypto';
import type { QrKind } from '../../shared/model.js';

/**
 * Site QR codes.
 *
 * Rotating codes are shown on a screen at the gate and change every 30 seconds,
 * so a photo of the code stops working almost immediately. Printed codes are
 * fixed, for sites without a screen; they still prove the right site, and the
 * location check does the rest.
 *
 *   rotating: ss1.r.<workplaceId>.<zone>.<window>.<mac>
 *   printed:  ss1.p.<workplaceId>.<zone>.<mac>
 */

export const WINDOW_SECONDS = 30;
/** How many past windows are still accepted, to allow for scan-to-send delay. */
const GRACE_WINDOWS = 3;

export interface QrCheck {
  kind: QrKind;
  valid: boolean;
  zoneCode?: string;
}

function mac(secret: Buffer, body: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url').slice(0, 22);
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function currentWindow(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000 / WINDOW_SECONDS);
}

export function rotatingToken(
  secret: Buffer,
  workplaceId: string,
  zoneCode: string,
  nowMs: number = Date.now()
): { token: string; expiresInS: number } {
  const w = currentWindow(nowMs);
  const body = `ss1.r.${workplaceId}.${zoneCode}.${w}`;
  const expiresInS = WINDOW_SECONDS - Math.floor((nowMs / 1000) % WINDOW_SECONDS);
  return { token: `${body}.${mac(secret, body)}`, expiresInS };
}

export function printedToken(secret: Buffer, workplaceId: string, zoneCode: string): string {
  const body = `ss1.p.${workplaceId}.${zoneCode}`;
  return `${body}.${mac(secret, body)}`;
}

/** Checks a scanned token against the workplace it was submitted for. */
export function checkToken(
  secret: Buffer,
  token: string | undefined,
  workplaceId: string,
  nowMs: number = Date.now()
): QrCheck {
  if (!token) return { kind: 'none', valid: false };
  const parts = token.split('.');
  if (parts[0] !== 'ss1') return { kind: 'none', valid: false };

  if (parts[1] === 'r' && parts.length === 6) {
    const [, , wp, zone, windowStr, sig] = parts;
    const w = Number(windowStr);
    const now = currentWindow(nowMs);
    const fresh = Number.isInteger(w) && w <= now && now - w <= GRACE_WINDOWS;
    const valid =
      wp === workplaceId &&
      fresh &&
      safeEqual(sig, mac(secret, `ss1.r.${wp}.${zone}.${windowStr}`));
    return { kind: 'rotating', valid, zoneCode: zone };
  }
  if (parts[1] === 'p' && parts.length === 5) {
    const [, , wp, zone, sig] = parts;
    const valid = wp === workplaceId && safeEqual(sig, mac(secret, `ss1.p.${wp}.${zone}`));
    return { kind: 'printed', valid, zoneCode: zone };
  }
  return { kind: 'none', valid: false };
}
