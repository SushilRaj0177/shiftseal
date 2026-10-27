import type { Ruleset, SectorId, RuleDefinition } from '../types.js';
import constructionRaw from './rulesets/construction.json' with { type: 'json' };
import campusRaw from './rulesets/campus.json' with { type: 'json' };

const rulesets: Record<SectorId, Ruleset> = {
  construction: constructionRaw as Ruleset,
  campus: campusRaw as Ruleset,
};

export function getRuleset(sector: SectorId): Ruleset {
  return rulesets[sector] ?? rulesets.construction;
}

export function getRule(sector: SectorId, ruleId: string): RuleDefinition {
  const rs = getRuleset(sector);
  const found = rs.rules[ruleId];
  if (!found) {
    throw new Error(`Rule ${ruleId} not found in sector ${sector}`);
  }
  return found;
}
