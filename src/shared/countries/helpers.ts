import type { RuleDefinition } from '../types.js';

export function law(
  id: string,
  value: number,
  unit: string,
  source: string,
  note?: string
): RuleDefinition {
  return { id, value, unit, kind: 'law', source, note };
}

export function policy(
  id: string,
  value: number,
  unit: string,
  source: string,
  note?: string
): RuleDefinition {
  return { id, value, unit, kind: 'policy', source, note };
}

export function byId(...rules: RuleDefinition[]): Record<string, RuleDefinition> {
  return Object.fromEntries(rules.map((r) => [r.id, r]));
}

/** Whole months and years of service between two YYYY-MM-DD dates. */
export function serviceLength(from: string, to: string): { months: number; years: number } {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  let months = (ty - fy) * 12 + (tm - fm);
  if (td < fd) months -= 1;
  months = Math.max(0, months);
  return { months, years: Math.floor(months / 12) };
}
