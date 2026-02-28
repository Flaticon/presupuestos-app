import { createMemo, For, Show } from "solid-js";
import type { BudgetSection } from "@/lib/types";
import type { Insumo } from "@/data/insumos-data";
import { classifyItem } from "@/lib/budget-helpers";
import { fmtS } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface ConsolidatedEntry {
  key: string;
  nombre: string;
  unidad: string;
  pu: number;
  cantTotal: number;
  grupo: "material" | "mano-de-obra" | "equipo";
}

const groupLabels: Record<string, string> = { material: "Materiales", "mano-de-obra": "Mano de Obra", equipo: "Equipos" };
const groupOrder = ["material", "mano-de-obra", "equipo"] as const;

interface ConsolidatedTableProps {
  sections: BudgetSection[];
  insumoMap: () => Map<string, Insumo>;
}

export function ConsolidatedTable(props: ConsolidatedTableProps) {
  const consolidatedData = createMemo(() => {
    const iMap = props.insumoMap();
    const consolidated = new Map<string, ConsolidatedEntry>();
    for (const sec of props.sections) {
      for (const group of sec.groups) {
        for (const it of group.items) {
          if (it.insumoId) {
            const ins = iMap.get(it.insumoId);
            if (!ins) continue;
            const existing = consolidated.get(it.insumoId);
            if (existing) existing.cantTotal += it.m;
            else consolidated.set(it.insumoId, { key: it.insumoId, nombre: ins.nombre, unidad: ins.unidad, pu: ins.precio, cantTotal: it.m, grupo: ins.grupo });
          } else {
            const uniqueKey = `_${group.cat}_${it.d}`;
            consolidated.set(uniqueKey, { key: uniqueKey, nombre: `${it.d} (${group.cat})`, unidad: it.u, pu: it.cu, cantTotal: it.m, grupo: classifyItem(it.d) === "mano-de-obra" ? "mano-de-obra" : "material" });
          }
        }
      }
    }
    return Array.from(consolidated.values());
  });

  const consolidatedGrandTotal = () => consolidatedData().reduce((s, e) => s + e.cantTotal * e.pu, 0);

  return (
    <div class="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div class="px-4 py-2.5 bg-[#18181B]">
        <span class="text-[13px] font-semibold text-white">C. Consolidado de Insumos</span>
      </div>
      <div class="p-2">
        <For each={groupOrder}>
          {(grupo) => {
            const entries = () => consolidatedData().filter((e) => e.grupo === grupo);
            const groupSub = () => entries().reduce((s, e) => s + e.cantTotal * e.pu, 0);
            return (
              <Show when={entries().length > 0}>
                <div class="mb-4 last:mb-0">
                  <div class="text-[10px] font-semibold text-text-soft uppercase tracking-wider mb-1 px-2">
                    {groupLabels[grupo]}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="text-left bg-muted text-text-mid">Insumo</TableHead>
                        <TableHead class="w-[50px] bg-muted text-text-mid">Und.</TableHead>
                        <TableHead class="w-[70px] text-right bg-muted text-text-mid">P.U.</TableHead>
                        <TableHead class="w-[70px] text-right bg-muted text-text-mid">Cant.</TableHead>
                        <TableHead class="w-[90px] text-right bg-muted text-text-mid">Costo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <For each={entries()}>
                        {(e, i) => (
                          <TableRow class={i() % 2 === 0 ? "bg-muted/30" : ""}>
                            <TableCell class="text-xs">{e.nombre}</TableCell>
                            <TableCell class="text-center text-[11px] text-text-soft">{e.unidad}</TableCell>
                            <TableCell class="text-right text-xs tabular-nums">{e.pu.toFixed(2)}</TableCell>
                            <TableCell class="text-right text-xs tabular-nums">{e.cantTotal.toFixed(2)}</TableCell>
                            <TableCell class="text-right text-xs font-semibold tabular-nums">{fmtS(e.cantTotal * e.pu)}</TableCell>
                          </TableRow>
                        )}
                      </For>
                      <TableRow class="bg-slate-100 dark:bg-slate-800/50">
                        <TableCell colSpan={4} class="text-xs font-semibold text-right">
                          Subtotal {groupLabels[grupo]}
                        </TableCell>
                        <TableCell class="text-right text-xs font-bold tabular-nums">{fmtS(groupSub())}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Show>
            );
          }}
        </For>

        <div class="mt-2 px-2 py-2 rounded-lg bg-[#18181B] flex justify-between items-center">
          <span class="text-xs font-bold text-white">GRAN TOTAL</span>
          <span class="text-sm font-extrabold text-white tabular-nums">{fmtS(consolidatedGrandTotal())}</span>
        </div>
      </div>
    </div>
  );
}
