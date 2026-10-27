import { describe, it, expect } from 'vitest';
import { evaluateSeverityFloor } from '../../src/shared/rules/severity.js';

describe('severity.ts', () => {
  it('enforces high floor on construction electrical, fall_from_height, scaffold, structural_collapse, crane_lifting, and fire', () => {
    for (const type of [
      'electrical',
      'fall_from_height',
      'scaffold',
      'structural_collapse',
      'crane_lifting',
      'fire',
    ] as const) {
      const res = evaluateSeverityFloor('construction', type, 'low');
      expect(res.finalSeverity).toBe('high');
      expect(res.floorApplied).toBe(true);
      expect(res.deadlineHours).toBe(24);
    }
  });

  it('enforces high floor on campus electrical, fire, gas_leak, chemical_lab, fall_from_height, and violence_weapon', () => {
    for (const type of [
      'electrical',
      'fire',
      'gas_leak',
      'chemical_lab',
      'fall_from_height',
      'violence_weapon',
    ] as const) {
      const res = evaluateSeverityFloor('campus', type, 'medium');
      expect(res.finalSeverity).toBe('high');
      expect(res.floorApplied).toBe(true);
      expect(res.deadlineHours).toBe(24);
    }
  });

  it('allows AI to raise severity above the floor to critical (2h deadline)', () => {
    const res = evaluateSeverityFloor('construction', 'electrical', 'critical');
    expect(res.finalSeverity).toBe('critical');
    expect(res.floorApplied).toBe(false);
    expect(res.deadlineHours).toBe(2);
  });

  it('keeps non-floor hazard types at low (168h) or medium (72h) when AI grades them so', () => {
    const lowRes = evaluateSeverityFloor('construction', 'housekeeping', 'low');
    expect(lowRes.finalSeverity).toBe('low');
    expect(lowRes.floorApplied).toBe(false);
    expect(lowRes.deadlineHours).toBe(168);

    const medRes = evaluateSeverityFloor('campus', 'sanitation_water', 'medium');
    expect(medRes.finalSeverity).toBe('medium');
    expect(medRes.floorApplied).toBe(false);
    expect(medRes.deadlineHours).toBe(72);
  });
});
