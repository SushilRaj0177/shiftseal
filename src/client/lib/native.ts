/**
 * The Android app's bridge (android/app/src/main/java/dev/sushilraj/shiftseal/Bridge.java).
 * The app injects `window.ShiftsealAndroid`; answers come back through
 * `window.__shiftsealNative.resolve`. In a browser none of this exists.
 */
interface Bridge {
  request(id: string, method: string, argsJson: string): void;
}

declare global {
  interface Window {
    ShiftsealAndroid?: Bridge;
    __shiftsealNative?: { resolve(id: string, json: string): void };
  }
}

const pending = new Map<string, (value: unknown) => void>();

export function isAndroidApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ShiftsealAndroid);
}

if (typeof window !== 'undefined') {
  window.__shiftsealNative = {
    resolve(id, json) {
      const done = pending.get(id);
      if (!done) return;
      pending.delete(id);
      try {
        done(JSON.parse(json));
      } catch {
        done(null);
      }
    },
  };
}

/** Calls the Android app. Resolves null outside the app, on error or after `timeoutMs`. */
export function callNative<T>(
  method: string,
  args: Record<string, unknown>,
  timeoutMs = 20_000
): Promise<T | null> {
  const bridge = typeof window !== 'undefined' ? window.ShiftsealAndroid : undefined;
  if (!bridge) return Promise.resolve(null);
  const id = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, timeoutMs);
    pending.set(id, (v) => {
      window.clearTimeout(timer);
      resolve(v as T | null);
    });
    try {
      bridge.request(id, method, JSON.stringify(args));
    } catch {
      pending.delete(id);
      window.clearTimeout(timer);
      resolve(null);
    }
  });
}

/** A Play Integrity token bound to this check's nonce, or undefined if unavailable. */
export async function integrityToken(nonce: string): Promise<string | undefined> {
  const res = await callNative<{ token?: string }>('integrityToken', { nonce }, 15_000);
  return res?.token || undefined;
}
