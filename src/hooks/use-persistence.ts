import { createEffect, onMount, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";

export function usePersistence<T>(
  key: string,
  state: Accessor<T>,
  setState: (value: T | ((prev: T) => T)) => void,
  migrate?: (data: unknown) => T | null,
) {
  let loaded = false;
  let skipSave = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    let cancelled = false;

    fetch(`/api/state/${key}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data != null) {
          const resolved = migrate ? migrate(data) : (data as T);
          if (resolved != null) {
            skipSave = true;
            setState(() => resolved);
          }
        }
        loaded = true;
        setTimeout(() => {
          skipSave = false;
        }, 0);
      })
      .catch(() => {
        if (!cancelled) {
          loaded = true;
          skipSave = false;
        }
      });

    onCleanup(() => {
      cancelled = true;
    });
  });

  createEffect(() => {
    const current = state();
    if (!loaded || skipSave) return;

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fetch(`/api/state/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      }).catch(() => {});
    }, 1500);
  });

  onCleanup(() => {
    if (timer) clearTimeout(timer);
  });
}
