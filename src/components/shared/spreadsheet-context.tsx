import { createContext, useContext, type ReactNode } from "react";
import { useSpreadsheetGrid, type CellCoord } from "@/hooks/use-spreadsheet-grid";

interface SpreadsheetContextValue {
  selectedCell: CellCoord | null;
  editingCell: CellCoord | null;
  initialKey: string | null;
  selectCell: (row: number, col: number) => void;
  startEditing: (row: number, col: number, keyChar?: string) => void;
  stopEditing: () => void;
  deselect: () => void;
  registerCell: (row: number, col: number, el: HTMLElement | null) => void;
}

const SpreadsheetContext = createContext<SpreadsheetContextValue | null>(null);

export function useSpreadsheet() {
  return useContext(SpreadsheetContext);
}

interface SpreadsheetProviderProps {
  children: ReactNode;
  rows: number;
  cols: number;
  isCellEditable: (row: number, col: number) => boolean;
  onCellChange?: (row: number, col: number, value: string | number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function SpreadsheetProvider({
  children,
  rows,
  cols,
  isCellEditable,
  onCellChange,
  onUndo,
  onRedo,
}: SpreadsheetProviderProps) {
  const grid = useSpreadsheetGrid({
    rows,
    cols,
    isCellEditable,
    onCellChange,
    onUndo,
    onRedo,
  });

  return (
    <SpreadsheetContext.Provider value={grid}>
      <div
        tabIndex={0}
        onKeyDown={grid.handleGridKeyDown}
        className="outline-none"
      >
        {children}
      </div>
    </SpreadsheetContext.Provider>
  );
}
