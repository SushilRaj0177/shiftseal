import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The offline queue must never lose a check because the server had a bad moment. */

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

const respond = (status: number, body: object = {}) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('offline queue', () => {
  it('keeps checks when the server is down, and sends them later', async () => {
    const q = await import('../../src/client/lib/queue.js');
    q.enqueue('wp1', { a: 1 });
    vi.stubGlobal('fetch', respond(503, { error: 'DOWN', message: 'Down' }));
    expect(await q.flush()).toEqual({ sent: 0, refused: [] });
    expect(q.queuedCount('wp1')).toBe(1);
    vi.stubGlobal('fetch', respond(201, { ok: true }));
    expect((await q.flush()).sent).toBe(1);
    expect(q.queuedCount('wp1')).toBe(0);
  });

  it('keeps checks while offline', async () => {
    const q = await import('../../src/client/lib/queue.js');
    q.enqueue('wp1', { a: 1 });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline')))
    );
    await q.flush();
    expect(q.queuedCount('wp1')).toBe(1);
  });

  it('reports a refused check instead of dropping it silently', async () => {
    const q = await import('../../src/client/lib/queue.js');
    q.enqueue('wp1', { a: 1 });
    vi.stubGlobal(
      'fetch',
      respond(400, { error: 'QR_EXPIRED', message: 'That gate code is too old.' })
    );
    const res = await q.flush();
    expect(res.refused).toEqual([
      { queuedAt: expect.any(String), message: 'That gate code is too old.' },
    ]);
    expect(q.queuedCount('wp1')).toBe(0);
  });

  it('treats an already-recorded check as done, not refused', async () => {
    const q = await import('../../src/client/lib/queue.js');
    q.enqueue('wp1', { a: 1 });
    vi.stubGlobal('fetch', respond(409, { error: 'REPLAYED', message: 'Already recorded.' }));
    expect(await q.flush()).toEqual({ sent: 0, refused: [] });
  });
});
