import { createSignal, createEffect, onCleanup } from "solid-js";
import { cn } from "@/lib/utils";
import { useSpreadsheet } from "./spreadsheet-context";

interface EditCellProps {
  value: string | number;
  onChange: (v: string | number) => void;
  type?: "number" | "text";
  class?: string;
  row?: number;
  col?: number;
  editable?: boolean;
  format?: (v: string | number) => string;
  min?: number;
  max?: number;
  autoEdit?: boolean;
}

export function EditCell(props: EditCellProps) {
  const ctx = useSpreadsheet();
  const hasGrid = () => ctx != null && props.row != null && props.col != null;

  const [standaloneEditing, setStandaloneEditing] = createSignal(false);
  const [temp, setTemp] = createSignal(String(props.value));
  let cellRef!: HTMLDivElement;
  let inputRef!: HTMLInputElement;

  // Register cell ref with grid
  createEffect(() => {
    if (hasGrid() && ctx) {
      ctx.registerCell(props.row!, props.col!, cellRef);
      onCleanup(() => ctx.registerCell(props.row!, props.col!, null));
    }
  });

  // Sync temp when value changes externally
  createEffect(() => {
    setTemp(String(props.value));
  });

  const isSelected = () => hasGrid() && ctx!.selectedCell()?.row === props.row && ctx!.selectedCell()?.col === props.col;
  const isEditing = () => hasGrid()
    ? ctx!.editingCell()?.row === props.row && ctx!.editingCell()?.col === props.col
    : standaloneEditing();

  // Auto-edit
  createEffect(() => {
    if (!props.autoEdit) return;
    if (hasGrid() && ctx) {
      setTemp(String(props.value));
      ctx.startEditing(props.row!, props.col!);
    } else {
      setTemp(String(props.value));
      setStandaloneEditing(true);
    }
  });

  // Auto-focus input when editing starts
  createEffect(() => {
    if (isEditing() && inputRef) {
      inputRef.focus();
      if (hasGrid() && ctx!.initialKey()) {
        setTemp(ctx!.initialKey()!);
      } else {
        inputRef.select();
      }
    }
  });

  function commitValue() {
    const t = temp();
    const type = props.type ?? "number";
    let parsed: string | number;
    if (type === "number") {
      parsed = parseFloat(t) || 0;
      if (props.min != null && (parsed as number) < props.min) parsed = props.min;
      if (props.max != null && (parsed as number) > props.max) parsed = props.max;
    } else {
      parsed = t;
    }
    props.onChange(parsed);
  }

  function handleBlur() {
    commitValue();
    if (hasGrid()) {
      ctx!.stopEditing();
    } else {
      setStandaloneEditing(false);
    }
  }

  function handleInputKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      commitValue();
      if (!hasGrid()) {
        setStandaloneEditing(false);
      }
      return;
    }
    if (e.key === "Escape") {
      setTemp(String(props.value));
      if (hasGrid()) {
        ctx!.stopEditing();
      } else {
        setStandaloneEditing(false);
      }
      return;
    }
    if (hasGrid() && e.key === "Tab") {
      commitValue();
      return;
    }
    e.stopPropagation();
  }

  const displayValue = () => {
    if (props.format) return props.format(props.value);
    if (typeof props.value === "number")
      return props.value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return props.value;
  };

  const editable = () => props.editable !== false;

  return (
    <>
      {!editable() ? (
        <div
          class={cn("px-1.5 py-0.5 min-h-[22px] cell-readonly rounded-sm", props.class)}
        >
          {displayValue()}
        </div>
      ) : isEditing() ? (
        <div class="cell-editing rounded-sm">
          <input
            ref={inputRef!}
            type={props.type ?? "number"}
            value={temp()}
            onInput={(e) => setTemp(e.currentTarget.value)}
            onBlur={handleBlur}
            onKeyDown={handleInputKeyDown}
            class={cn(
              "w-full border-0 rounded-sm px-1.5 py-0.5 text-xs bg-white outline-none",
              props.class
            )}
            min={props.min}
            max={props.max}
          />
        </div>
      ) : (
        <div
          ref={cellRef!}
          tabIndex={hasGrid() ? -1 : 0}
          onClick={() => {
            if (hasGrid()) {
              ctx!.selectCell(props.row!, props.col!);
            } else {
              setTemp(String(props.value));
              setStandaloneEditing(true);
            }
          }}
          onDblClick={() => {
            if (hasGrid()) {
              setTemp(String(props.value));
              ctx!.startEditing(props.row!, props.col!);
            }
          }}
          class={cn(
            "cell-editable px-1.5 py-0.5 rounded-sm min-h-[22px] text-xs",
            isSelected() && "cell-selected",
            props.class
          )}
          title={hasGrid() ? "Click: seleccionar · Doble-click: editar" : "Click para editar"}
        >
          {displayValue()}
        </div>
      )}
    </>
  );
}
