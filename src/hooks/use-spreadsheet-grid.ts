import { useState, useCallback, useRef } from "react";

export interface CellCoord {
  row: number;
  col: number;
}

interface GridConfig {
  rows: number;
  cols: number;
  isCellEditable: (row: number, col: number) => boolean;
  onCellChange?: (row: number, col: number, value: string | number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useSpreadsheetGrid(config: GridConfig) {
  const { rows, cols, isCellEditable, onUndo, onRedo } = config;
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [initialKey, setInitialKey] = useState<string | null>(null);
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  const key = (r: number, c: number) => `${r},${c}`;

  const registerCell = useCallback((row: number, col: number, el: HTMLElement | null) => {
    const k = key(row, col);
    if (el) cellRefs.current.set(k, el);
    else cellRefs.current.delete(k);
  }, []);

  const focusCell = useCallback((row: number, col: number) => {
    const el = cellRefs.current.get(key(row, col));
    if (el) el.focus();
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    setEditingCell(null);
    setInitialKey(null);
    setSelectedCell({ row, col });
    focusCell(row, col);
  }, [focusCell]);

  
  const startEditing = useCallback((row: number, col: number, keyChar?: string) => {
    if (!isCellEditable(row, col)) return;
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setInitialKey(keyChar ?? null);
  }, [isCellEditable]);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
    setInitialKey(null);
  }, []);

  const deselect = useCallback(() => {
    setSelectedCell(null);
    setEditingCell(null);
    setInitialKey(null);
  }, []);

  const findNextEditable = useCallback(
    (row: number, col: number, dRow: number, dCol: number): CellCoord | null => {
      let r = row + dRow;
      let c = col + dCol;
      // Wrap columns
      while (r >= 0 && r < rows) {
        while (c >= 0 && c < cols) {
          if (isCellEditable(r, c)) return { row: r, col: c };
          c += dCol || (dRow !== 0 ? 0 : 1);
          if (dCol === 0 && dRow !== 0) break;
        }
        if (dCol !== 0 && dRow === 0) {
          // Tab wrapping: go to next/prev row
          r += dCol > 0 ? 1 : -1;
          c = dCol > 0 ? 0 : cols - 1;
        } else {
          r += dRow;
          c = col;
        }
      }
      return null;
    },
    [rows, cols, isCellEditable]
  );

  const findNextAny = useCallback(
    (row: number, col: number, dRow: number, dCol: number): CellCoord | null => {
      const r = row + dRow;
      const c = col + dCol;
      if (r >= 0 && r < rows && c >= 0 && c < cols) return { row: r, col: c };
      return null;
    },
    [rows, cols]
  );

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Undo/Redo
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

      if (!selectedCell) return;
      const { row, col } = selectedCell;
      const isEditing = editingCell?.row === row && editingCell?.col === col;

      if (isEditing) {
        // While editing, only handle Tab, Enter, Escape (rest handled by input)
        if (e.key === "Tab") {
          e.preventDefault();
          // Input will commit via onBlur triggered by focus change
          const next = findNextEditable(row, col, 0, e.shiftKey ? -1 : 1);
          if (next) {
            stopEditing();
            // Small delay to allow blur commit
            setTimeout(() => startEditing(next.row, next.col), 0);
          }
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          // Commit handled by EditCell, move down
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
        return; // Don't intercept other keys while editing
      }

      // Selected but not editing
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
          // Start typing to edit
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
    },
    [
      selectedCell, editingCell, isCellEditable, config,
      findNextEditable, findNextAny, selectCell, startEditing,
      stopEditing, deselect, onUndo, onRedo,
    ]
  );

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
