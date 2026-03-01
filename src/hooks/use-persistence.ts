import { createSignal, createEffect, onMount, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1s, 2s, 4s

const [pendingKeys, setPendingKeys] = createSignal<Set<string>>(new Set());

/** Reactive accessor: true when any key has unsaved changes */
export const hasPendingWrites: Accessor<boolean> = () => pendingKeys().size > 0;

function markPending(key: string) {
  setPendingKeys((prev) => { const s = new Set(prev); s.add(key); return s; });
}

function clearPending(key: string) {
  setPendingKeys((prev) => { const s = new Set(prev); s.delete(key); return s; });
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      // Don't retry client errors (4xx)
      if (res.status >= 400 && res.status < 500) return res;
    } catch (e) {
      if (attempt === retries) throw e;
    }
    // Exponential backoff before retry
    await new Promise((r) => setTimeout(r, BASE_DELAY * 2 ** attempt));
  }
  throw new Error("Max retries exceeded");
}

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
      .catch((e) => {
        if (!cancelled) {
          console.warn(`[metrados] persistence: error al cargar "${key}"`, e);
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
      markPending(key);
      fetchWithRetry(`/api/state/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      })
        .then(() => {
          clearPending(key);
        })
        .catch((e) => {
          console.warn(`[metrados] persistence: error al guardar "${key}" (agotados reintentos)`, e);
          // Keep pending so UI shows warning
        });
    }, 1500);
  });

  onCleanup(() => {
    if (timer) clearTimeout(timer);
  });
}
