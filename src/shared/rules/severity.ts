import type { SectorId, SeverityLevel, HazardType, RuleDefinition } from '../types.js';
import { getRule } from './index.js';

const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const RANK_TO_SEVERITY: Record<number, SeverityLevel> = {
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'critical',
};

const CONSTRUCTION_HIGH_FLOOR: Set<string> = new Set([
  'electrical',
  'fall_from_height',
  'scaffold',
  'structural_collapse',
  'crane_lifting',
  'fire',
]);

const CAMPUS_HIGH_FLOOR: Set<string> = new Set([
  'electrical',
  'fire',
  'gas_leak',
  'chemical_lab',
  'fall_from_height',
  'violence_weapon',
]);

export interface SeverityEvaluation {
  aiSeverity: SeverityLevel;
  floorSeverity: SeverityLevel;
  finalSeverity: SeverityLevel;
  floorApplied: boolean;
  deadlineHours: number;
  ruleRef: RuleDefinition;
}

export const DEADLINE_HOURS_BY_SEVERITY: Record<SeverityLevel, number> = {
  critical: 2,
  high: 24,
  medium: 72,
  low: 168,
};

export function evaluateSeverityFloor(
  sector: SectorId,
  hazardType: HazardType,
  aiSeverity: SeverityLevel
): SeverityEvaluation {
  const floorRule = getRule({ sector }, 'hazard.floorHigh');
  const highSet = sector === 'construction' ? CONSTRUCTION_HIGH_FLOOR : CAMPUS_HIGH_FLOOR;

  const floorSeverity: SeverityLevel = highSet.has(hazardType) ? 'high' : 'low';
  const aiRank = SEVERITY_ORDER[aiSeverity];
  const floorRank = SEVERITY_ORDER[floorSeverity];

  const finalRank = Math.max(aiRank, floorRank);
  const finalSeverity = RANK_TO_SEVERITY[finalRank];
  const floorApplied = finalRank > aiRank;

  return {
    aiSeverity,
    floorSeverity,
    finalSeverity,
    floorApplied,
    deadlineHours: DEADLINE_HOURS_BY_SEVERITY[finalSeverity],
    ruleRef: floorRule,
  };
}
