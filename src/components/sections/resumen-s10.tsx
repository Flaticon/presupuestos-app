import { useState, useMemo, useEffect } from "react";
import type { BudgetGroup } from "@/lib/types";
import { fmtS } from "@/lib/utils";
import { useInsumos } from "@/lib/insumo-context";
import { useFloors } from "@/lib/floor-context";
import { PartidaDetail } from "@/components/sections/partida-detail";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export interface ResumenS10Props {
  budget: BudgetGroup[];
  onUpdateDesc: (gi: number, ii: number, v: string) => void;
  onUpdateCU: (gi: number, ii: number, v: number) => void;
  onUpdateMet: (gi: number, ii: number, v: number) => void;
  onUpdateFactor: (gi: number, ii: number, factor: number) => void;
  onAddItem: (gi: number, currentLen: number) => void;
  onDelItem: (gi: number, ii: number) => void;
  onSyncArea?: (gi: number, newArea: number) => void;
  undo: () => void;
  redo: () => void;
}

function classifyItem(d: string): "mano-de-obra" | "material" {
  const dl = d.toLowerCase();
  if (dl.startsWith("mo ") || dl.startsWith("mano de obra") || dl === "mano de obra") return "mano-de-obra";
  return "material";
}

export function ResumenS10({
  budget,
  onUpdateDesc,
  onUpdateCU,
  onUpdateMet,
  onUpdateFactor,
  onAddItem,
  onDelItem,
  onSyncArea,
  undo,
  redo,
}: ResumenS10Props) {
  const { insumos } = useInsumos();
  const { floors } = useFloors();
  const insumoMap = new Map(insumos.map((i) => [i.id, i]));

  // Selected partida index (in the full budget array)
  const [selectedGi, setSelectedGi] = useState<number | null>(null);

  // Extract distinct pisos from budget (dynamic)
  const pisos = useMemo(() => {
    const seen = new Set<string>();
    for (const g of budget) {
      if (g.piso) seen.add(g.piso);
    }
    return Array.from(seen);
  }, [budget]);

  const [pisoFilter, setPisoFilter] = useState<string>("todos");

  // Build tab list: Todos + each piso with its label from floors context
  const floorMap = new Map(floors.map((f) => [f.id, f]));
  const tabs = useMemo(() => {
    const list: { id: string; label: string }[] = [{ id: "todos", label: "Todos" }];
    for (const p of pisos) {
      const floor = floorMap.get(p);
      list.push({ id: p, label: floor?.label ?? p });
    }
    return list;
  }, [pisos, floorMap]);

  // Filter budget by selected piso — keep original indices
  const filtered = useMemo(() => {
    if (pisoFilter === "todos") {
      return budget.map((g, i) => ({ group: g, originalIndex: i }));
    }
    return budget
      .map((g, i) => ({ group: g, originalIndex: i }))
      .filter(({ group }) => group.piso === pisoFilter);
  }, [budget, pisoFilter]);

  // Reset selection when piso filter changes and selected partida is not in the filtered list
  useEffect(() => {
    if (selectedGi === null) return;
    const isInFilter = filtered.some(({ originalIndex }) => originalIndex === selectedGi);
    if (!isInFilter) setSelectedGi(null);
  }, [filtered, selectedGi]);

  // ── Section A: Resumen por Partida ──
  const partidas = filtered.map(({ group, originalIndex }) => {
    const sub = group.items.reduce((s, it) => s + it.m * it.cu, 0);
    return { cat: group.cat, sub, originalIndex };
  });
  const grandTotal = partidas.reduce((s, p) => s + p.sub, 0);

  // ── Section B: Descomposicion por Tipo ──
  let matTotal = 0;
  let moTotal = 0;
  let eqTotal = 0;
  for (const { group } of filtered) {
    for (const it of group.items) {
      const cp = it.m * it.cu;
      if (it.insumoId) {
        const ins = insumoMap.get(it.insumoId);
        if (ins) {
          if (ins.grupo === "mano-de-obra") moTotal += cp;
          else if (ins.grupo === "equipo") eqTotal += cp;
          else matTotal += cp;
        } else {
          matTotal += cp;
        }
      } else {
        const tipo = classifyItem(it.d);
        if (tipo === "mano-de-obra") moTotal += cp;
        else matTotal += cp;
      }
    }
  }
  const tipoTotal = matTotal + moTotal + eqTotal;

  // ── Section C: Consolidado de Insumos ──
  interface ConsolidatedEntry {
    key: string;
    nombre: string;
    unidad: string;
    pu: number;
    cantTotal: number;
    grupo: "material" | "mano-de-obra" | "equipo";
  }

  const consolidated = new Map<string, ConsolidatedEntry>();

  for (const { group } of filtered) {
    for (const it of group.items) {
      if (it.insumoId) {
        const ins = insumoMap.get(it.insumoId);
        if (!ins) continue;
        const existing = consolidated.get(it.insumoId);
        if (existing) {
          existing.cantTotal += it.m;
        } else {
          consolidated.set(it.insumoId, {
            key: it.insumoId,
            nombre: ins.nombre,
            unidad: ins.unidad,
            pu: ins.precio,
            cantTotal: it.m,
            grupo: ins.grupo,
          });
        }
      } else {
        const uniqueKey = `_${group.cat}_${it.d}`;
        consolidated.set(uniqueKey, {
          key: uniqueKey,
          nombre: `${it.d} (${group.cat})`,
          unidad: it.u,
          pu: it.cu,
          cantTotal: it.m,
          grupo: classifyItem(it.d) === "mano-de-obra" ? "mano-de-obra" : "material",
        });
      }
    }
  }

  const consolidatedArr = Array.from(consolidated.values());
  const groupLabels: Record<string, string> = {
    material: "Materiales",
    "mano-de-obra": "Mano de Obra",
    equipo: "Equipos",
  };
  const groupOrder = ["material", "mano-de-obra", "equipo"] as const;
  const consolidatedGrandTotal = consolidatedArr.reduce((s, e) => s + e.cantTotal * e.pu, 0);

  const selectedGroup = selectedGi !== null ? budget[selectedGi] : null;

  return (
    <div className="space-y-6">
      {/* Floor tabs */}
      {pisos.length > 1 && (
        <div className="inline-flex rounded-xl border border-border overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPisoFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                pisoFilter === tab.id
                  ? "bg-[#1E293B] text-white"
                  : "bg-card text-text-mid hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Section A — Split layout */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Partidas list */}
        <div className="w-full lg:w-[45%]">
          <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#1E293B]">
              <span className="text-[13px] font-semibold text-white">A. Resumen por Partida</span>
            </div>
            <div className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 bg-muted text-text-mid">#</TableHead>
                    <TableHead className="text-left bg-muted text-text-mid">Partida</TableHead>
                    <TableHead className="w-[100px] text-right bg-muted text-text-mid">Subtotal</TableHead>
                    <TableHead className="w-[60px] text-right bg-muted text-text-mid">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partidas.map((p, i) => {
                    const isSelected = selectedGi === p.originalIndex;
                    return (
                      <TableRow
                        key={p.originalIndex}
                        onClick={() => setSelectedGi(isSelected ? null : p.originalIndex)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 hover:bg-primary/15"
                            : i % 2 === 0
                              ? "bg-muted/50 hover:bg-muted"
                              : "hover:bg-muted/50"
                        }`}
                      >
                        <TableCell className="text-center text-text-soft text-[11px]">{i + 1}</TableCell>
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-1.5">
                            {isSelected && <span className="text-primary font-bold">▶</span>}
                            {p.cat}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold tabular-nums">{fmtS(p.sub)}</TableCell>
                        <TableCell className="text-right text-xs text-text-soft tabular-nums">
                          {grandTotal > 0 ? ((p.sub / grandTotal) * 100).toFixed(1) : "0.0"}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-[#1E293B]">
                    <TableCell />
                    <TableCell className="text-xs font-bold text-white">COSTO DIRECTO</TableCell>
                    <TableCell className="text-right text-sm font-extrabold text-white tabular-nums">{fmtS(grandTotal)}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-white">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right: Partida detail */}
        <div className="w-full lg:w-[55%]">
          {selectedGroup && selectedGi !== null ? (
            <PartidaDetail
              group={selectedGroup}
              gi={selectedGi}
              onUpdateDesc={onUpdateDesc}
              onUpdateCU={onUpdateCU}
              onUpdateMet={onUpdateMet}
              onUpdateFactor={onUpdateFactor}
              onAddItem={onAddItem}
              onDelItem={onDelItem}
              onSyncArea={onSyncArea}
              undo={undo}
              redo={redo}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden h-full flex items-center justify-center min-h-[200px]">
              <div className="text-center text-text-soft">
                <p className="text-sm font-medium">Selecciona una partida</p>
                <p className="text-xs mt-1">Click en una fila para ver y editar sus items</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section B */}
      <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#1E293B]">
          <span className="text-[13px] font-semibold text-white">B. Descomposicion por Tipo</span>
        </div>
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left bg-muted text-text-mid">Tipo</TableHead>
                <TableHead className="w-[100px] text-right bg-muted text-text-mid">Costo</TableHead>
                <TableHead className="w-[60px] text-right bg-muted text-text-mid">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "Materiales", value: matTotal },
                { label: "Mano de Obra", value: moTotal },
                { label: "Equipos", value: eqTotal },
              ].map((row, i) => (
                <TableRow key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="text-xs font-medium">{row.label}</TableCell>
                  <TableCell className="text-right text-xs font-semibold tabular-nums">{fmtS(row.value)}</TableCell>
                  <TableCell className="text-right text-xs text-text-soft tabular-nums">
                    {tipoTotal > 0 ? ((row.value / tipoTotal) * 100).toFixed(1) : "0.0"}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-[#1E293B]">
                <TableCell className="text-xs font-bold text-white">TOTAL</TableCell>
                <TableCell className="text-right text-sm font-extrabold text-white tabular-nums">{fmtS(tipoTotal)}</TableCell>
                <TableCell className="text-right text-xs font-bold text-white">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section C */}
      <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#1E293B]">
          <span className="text-[13px] font-semibold text-white">C. Consolidado de Insumos</span>
        </div>
        <div className="p-2">
          {groupOrder.map((grupo) => {
            const entries = consolidatedArr.filter((e) => e.grupo === grupo);
            if (entries.length === 0) return null;
            const groupSub = entries.reduce((s, e) => s + e.cantTotal * e.pu, 0);
            return (
              <div key={grupo} className="mb-4 last:mb-0">
                <div className="text-[10px] font-semibold text-text-soft uppercase tracking-wider mb-1 px-2">
                  {groupLabels[grupo]}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left bg-muted text-text-mid">Insumo</TableHead>
                      <TableHead className="w-[50px] bg-muted text-text-mid">Und.</TableHead>
                      <TableHead className="w-[70px] text-right bg-muted text-text-mid">P.U.</TableHead>
                      <TableHead className="w-[70px] text-right bg-muted text-text-mid">Cant.</TableHead>
                      <TableHead className="w-[90px] text-right bg-muted text-text-mid">Costo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e, i) => (
                      <TableRow key={e.key} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                        <TableCell className="text-xs">{e.nombre}</TableCell>
                        <TableCell className="text-center text-[11px] text-text-soft">{e.unidad}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{e.pu.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{e.cantTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold tabular-nums">{fmtS(e.cantTotal * e.pu)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 dark:bg-slate-800/50">
                      <TableCell colSpan={4} className="text-xs font-semibold text-right">
                        Subtotal {groupLabels[grupo]}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold tabular-nums">{fmtS(groupSub)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            );
          })}

          <div className="mt-2 px-2 py-2 rounded-lg bg-[#1E293B] flex justify-between items-center">
            <span className="text-xs font-bold text-white">GRAN TOTAL</span>
            <span className="text-sm font-extrabold text-white tabular-nums">{fmtS(consolidatedGrandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
