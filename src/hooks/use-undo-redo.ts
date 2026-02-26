import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initialState: T | (() => T)) {
  const [state, setStateInternal] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), prev];
      futureRef.current = [];
      return typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
    });
  }, []);

  const undo = useCallback(() => {
    setStateInternal((current) => {
      if (pastRef.current.length === 0) return current;
      const prev = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [...futureRef.current, current];
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setStateInternal((current) => {
      if (futureRef.current.length === 0) return current;
      const next = futureRef.current[futureRef.current.length - 1];
      futureRef.current = futureRef.current.slice(0, -1);
      pastRef.current = [...pastRef.current, current];
      return next;
    });
  }, []);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return { state, setState, undo, redo, canUndo, canRedo } as const;
}
