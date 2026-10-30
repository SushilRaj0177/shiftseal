import type { Ruleset, SectorId, RuleDefinition } from '../types.js';
import constructionRaw from './rulesets/construction.json' with { type: 'json' };
import campusRaw from './rulesets/campus.json' with { type: 'json' };
import officeRaw from './rulesets/office.json' with { type: 'json' };
import commonRaw from './rulesets/common.json' with { type: 'json' };

const rulesets: Record<SectorId, Ruleset> = {
  construction: constructionRaw as Ruleset,
  campus: campusRaw as Ruleset,
  office: officeRaw as Ruleset,
};

/** Rules that apply to every sector: pay deadlines, leave defaults, wellbeing, POSH. */
const common = (commonRaw as { rules: Ruleset['rules'] }).rules;

export function getRuleset(sector: SectorId): Ruleset {
  return rulesets[sector] ?? rulesets.construction;
}

export function getRule(sector: SectorId, ruleId: string): RuleDefinition {
  const found = getRuleset(sector).rules[ruleId] ?? common[ruleId];
  if (!found) {
    throw new Error(`Rule ${ruleId} not found in sector ${sector}`);
  }
  return found;
}
