import { GoogleAuth } from 'google-auth-library';
import type { IntegrityVerdict } from '../../shared/model.js';
import { getConfig } from '../config.js';

const MAX_AGE_MS = 5 * 60_000;

let auth: GoogleAuth | null = null;

/** Fields of Google's decoded verdict that decide trust. */
export interface IntegrityPayload {
  requestDetails?: { requestPackageName?: string; nonce?: string; timestampMillis?: string };
  appIntegrity?: { appRecognitionVerdict?: string; packageName?: string };
  deviceIntegrity?: { deviceRecognitionVerdict?: string[] };
}

/**
 * Whether a decoded verdict says this is our app, from Play, on a genuine
 * device, answering this very check (same nonce, recent).
 */
export function judgeIntegrity(
  p: IntegrityPayload,
  pkg: string,
  nonce: string,
  now = Date.now()
): IntegrityVerdict {
  const at = Number(p.requestDetails?.timestampMillis ?? 0);
  const ok =
    p.requestDetails?.requestPackageName === pkg &&
    p.requestDetails?.nonce === nonce &&
    Math.abs(now - at) <= MAX_AGE_MS &&
    p.appIntegrity?.appRecognitionVerdict === 'PLAY_RECOGNIZED' &&
    p.appIntegrity?.packageName === pkg &&
    (p.deviceIntegrity?.deviceRecognitionVerdict ?? []).includes('MEETS_DEVICE_INTEGRITY');
  return ok ? 'passed' : 'failed';
}

/**
 * Google Play Integrity. The Android app attaches a token bound to the
 * check's nonce; Google decodes it with this service's own credentials (no
 * keys). For the web app, before the Play Console is linked, or if Google
 * cannot be reached, the verdict is `unavailable`: trust is lower, but a
 * check is never blocked for it.
 */
export async function verifyIntegrity(
  token: string | undefined,
  platform: 'android' | 'web',
  nonce: string
): Promise<IntegrityVerdict> {
  // Play Integrity is checked only once the Android package is configured.
  const PACKAGE = getConfig().ANDROID_PACKAGE;
  if (!token || platform !== 'android' || !PACKAGE) return 'unavailable';
  try {
    auth ??= new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/playintegrity'] });
    const client = await auth.getClient();
    const res = await client.request<{ tokenPayloadExternal?: IntegrityPayload }>({
      url: `https://playintegrity.googleapis.com/v1/${PACKAGE}:decodeIntegrityToken`,
      method: 'POST',
      data: { integrity_token: token },
      timeout: 5_000,
    });
    const payload = res.data.tokenPayloadExternal;
    return payload ? judgeIntegrity(payload, PACKAGE, nonce) : 'failed';
  } catch {
    return 'unavailable';
  }
}
