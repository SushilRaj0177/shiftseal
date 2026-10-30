import type { Request, Response } from 'express';
import { getConfig } from '../config.js';

/**
 * Digital Asset Links: tells Android that the Shiftseal app may open this
 * site's check-in links, so scanning the gate QR with the phone camera opens
 * the app (with its mock-location and Play Integrity checks) rather than the
 * browser. Empty until the app's package and signing certificate are set.
 */
export function assetLinks(_req: Request, res: Response): void {
  const { ANDROID_PACKAGE, ANDROID_CERT_SHA256 } = getConfig();
  const fingerprints = (ANDROID_CERT_SHA256 ?? '')
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(
    ANDROID_PACKAGE && fingerprints.length
      ? [
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
              namespace: 'android_app',
              package_name: ANDROID_PACKAGE,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]
      : []
  );
}
