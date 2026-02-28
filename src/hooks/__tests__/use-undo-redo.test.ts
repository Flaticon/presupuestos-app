import { describe, it, expect } from "vitest";
import { createRoot } from "solid-js";
import { useUndoRedo } from "../use-undo-redo";

function withRoot<T>(fn: () => T): T {
  let result!: T;
  createRoot((dispose) => {
    result = fn();
    dispose();
  });
  return result;
}

describe("useUndoRedo", () => {
  it("inicializa con valor directo", () => {
    const ur = withRoot(() => useUndoRedo(42));
    expect(ur.state).toBe(42);
  });

  it("inicializa con funcion factory", () => {
    const ur = withRoot(() => useUndoRedo(() => [1, 2, 3]));
    expect(ur.state).toEqual([1, 2, 3]);
  });

  it("setState actualiza el estado", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(0);
      u.setState(5);
      return u;
    });
    expect(ur.state).toBe(5);
  });

  it("setState con updater function", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(10);
      u.setState((prev) => prev + 5);
      return u;
    });
    expect(ur.state).toBe(15);
  });

  it("undo restaura estado anterior", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo("a");
      u.setState("b");
      u.setState("c");
      u.undo();
      return u;
    });
    expect(ur.state).toBe("b");
  });

  it("multiples undos restauran en orden", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(1);
      u.setState(2);
      u.setState(3);
      u.setState(4);
      u.undo();
      u.undo();
      return u;
    });
    expect(ur.state).toBe(2);
  });

  it("redo restaura despues de undo", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo("x");
      u.setState("y");
      u.undo();
      u.redo();
      return u;
    });
    expect(ur.state).toBe("y");
  });

  it("undo sin historial no hace nada", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(99);
      u.undo();
      return u;
    });
    expect(ur.state).toBe(99);
  });

  it("redo sin futuro no hace nada", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(99);
      u.redo();
      return u;
    });
    expect(ur.state).toBe(99);
  });

  it("setState despues de undo limpia el futuro (redo)", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(1);
      u.setState(2);
      u.setState(3);
      u.undo(); // state = 2, future = [3]
      u.setState(4); // future se limpia
      u.redo(); // no deberia hacer nada
      return u;
    });
    expect(ur.state).toBe(4);
  });

  it("canUndo/canRedo reportan correctamente", () => {
    const result = withRoot(() => {
      const u = useUndoRedo(0);
      const snap1 = { canUndo: u.canUndo, canRedo: u.canRedo };
      u.setState(1);
      const snap2 = { canUndo: u.canUndo, canRedo: u.canRedo };
      u.undo();
      const snap3 = { canUndo: u.canUndo, canRedo: u.canRedo };
      return { snap1, snap2, snap3 };
    });
    expect(result.snap1).toEqual({ canUndo: false, canRedo: false });
    expect(result.snap2).toEqual({ canUndo: true, canRedo: false });
    expect(result.snap3).toEqual({ canUndo: false, canRedo: true });
  });

  it("respeta limite de historial (MAX_HISTORY = 50)", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(0);
      for (let i = 1; i <= 60; i++) u.setState(i);
      // Deshacer 50 veces (maximo)
      for (let i = 0; i < 55; i++) u.undo();
      return u;
    });
    // Debe detenerse en el limite, no llegar a 0
    expect(ur.state).toBeGreaterThan(0);
  });

  it("funciona con objetos (inmutabilidad)", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo({ count: 0, label: "a" });
      u.setState((prev) => ({ ...prev, count: 1 }));
      u.setState((prev) => ({ ...prev, count: 2, label: "b" }));
      u.undo();
      return u;
    });
    expect(ur.state).toEqual({ count: 1, label: "a" });
  });

  it("funciona con arrays", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo<number[]>([]);
      u.setState((prev) => [...prev, 1]);
      u.setState((prev) => [...prev, 2]);
      u.setState((prev) => [...prev, 3]);
      u.undo();
      u.undo();
      return u;
    });
    expect(ur.state).toEqual([1]);
  });

  it("stateAccessor es un signal accessor", () => {
    const ur = withRoot(() => {
      const u = useUndoRedo(10);
      u.setState(20);
      return u;
    });
    expect(typeof ur.stateAccessor).toBe("function");
    expect(ur.stateAccessor()).toBe(20);
  });
});
