import { describe, it, expect } from 'vitest';
import {
  canonicalJSON,
  sha256Hex,
  sha256HexAsync,
  append,
  verify,
  verifyAsync,
  latestView,
} from '../../src/shared/ledger/ledger.js';

describe('ledger.ts', () => {
  it('produces deterministic canonical JSON regardless of object key insertion order', () => {
    const a = canonicalJSON({ b: 2, a: 1, nested: { z: 'yes', y: 'no' } });
    const b = canonicalJSON({ nested: { y: 'no', z: 'yes' }, a: 1, b: 2 });
    expect(a).toBe(b);
  });

  it('computes identical SHA-256 digests synchronously and via WebCryptosubtle', async () => {
    const input = 'GENESIS{"id":"ev-1","type":"CHECK_IN"}';
    const syncHash = sha256Hex(input);
    const asyncHash = await sha256HexAsync(input);
    expect(syncHash).toHaveLength(64);
    expect(syncHash).toBe(asyncHash);
  });

  it('starts first event with prevHash GENESIS and chains subsequent events', () => {
    let chain = append([], {
      id: 'ev-1',
      workerId: 'w-murugan',
      type: 'CHECK_IN',
      createdAt: '2026-10-20T09:00:00Z',
      payload: { date: '2026-10-20', timestamp: '09:00', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-2',
      workerId: 'w-murugan',
      type: 'CHECK_OUT',
      createdAt: '2026-10-20T20:40:00Z',
      payload: { date: '2026-10-20', timestamp: '20:40', zoneCode: 'TB-SCAF-B' },
    });
    expect(chain[0].prevHash).toBe('GENESIS');
    expect(chain[1].prevHash).toBe(chain[0].hash);
    expect(verify(chain)).toEqual({ ok: true });
  });

  it('detects tampering at the exact broken index when an event payload is modified', async () => {
    let chain = append([], {
      id: 'ev-1',
      workerId: 'w-murugan',
      type: 'CHECK_IN',
      createdAt: '2026-10-20T09:00:00Z',
      payload: { date: '2026-10-20', timestamp: '09:00', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-2',
      workerId: 'w-murugan',
      type: 'CHECK_OUT',
      createdAt: '2026-10-20T20:40:00Z',
      payload: { date: '2026-10-20', timestamp: '20:40', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-3',
      workerId: 'w-murugan',
      type: 'CHECK_IN',
      createdAt: '2026-10-21T09:00:00Z',
      payload: { date: '2026-10-21', timestamp: '09:00', zoneCode: 'TB-SCAF-B' },
    });

    const tampered = structuredClone(chain);
    (tampered[1].payload as { timestamp: string }).timestamp = '18:00';
    expect(verify(tampered)).toEqual({ ok: false, brokenAt: 1 });
    expect(await verifyAsync(tampered)).toEqual({ ok: false, brokenAt: 1 });
  });

  it('detects tampering when prevHash link is altered', () => {
    let chain = append([], {
      id: 'ev-1',
      workerId: 'w-murugan',
      type: 'CHECK_IN',
      createdAt: '2026-10-20T09:00:00Z',
      payload: { date: '2026-10-20', timestamp: '09:00', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-2',
      workerId: 'w-murugan',
      type: 'CHECK_OUT',
      createdAt: '2026-10-20T17:00:00Z',
      payload: { date: '2026-10-20', timestamp: '17:00', zoneCode: 'TB-SCAF-B' },
    });
    const brokenLink = structuredClone(chain);
    brokenLink[1].prevHash = '00000000';
    expect(verify(brokenLink)).toEqual({ ok: false, brokenAt: 1 });
  });

  it('computes latestView after EDIT events while preserving original time and full edit history', () => {
    let chain = append([], {
      id: 'ev-1',
      workerId: 'w-murugan',
      type: 'CHECK_IN',
      createdAt: '2026-10-20T09:00:00Z',
      payload: { date: '2026-10-20', timestamp: '09:00', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-2',
      workerId: 'w-murugan',
      type: 'CHECK_OUT',
      createdAt: '2026-10-20T20:40:00Z',
      payload: { date: '2026-10-20', timestamp: '20:40', zoneCode: 'TB-SCAF-B' },
    });
    chain = append(chain, {
      id: 'ev-3',
      workerId: 'w-murugan',
      type: 'EDIT',
      createdAt: '2026-10-21T07:30:00Z',
      payload: {
        targetEventId: 'ev-2',
        field: 'timestamp',
        oldValue: '20:40',
        newValue: '18:00',
        reason: 'Standard site closing time adjustment',
        editorId: 'admin-ravi',
        editorName: 'Supervisor Ravi',
      },
    });

    const view = latestView(chain);
    expect(view).toHaveLength(1);
    expect(view[0].originalCheckOutTime).toBe('20:40');
    expect(view[0].checkOutTime).toBe('18:00');
    expect(view[0].edits).toHaveLength(1);
    expect(view[0].edits[0].editorName).toBe('Supervisor Ravi');
    expect(view[0].edits[0].reason).toBe('Standard site closing time adjustment');
  });
});
