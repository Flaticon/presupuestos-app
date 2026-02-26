import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSpreadsheet } from "./spreadsheet-context";

interface EditCellProps {
  value: string | number;
  onChange: (v: string | number) => void;
  type?: "number" | "text";
  className?: string;
  row?: number;
  col?: number;
  editable?: boolean;
  format?: (v: string | number) => string;
  min?: number;
  max?: number;
  autoEdit?: boolean;
}

export function EditCell({
  value,
  onChange,
  type = "number",
  className,
  row,
  col,
  editable = true,
  format,
  min,
  max,
  autoEdit,
}: EditCellProps) {
  const ctx = useSpreadsheet();
  const hasGrid = ctx != null && row != null && col != null;

  // Standalone mode (no grid context, like escalera) — old behavior
  const [standaloneEditing, setStandaloneEditing] = useState(false);
  const [temp, setTemp] = useState(String(value));
  const cellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Register cell ref with grid
  useEffect(() => {
    if (hasGrid && ctx) {
      ctx.registerCell(row, col, cellRef.current);
      return () => ctx.registerCell(row, col, null);
    }
  }, [hasGrid, ctx, row, col]);

  // Sync temp when value changes externally
  useEffect(() => {
    setTemp(String(value));
  }, [value]);

  // Grid mode state
  const isSelected = hasGrid && ctx.selectedCell?.row === row && ctx.selectedCell?.col === col;
  const isEditing = hasGrid
    ? ctx.editingCell?.row === row && ctx.editingCell?.col === col
    : standaloneEditing;

  // Auto-edit: programmatically enter edit mode (e.g. after adding a new row)
  useEffect(() => {
    if (!autoEdit) return;
    if (hasGrid && ctx) {
      setTemp(String(value));
      ctx.startEditing(row!, col!);
    } else {
      setTemp(String(value));
      setStandaloneEditing(true);
    }
  }, [autoEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (hasGrid && ctx.initialKey) {
        // Started by typing — replace value with initial key
        setTemp(ctx.initialKey);
      } else {
        inputRef.current.select();
      }
    }
  }, [isEditing, hasGrid, ctx?.initialKey]);

  const commitValue = useCallback(() => {
    let parsed: string | number;
    if (type === "number") {
      parsed = parseFloat(temp) || 0;
      if (min != null && (parsed as number) < min) parsed = min;
      if (max != null && (parsed as number) > max) parsed = max;
    } else {
      parsed = temp;
    }
    onChange(parsed);
  }, [temp, type, onChange, min, max]);

  const handleBlur = useCallback(() => {
    commitValue();
    if (hasGrid) {
      ctx.stopEditing();
    } else {
      setStandaloneEditing(false);
    }
  }, [commitValue, hasGrid, ctx]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commitValue();
        if (hasGrid) {
          // Grid handleGridKeyDown will handle navigation
        } else {
          setStandaloneEditing(false);
        }
        return;
      }
      if (e.key === "Escape") {
        setTemp(String(value)); // revert
        if (hasGrid) {
          ctx.stopEditing();
        } else {
          setStandaloneEditing(false);
        }
        return;
      }
      // Let Tab and arrow keys bubble to grid handler
      if (hasGrid && (e.key === "Tab")) {
        commitValue();
        // Don't stop propagation — let grid handle navigation
        return;
      }
      // Stop other keys from propagating to grid
      e.stopPropagation();
    },
    [commitValue, value, hasGrid, ctx]
  );

  const displayValue = format
    ? format(value)
    : typeof value === "number"
      ? value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;

  if (!editable) {
    return (
      <div
        className={cn("px-1.5 py-0.5 min-h-[22px] cell-readonly rounded-sm", className)}
      >
        {displayValue}
      </div>
    );
  }

  // EDITING state — show input
  if (isEditing) {
    return (
      <div className="cell-editing rounded-sm">
        <input
          ref={inputRef}
          type={type}
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
          className={cn(
            "w-full border-0 rounded-sm px-1.5 py-0.5 text-xs bg-white outline-none",
            className
          )}
          min={min}
          max={max}
        />
      </div>
    );
  }

  // DISPLAY / SELECTED state
  return (
    <div
      ref={cellRef}
      tabIndex={hasGrid ? -1 : 0}
      onClick={() => {
        if (hasGrid) {
          ctx.selectCell(row, col);
        } else {
          setTemp(String(value));
          setStandaloneEditing(true);
        }
      }}
      onDoubleClick={() => {
        if (hasGrid) {
          setTemp(String(value));
          ctx.startEditing(row, col);
        }
      }}
      className={cn(
        "cell-editable px-1.5 py-0.5 rounded-sm min-h-[22px] text-xs",
        isSelected && "cell-selected",
        className
      )}
      title={hasGrid ? "Click: seleccionar · Doble-click: editar" : "Click para editar"}
    >
      {displayValue}
    </div>
  );
}
