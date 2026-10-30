import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './api.js';

/** Loads a resource, keeps the last good data while refreshing, and polls if asked. */
export function useApi<T>(path: string | null, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const alive = useRef(true);

  const reload = useCallback(async () => {
    if (!path) return;
    try {
      const next = await api<T>(path);
      if (alive.current) {
        setData(next);
        setError(null);
      }
    } catch (err) {
      if (alive.current) setError(errorMessage(err));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    setLoading(Boolean(path));
    void reload();
    if (!pollMs) return () => void (alive.current = false);
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload();
    }, pollMs);
    return () => {
      alive.current = false;
      window.clearInterval(id);
    };
  }, [reload, path, pollMs]);

  return { data, error, loading, reload };
}
