import type { LocationFix } from '../../shared/model.js';

export type LocationResult =
  { ok: true; fix: LocationFix } | { ok: false; reason: 'denied' | 'unavailable' | 'timeout' };

/** One precise location reading, taken only when the person checks in or reports. */
export function getFix(timeoutMs = 15_000): Promise<LocationResult> {
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
