import { describe, it, expect, beforeAll } from 'vitest';
import { getStore } from '../../src/server/store/firestore.js';
import { verify } from '../../src/shared/ledger/ledger.js';
import constructionRules from '../../src/shared/rules/rulesets/construction.json';
import campusRules from '../../src/shared/rules/rulesets/campus.json';

describe('seed data integrity', () => {
  beforeAll(async () => {
    await getStore().init();
  });

  it('seeds two workplaces in two distinct sectors', async () => {
    const workplaces = await getStore().getWorkplaces();
    expect(new Set(workplaces.map((w) => w.sector))).toEqual(new Set(['construction', 'campus']));
  });

  it('gives every seeded worker an intact SHA-256 ledger', async () => {
    const workers = await getStore().getWorkers();
    expect(workers.length).toBeGreaterThanOrEqual(10);
    for (const worker of workers) {
      const chain = await getStore().getWorkerChain(worker.id);
      expect(verify(chain), worker.id).toEqual({ ok: true });
    }
  });
});

describe('rulesets', () => {
  it.each([
    ['construction', constructionRules],
    ['campus', campusRules],
  ])('%s: every rule cites a source and is labelled law or policy', (_name, ruleset) => {
    const rules = Object.values((ruleset as { rules: Record<string, unknown> }).rules) as {
      id: string;
      kind: string;
      source: string;
      value: number;
    }[];
    expect(rules.length).toBeGreaterThan(5);
    for (const rule of rules) {
      expect(['law', 'policy'], rule.id).toContain(rule.kind);
      expect(rule.source.length, rule.id).toBeGreaterThan(5);
      expect(Number.isFinite(rule.value), rule.id).toBe(true);
    }
  });

  it('keeps the statutory overtime multiplier at 2x', () => {
    const rules = (constructionRules as { rules: Record<string, { value: number; kind: string }> })
      .rules;
    const multiplier = Object.values(rules).find(
      (r) => (r as unknown as { id: string }).id === 'ot.multiplier'
    );
    expect(multiplier?.value).toBe(2);
    expect(multiplier?.kind).toBe('law');
  });
});
