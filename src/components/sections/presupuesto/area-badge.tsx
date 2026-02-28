import { Show } from "solid-js";
import { resolveFormula } from "@/data/budget-formulas";
import type { BudgetGroup } from "@/lib/types";
import { useSectionData } from "@/lib/section-data-context";
import { Tooltip } from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-solid";

interface AreaBadgeProps {
  group: BudgetGroup;
  si: number;
  gi: number;
  onSync?: (si: number, gi: number, newArea: number) => void;
}

export function AreaBadge(props: AreaBadgeProps) {
  const sectionData = useSectionData();

  return (
    <Show when={props.group.areaM2 && props.group.areaSource}>
      {(_) => {
        const calcResult = () => resolveFormula(props.group.id, sectionData());

        const type = () => props.group.areaSource!.type;
        const nota = () => props.group.areaSource!.nota;
        const currentArea = () => props.group.areaM2!;
        const calcArea = () => calcResult()?.value;
        const isDiff = () => {
          const ca = calcArea();
          return ca != null && Math.abs(ca - currentArea()) > 0.01;
        };

        const tooltipText = () => nota() + (calcResult() ? ` | ${calcResult()!.detail}` : "");

        return (
          <Show when={type() === "auto"} fallback={
            <Show when={type() === "manual"} fallback={
              /* hybrid */
              <Tooltip content={tooltipText()}>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                  Hibrido: {currentArea().toFixed(2)} m²
                  {calcArea() != null && ` (calc: ${calcArea()!.toFixed(1)})`}
                </span>
              </Tooltip>
            }>
              <Tooltip content={nota() || ""}>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25">
                  Manual: {currentArea().toFixed(2)} m²
                </span>
              </Tooltip>
            </Show>
          }>
            <div class="inline-flex items-center gap-1.5">
              <Tooltip content={tooltipText()}>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  Auto: {currentArea().toFixed(2)} m²
                </span>
              </Tooltip>
              <Show when={isDiff() && props.onSync}>
                <Tooltip content={`Sincronizar: ${currentArea().toFixed(2)} → ${calcArea()!.toFixed(2)} m²`}>
                  <button
                    onClick={() => props.onSync!(props.si, props.gi, calcArea()!)}
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 cursor-pointer hover:bg-amber-500/25 transition-colors"
                  >
                    <RefreshCw size={10} />
                    {calcArea()!.toFixed(1)}
                  </button>
                </Tooltip>
              </Show>
            </div>
          </Show>
        );
      }}
    </Show>
  );
}
