import type { LocationFix } from '../../shared/model.js';
import { callNative, isAndroidApp } from './native.js';

export type LocationResult =
  { ok: true; fix: LocationFix } | { ok: false; reason: 'denied' | 'unavailable' | 'timeout' };

interface NativeFix {
  ok: boolean;
  reason?: 'denied' | 'unavailable' | 'timeout';
  lat?: number;
  lng?: number;
  accuracyM?: number;
  at?: string;
  mocked?: boolean;
}

/** One precise location reading, taken only when the person checks in or reports. */
export async function getFix(timeoutMs = 15_000): Promise<LocationResult> {
  // In the Android app, the phone's own GPS reading also says whether a mock-location app made it.
  if (isAndroidApp()) {
    const n = await callNative<NativeFix>('getFix', { timeoutMs }, timeoutMs + 2_000);
    if (n?.ok && n.lat !== undefined && n.lng !== undefined) {
      return {
        ok: true,
        fix: {
          lat: n.lat,
          lng: n.lng,
          accuracyM: Math.round(n.accuracyM ?? 0),
          at: n.at ?? new Date().toISOString(),
          mocked: Boolean(n.mocked),
        },
      };
    }
    return { ok: false, reason: n?.reason ?? 'timeout' };
  }
  return browserFix(timeoutMs);
}

function browserFix(timeoutMs: number): Promise<LocationResult> {
  if (!('geolocation' in navigator)) return Promise.resolve({ ok: false, reason: 'unavailable' });
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          fix: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: Math.round(pos.coords.accuracy),
            at: new Date(pos.timestamp).toISOString(),
          },
        }),
      (err) =>
        resolve({
          ok: false,
          reason:
            err.code === err.PERMISSION_DENIED
              ? 'denied'
              : err.code === err.TIMEOUT
                ? 'timeout'
                : 'unavailable',
        }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}
