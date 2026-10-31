import type { Ruleset, SectorId, RuleDefinition } from '../types.js';
import { countryPack, type Jurisdiction } from '../countries/index.js';
import constructionRaw from './rulesets/construction.json' with { type: 'json' };
import campusRaw from './rulesets/campus.json' with { type: 'json' };
import retailRaw from './rulesets/retail.json' with { type: 'json' };
import officeRaw from './rulesets/office.json' with { type: 'json' };
import commonRaw from './rulesets/common.json' with { type: 'json' };

const rulesets: Record<SectorId, Ruleset> = {
  construction: constructionRaw as Ruleset,
  campus: campusRaw as Ruleset,
  retail: retailRaw as Ruleset,
  office: officeRaw as Ruleset,
};

/** Workplace policies that apply in every sector and country (wellbeing). */
const common = (commonRaw as { rules: Ruleset['rules'] }).rules;

/** What a rule depends on: the sector's policies and the country's (and state's) law. */
export interface RuleContext extends Jurisdiction {
  sector: SectorId;
}

export function getRuleset(sector: SectorId): Ruleset {
  return rulesets[sector] ?? rulesets.construction;
}

/** A rule, looked up in the state, then the country, then the sector's policies, then common policies. */
export function findRule(ctx: RuleContext, ruleId: string): RuleDefinition | undefined {
  return countryPack(ctx).rules[ruleId] ?? getRuleset(ctx.sector).rules[ruleId] ?? common[ruleId];
}

export function getRule(ctx: RuleContext, ruleId: string): RuleDefinition {
  const found = findRule(ctx, ruleId);
  if (!found) {
    throw new Error(`Rule ${ruleId} not found for ${ctx.country ?? 'IN'} ${ctx.sector}`);
  }
  return found;
}
