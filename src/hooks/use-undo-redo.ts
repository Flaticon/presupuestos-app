import { createSignal } from "solid-js";

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initialState: T | (() => T)) {
  const init = typeof initialState === "function" ? (initialState as () => T)() : initialState;
  const [state, setStateInternal] = createSignal<T>(init);
  let past: T[] = [];
  let future: T[] = [];

  function setState(updater: T | ((prev: T) => T)) {
    const prev = state();
    past = [...past.slice(-(MAX_HISTORY - 1)), prev];
    future = [];
    if (typeof updater === "function") {
      setStateInternal(updater as (p: T) => T);
    } else {
      setStateInternal(() => updater);
    }
  }

  function undo() {
    if (past.length === 0) return;
    const current = state();
    const prev = past[past.length - 1];
    past = past.slice(0, -1);
    future = [...future, current];
    setStateInternal(() => prev);
  }

  function redo() {
    if (future.length === 0) return;
    const current = state();
    const next = future[future.length - 1];
    future = future.slice(0, -1);
    past = [...past, current];
    setStateInternal(() => next);
  }

  return {
    get state() { return state(); },
    stateAccessor: state,
    setState,
    undo,
    redo,
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
  } as const;
}
