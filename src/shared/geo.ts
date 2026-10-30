import type { GeoPoint, Geofence, LocationFix } from './model.js';

const EARTH_RADIUS_M = 6_371_008.8;

/** Great-circle distance in metres (haversine). */
export function distanceM(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Fixes less precise than this cannot place someone on a typical site. */
export const MAX_USEFUL_ACCURACY_M = 100;

export type FixVerdict = 'inside' | 'outside' | 'uncertain';

export interface FixEvaluation {
  verdict: FixVerdict;
  distanceM: number;
}

/**
 * Places a location fix relative to a site boundary, taking the fix's own
 * accuracy into account: a fix only counts as outside when even its most
 * favourable reading is beyond the boundary.
 */
export function evaluateFix(fix: LocationFix, fence: Geofence): FixEvaluation {
  const d = distanceM(fix, fence.center);
  const rounded = Math.round(d);
  if (fix.accuracyM > MAX_USEFUL_ACCURACY_M) return { verdict: 'uncertain', distanceM: rounded };
  if (d <= fence.radiusM) return { verdict: 'inside', distanceM: rounded };
  if (d - fix.accuracyM <= fence.radiusM) return { verdict: 'uncertain', distanceM: rounded };
  return { verdict: 'outside', distanceM: rounded };
}

export function isValidPoint(p: GeoPoint): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180
  );
}
