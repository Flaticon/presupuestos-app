import { createSignal, Show } from "solid-js";
import type { BudgetGroup } from "@/lib/types";
import { resolveFormula } from "@/data/budget-formulas";
import { useSectionData } from "@/lib/section-data-context";
import { Tooltip } from "@/components/ui/tooltip";
import { RefreshCw, Link2, Pencil, Unlink } from "lucide-solid";

const NAVIGABLE_LINKS = new Set(["columnas", "vigas", "losa", "muros", "escalera"]);

export interface MetradoCellProps {
  group: BudgetGroup;
  si: number;
  gi: number;
  onUpdateArea?: (si: number, gi: number, v: number) => void;
  onSyncArea?: (si: number, gi: number, v: number) => void;
  onToggleAreaSource?: (si: number, gi: number) => void;
  goTo?: (id: string) => void;
}

export function MetradoCell(props: MetradoCellProps) {
  const sectionData = useSectionData();
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");
  let inputRef: HTMLInputElement | undefined;

  const hasArea = () => props.group.areaM2 != null;
  const srcType = () => props.group.areaSource?.type;
  const isManual = () => srcType() === "manual";
  const isAuto = () => srcType() === "auto";

  const calcResult = () => resolveFormula(props.group.id, sectionData());
  const calcArea = () => calcResult()?.value;
  const isDiff = () => hasArea() && calcArea() != null && Math.abs(calcArea()! - (props.group.areaM2 ?? 0)) > 0.01;

  const startEdit = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isManual() || !props.onUpdateArea) return;
    setDraft(String(props.group.areaM2 ?? 0));
    setEditing(true);
    setTimeout(() => inputRef?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    const v = parseFloat(draft());
    if (!isNaN(v) && v >= 0 && props.onUpdateArea) props.onUpdateArea(props.si, props.gi, v);
  };

  return (
    <Show when={hasArea()} fallback={<span class="text-text-soft text-[11px]">—</span>}>
      <Show
        when={!editing()}
        fallback={
          <input
            ref={inputRef}
            autofocus
            value={draft()}
            onClick={(e: MouseEvent) => e.stopPropagation()}
            onInput={(e) => setDraft(e.currentTarget.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            class="w-[70px] text-right text-xs font-semibold bg-white dark:bg-slate-800 border border-primary rounded px-1 py-0.5 outline-none tabular-nums"
          />
        }
      >
        <div class="flex items-center justify-end gap-1">
          {/* Main value */}
          <span
            class={`font-semibold tabular-nums text-[11px] ${isManual() ? "text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" : "text-emerald-600 dark:text-emerald-400"}`}
            onClick={isManual() ? startEdit : undefined}
            title={isManual() ? "Click para editar" : calcResult()?.detail ?? ""}
          >
            {(props.group.areaM2 ?? 0).toFixed(2)}
          </span>
          <span class="text-[9px] text-text-soft">{props.group.metradoUnit ?? "m²"}</span>

          {/* Source badge */}
          <Show when={isAuto()}>
            <Tooltip content={`Auto: ${calcResult()?.detail ?? "calculado desde sección enlazada"}`}>
              <span class="flex items-center gap-0.5">
                <Link2 size={9} class="text-emerald-500" />
                <Show when={props.group.link && props.goTo && NAVIGABLE_LINKS.has(props.group.link!)}>
                  <button
                    onClick={(e: MouseEvent) => { e.stopPropagation(); props.goTo!(props.group.link!); }}
                    class="text-[8px] text-emerald-600 dark:text-emerald-400 underline cursor-pointer hover:text-emerald-500"
                  >
                    ver
                  </button>
                </Show>
              </span>
            </Tooltip>
          </Show>
          <Show when={isManual()}>
            <Tooltip content="Manual — click en el valor para editar">
              <Pencil size={9} class="text-blue-400 cursor-pointer" onClick={startEdit} />
            </Tooltip>
          </Show>

          {/* Sync button when auto is out of date */}
          <Show when={isAuto() && isDiff() && props.onSyncArea}>
            <Tooltip content={`Sincronizar: ${(props.group.areaM2 ?? 0).toFixed(1)} → ${calcArea()!.toFixed(1)} m²`}>
              <button
                onClick={(e: MouseEvent) => { e.stopPropagation(); props.onSyncArea!(props.si, props.gi, calcArea()!); }}
                class="text-amber-500 hover:text-amber-400 cursor-pointer"
              >
                <RefreshCw size={10} />
              </button>
            </Tooltip>
          </Show>

          {/* Toggle auto/manual */}
          <Show when={props.onToggleAreaSource}>
            <Tooltip content={isAuto() ? "Cambiar a manual" : "Cambiar a auto (si hay fórmula)"}>
              <button
                onClick={(e: MouseEvent) => { e.stopPropagation(); props.onToggleAreaSource!(props.si, props.gi); }}
                class="text-text-soft hover:text-text cursor-pointer"
              >
                {isAuto() ? <Unlink size={8} /> : <Link2 size={8} />}
              </button>
            </Tooltip>
          </Show>
        </div>
      </Show>
    </Show>
  );
}
