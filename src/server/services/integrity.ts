import type { IntegrityVerdict } from '../../shared/model.js';

/**
 * Google Play Integrity. The Android app attaches a token to each check; the
 * server asks Google to decode it. Until the Play Console app is linked to
 * the Cloud project, and for the web app, the verdict is `unavailable`,
 * which lowers trust but never blocks a check.
 */
export async function verifyIntegrity(
  token: string | undefined,
  _platform: 'android' | 'web'
): Promise<IntegrityVerdict> {
  if (!token) return 'unavailable';
  return 'unavailable';
}
