import { createSignal } from "solid-js";

export interface CellCoord {
  row: number;
  col: number;
}

interface GridConfig {
  rows: number | (() => number);
  cols: number;
  isCellEditable: (row: number, col: number) => boolean;
  onCellChange?: (row: number, col: number, value: string | number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useSpreadsheetGrid(config: GridConfig) {
  const getRows = typeof config.rows === "function" ? config.rows : () => config.rows as number;
  const cols = config.cols;
  const { isCellEditable, onUndo, onRedo } = config;
  const [selectedCell, setSelectedCell] = createSignal<CellCoord | null>(null);
  const [editingCell, setEditingCell] = createSignal<CellCoord | null>(null);
  const [initialKey, setInitialKey] = createSignal<string | null>(null);
  let cellRefs = new Map<string, HTMLElement>();

  const key = (r: number, c: number) => `${r},${c}`;

  function registerCell(row: number, col: number, el: HTMLElement | null) {
    const k = key(row, col);
    if (el) cellRefs.set(k, el);
    else cellRefs.delete(k);
  }

  function focusCell(row: number, col: number) {
    const el = cellRefs.get(key(row, col));
    if (el) el.focus();
  }

  function selectCell(row: number, col: number) {
    setEditingCell(null);
    setInitialKey(null);
    setSelectedCell({ row, col });
    focusCell(row, col);
  }

  function startEditing(row: number, col: number, keyChar?: string) {
    if (!isCellEditable(row, col)) return;
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setInitialKey(keyChar ?? null);
  }

  function stopEditing() {
    setEditingCell(null);
    setInitialKey(null);
  }

  function deselect() {
    setSelectedCell(null);
    setEditingCell(null);
    setInitialKey(null);
  }

  function findNextEditable(row: number, col: number, dRow: number, dCol: number): CellCoord | null {
    let r = row + dRow;
    let c = col + dCol;
    while (r >= 0 && r < getRows()) {
      while (c >= 0 && c < cols) {
        if (isCellEditable(r, c)) return { row: r, col: c };
        c += dCol || (dRow !== 0 ? 0 : 1);
        if (dCol === 0 && dRow !== 0) break;
      }
      if (dCol !== 0 && dRow === 0) {
        r += dCol > 0 ? 1 : -1;
        c = dCol > 0 ? 0 : cols - 1;
      } else {
        r += dRow;
        c = col;
      }
    }
    return null;
  }

  function findNextAny(row: number, col: number, dRow: number, dCol: number): CellCoord | null {
    const r = row + dRow;
    const c = col + dCol;
    if (r >= 0 && r < getRows() && c >= 0 && c < cols) return { row: r, col: c };
    return null;
  }

  function handleGridKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      onUndo?.();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
      e.preventDefault();
      onRedo?.();
      return;
    }

    const sel = selectedCell();
    if (!sel) return;
    const { row, col } = sel;
    const editing = editingCell();
    const isEditing = editing?.row === row && editing?.col === col;

    if (isEditing) {
      if (e.key === "Tab") {
        e.preventDefault();
        const next = findNextEditable(row, col, 0, e.shiftKey ? -1 : 1);
        if (next) {
          stopEditing();
          setTimeout(() => startEditing(next.row, next.col), 0);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        stopEditing();
        const next = findNextAny(row, col, 1, 0);
        if (next) setTimeout(() => selectCell(next.row, next.col), 0);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        stopEditing();
        selectCell(row, col);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight": {
        e.preventDefault();
        const dRow = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
        const dCol = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
        const next = findNextAny(row, col, dRow, dCol);
        if (next) selectCell(next.row, next.col);
        break;
      }
      case "Tab": {
        e.preventDefault();
        const next = findNextEditable(row, col, 0, e.shiftKey ? -1 : 1);
        if (next) selectCell(next.row, next.col);
        break;
      }
      case "Enter":
      case "F2":
        e.preventDefault();
        if (isCellEditable(row, col)) startEditing(row, col);
        break;
      case "Escape":
        e.preventDefault();
        deselect();
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        if (isCellEditable(row, col)) {
          config.onCellChange?.(row, col, 0);
        }
        break;
      default:
        if (
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          isCellEditable(row, col)
        ) {
          e.preventDefault();
          startEditing(row, col, e.key);
        }
    }
  }

  return {
    selectedCell,
    editingCell,
    initialKey,
    selectCell,
    startEditing,
    stopEditing,
    deselect,
    registerCell,
    handleGridKeyDown,
  };
}
