import { createMemo, For } from "solid-js";
import type { BudgetSection } from "@/lib/types";
import type { Insumo } from "@/data/insumos-data";
import { classifyItem } from "@/lib/budget-helpers";
import { fmtS } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface TipoBreakdownProps {
  sections: BudgetSection[];
  insumoMap: () => Map<string, Insumo>;
}

export function TipoBreakdownTable(props: TipoBreakdownProps) {
  const tipoBreakdown = createMemo(() => {
    let matTotal = 0, moTotal = 0, eqTotal = 0;
    const iMap = props.insumoMap();
    for (const sec of props.sections) {
      for (const group of sec.groups) {
        for (const it of group.items) {
          const cp = it.m * it.cu;
          if (it.insumoId) {
            const ins = iMap.get(it.insumoId);
            if (ins) {
              if (ins.grupo === "mano-de-obra") moTotal += cp;
              else if (ins.grupo === "equipo") eqTotal += cp;
              else matTotal += cp;
            } else matTotal += cp;
          } else {
            if (classifyItem(it.d) === "mano-de-obra") moTotal += cp;
            else matTotal += cp;
          }
        }
      }
    }
    return { matTotal, moTotal, eqTotal, tipoTotal: matTotal + moTotal + eqTotal };
  });

  return (
    <div class="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div class="px-4 py-2.5 bg-[#18181B]">
        <span class="text-[13px] font-semibold text-white">B. Descomposicion por Tipo</span>
      </div>
      <div class="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="text-left bg-muted text-text-mid">Tipo</TableHead>
              <TableHead class="w-[100px] text-right bg-muted text-text-mid">Costo</TableHead>
              <TableHead class="w-[60px] text-right bg-muted text-text-mid">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={[
              { label: "Materiales", value: () => tipoBreakdown().matTotal },
              { label: "Mano de Obra", value: () => tipoBreakdown().moTotal },
              { label: "Equipos", value: () => tipoBreakdown().eqTotal },
            ]}>
              {(row, i) => (
                <TableRow class={i() % 2 === 0 ? "bg-muted/30" : ""}>
                  <TableCell class="text-xs font-medium">{row.label}</TableCell>
                  <TableCell class="text-right text-xs font-semibold tabular-nums">{fmtS(row.value())}</TableCell>
                  <TableCell class="text-right text-xs text-text-soft tabular-nums">
                    {tipoBreakdown().tipoTotal > 0 ? ((row.value() / tipoBreakdown().tipoTotal) * 100).toFixed(1) : "0.0"}%
                  </TableCell>
                </TableRow>
              )}
            </For>
            <TableRow class="bg-[#18181B]">
              <TableCell class="text-xs font-bold text-white">TOTAL</TableCell>
              <TableCell class="text-right text-sm font-extrabold text-white tabular-nums">{fmtS(tipoBreakdown().tipoTotal)}</TableCell>
              <TableCell class="text-right text-xs font-bold text-white">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
