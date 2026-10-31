import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './api.js';

/** Loads a resource, keeps the last good data while refreshing, and polls if asked. */
export function useApi<T>(path: string | null, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const alive = useRef(true);
  // Only the newest request may update state, so a slow answer for the previous
  // page (another person, another workplace) can never overwrite the current one.
  const latest = useRef(0);

  const reload = useCallback(async () => {
    if (!path) return;
    const id = ++latest.current;
    try {
      const next = await api<T>(path);
      if (alive.current && id === latest.current) {
        setData(next);
        setError(null);
      }
    } catch (err) {
      if (alive.current && id === latest.current) setError(errorMessage(err));
    } finally {
      if (alive.current && id === latest.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    // A new path is a different thing: never show the last one's data while loading.
    setData(null);
    setError(null);
    setLoading(Boolean(path));
    void reload();
    // Coming back to the app (unlocking the phone, switching tabs) refreshes at once.
    const onShow = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onShow);
    const id = pollMs
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') void reload();
        }, pollMs)
      : 0;
    return () => {
      alive.current = false;
      document.removeEventListener('visibilitychange', onShow);
      if (id) window.clearInterval(id);
    };
  }, [reload, path, pollMs]);

  return { data, error, loading, reload };
}
