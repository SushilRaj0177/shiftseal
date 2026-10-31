import { api, ApiError, errorMessage } from './api.js';

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

/** A queued check the server refused, with its reason, for the worker to see. */
export interface Refused {
  queuedAt: string;
  message: string;
}

/**
 * Sends queued checks in order. Keeps them when the phone is offline, the
 * server is down or busy (5xx, 429); only a definite refusal (4xx) removes
 * one, and that refusal is reported back so it is never lost silently.
 */
export async function flush(): Promise<{ sent: number; refused: Refused[] }> {
  if (flushing) return { sent: 0, refused: [] };
  flushing = true;
  let sent = 0;
  const refused: Refused[] = [];
  try {
    for (;;) {
      const [next, ...rest] = read();
      if (!next) break;
      try {
        await api(`/workplaces/${next.workplaceId}/checks`, { body: next.body });
        sent += 1;
      } catch (err) {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 0 || status === 429 || status >= 500) break; // try again later
        // Already recorded earlier (a retry after a lost answer): nothing was lost.
        if (!(err instanceof ApiError && err.code === 'REPLAYED')) {
          refused.push({ queuedAt: next.queuedAt, message: errorMessage(err) });
        }
      }
      write(rest);
    }
  } finally {
    flushing = false;
  }
  return { sent, refused };
}
