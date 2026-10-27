import { describe, it, expect } from 'vitest';
import { evaluateWorkerFatigueAndAttrition } from '../../src/shared/rules/fatigue.js';
import { buildSeedSnapshot } from '../../src/server/store/seed.js';
import { latestView } from '../../src/shared/ledger/ledger.js';

describe('fatigue.ts', () => {
  it('flags Lakshmi for 7 consecutive nights, >60h in 7 days, and 6h rest gap on 24 Oct', () => {
    const seed = buildSeedSnapshot();
    const lakshmi = seed.workers.find((w) => w.id === 'w-lakshmi')!;
    const shifts = latestView(seed.chains['w-lakshmi']);
    const sig = evaluateWorkerFatigueAndAttrition(lakshmi, shifts, seed.claims);
    expect(sig.fatigueLevel).toBe('high');
    expect(sig.consecutiveDays).toBe(7);
    expect(sig.rolling7dHours).toBeGreaterThan(60);
    expect(sig.minRestGapHours).toBe(6);
    expect(sig.fatigueReasons.join(' | ')).toContain('7 days in a row');
    expect(sig.fatigueReasons.join(' | ')).toContain('rest gap 6 h on 24 Oct');
  });

  it('flags Rajesh for rising 3-week overtime trend and 2 missed shifts in 14 days', () => {
    const seed = buildSeedSnapshot();
    const rajesh = seed.workers.find((w) => w.id === 'w-rajesh')!;
    const shifts = latestView(seed.chains['w-rajesh']);
    const sig = evaluateWorkerFatigueAndAttrition(rajesh, shifts, seed.claims);
    expect(sig.attritionLevel).toBe('high');
    expect(sig.attritionReasons.join(' | ')).toContain('overtime rising 3 weeks in a row');
    expect(sig.attritionReasons.join(' | ')).toContain('2 missed shifts in 14 days');
  });

  it('rates a worker with normal 5-day shifts and no disputes as low risk', () => {
    const seed = buildSeedSnapshot();
    const velu = seed.workers.find((w) => w.id === 'w-velu')!;
    const shifts = latestView(seed.chains['w-velu']);
    const sig = evaluateWorkerFatigueAndAttrition(velu, shifts, []);
    expect(sig.fatigueLevel).toBe('low');
    expect(sig.attritionLevel).toBe('low');
  });
});
