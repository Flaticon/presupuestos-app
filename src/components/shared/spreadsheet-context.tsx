import { createContext, useContext, type JSX } from "solid-js";
import { useSpreadsheetGrid, type CellCoord } from "@/hooks/use-spreadsheet-grid";
import type { Accessor } from "solid-js";

interface SpreadsheetContextValue {
  selectedCell: Accessor<CellCoord | null>;
  editingCell: Accessor<CellCoord | null>;
  initialKey: Accessor<string | null>;
  selectCell: (row: number, col: number) => void;
  startEditing: (row: number, col: number, keyChar?: string) => void;
  stopEditing: () => void;
  deselect: () => void;
  registerCell: (row: number, col: number, el: HTMLElement | null) => void;
}

const SpreadsheetContext = createContext<SpreadsheetContextValue>();

export function useSpreadsheet() {
  return useContext(SpreadsheetContext);
}

interface SpreadsheetProviderProps {
  children: JSX.Element;
  rows: number | (() => number);
  cols: number;
  isCellEditable: (row: number, col: number) => boolean;
  onCellChange?: (row: number, col: number, value: string | number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function SpreadsheetProvider(props: SpreadsheetProviderProps) {
  const grid = useSpreadsheetGrid({
    rows: () => {
      const r = props.rows;
      return typeof r === "function" ? r() : r;
    },
    cols: props.cols,
    isCellEditable: props.isCellEditable,
    onCellChange: props.onCellChange,
    onUndo: props.onUndo,
    onRedo: props.onRedo,
  });

  return (
    <SpreadsheetContext.Provider value={grid}>
      <div
        tabIndex={0}
        onKeyDown={grid.handleGridKeyDown}
        class="outline-none"
      >
        {props.children}
      </div>
    </SpreadsheetContext.Provider>
  );
}
