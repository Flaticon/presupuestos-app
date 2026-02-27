import { useEffect, useRef } from "react";

/**
 * Syncs state to/from the D1 backend via `/api/state/:key`.
 * - Loads from API on mount, sets state if data exists.
 * - Debounced save (1.5s) on every state change after initial load.
 * - Silent catch: app continues with defaults if API is unavailable.
 */
export function usePersistence<T>(
  key: string,
  state: T,
  setState: (value: T | ((prev: T) => T)) => void
) {
  const loadedRef = useRef(false);
  const skipSaveRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on mount
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/state/${key}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data != null) {
          skipSaveRef.current = true;
          setState(data as T);
        }
        loadedRef.current = true;
        // Allow saves after a tick so the setState above doesn't trigger a save-back
        setTimeout(() => {
          skipSaveRef.current = false;
        }, 0);
      })
      .catch(() => {
        if (!cancelled) {
          loadedRef.current = true;
          skipSaveRef.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Debounced save
  useEffect(() => {
    if (!loadedRef.current || skipSaveRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      fetch(`/api/state/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => {
        /* silent — app works offline with defaults */
      });
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, state]);
}
