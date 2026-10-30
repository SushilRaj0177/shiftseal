import { api, ApiError } from './api.js';

/**
 * Checks made without a signal wait here, already signed, and are sent in
 * order when the phone is back online. The server dates them by the gate
 * code they carry, so a late send does not change the recorded time.
 */

interface QueuedCheck {
  workplaceId: string;
  body: unknown;
  queuedAt: string;
}

const KEY = 'shiftseal.queue';

function read(): QueuedCheck[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as QueuedCheck[];
  } catch {
    return [];
  }
}

function write(items: QueuedCheck[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable; nothing more we can do offline
  }
}

export function enqueue(workplaceId: string, body: unknown): void {
  write([...read(), { workplaceId, body, queuedAt: new Date().toISOString() }]);
}

export function queuedCount(workplaceId: string): number {
  return read().filter((q) => q.workplaceId === workplaceId).length;
}

let flushing = false;

/** Sends queued checks in order. Stops at the first network failure; drops ones the server refuses. */
export async function flush(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let sent = 0;
  try {
    for (;;) {
      const [next, ...rest] = read();
      if (!next) break;
      try {
        await api(`/workplaces/${next.workplaceId}/checks`, { body: next.body });
        sent += 1;
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) break; // still offline
      }
      write(rest);
    }
  } finally {
    flushing = false;
  }
  return sent;
}
