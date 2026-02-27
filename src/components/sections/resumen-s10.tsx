import React, { useState, useMemo, useEffect, useRef } from "react";
import type { BudgetSection, BudgetGroup } from "@/lib/types";
import { BUDGET_FORMULAS } from "@/data/budget-formulas";
import { fmtS } from "@/lib/utils";
import { useInsumos } from "@/lib/insumo-context";
import { useFloors } from "@/lib/floor-context";
import { useSectionData } from "@/lib/section-data-context";
import { PartidaDetail } from "@/components/sections/partida-detail";
import { Tooltip } from "@/components/ui/tooltip";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RefreshCw, Link2, Pencil, Unlink } from "lucide-react";

const NAVIGABLE_LINKS = new Set(["columnas", "vigas", "losa", "muros", "escalera"]);

export interface ResumenS10Props {
  budget: BudgetSection[];
  onUpdateDesc: (si: number, gi: number, ii: number, v: string) => void;
  onUpdateCU: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateMet: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateFactor: (si: number, gi: number, ii: number, factor: number) => void;
  onToggleItemFactor: (si: number, gi: number, ii: number) => void;
  onAddItem: (si: number, gi: number, currentLen: number, item?: import("@/lib/types").BudgetItem) => void;
  onDelItem: (si: number, gi: number, ii: number) => void;
  onSyncArea?: (si: number, gi: number, newArea: number) => void;
  onUpdateArea?: (si: number, gi: number, newArea: number) => void;
  onToggleAreaSource?: (si: number, gi: number) => void;
  undo: () => void;
  redo: () => void;
  goTo?: (id: string) => void;
}

function classifyItem(d: string): "mano-de-obra" | "material" {
  const dl = d.toLowerCase();
  if (dl.startsWith("mo ") || dl.startsWith("mano de obra") || dl === "mano de obra") return "mano-de-obra";
  return "material";
}

function groupSubtotal(g: BudgetGroup): number {
  return g.items.reduce((s, it) => s + it.m * it.cu, 0);
}

/* Inline editable metrado cell */
function MetradoCell({
  group,
  si,
  gi,
  onUpdateArea,
  onSyncArea,
  onToggleAreaSource,
  goTo,
}: {
  group: BudgetGroup;
  si: number;
  gi: number;
  onUpdateArea?: (si: number, gi: number, v: number) => void;
  onSyncArea?: (si: number, gi: number, v: number) => void;
  onToggleAreaSource?: (si: number, gi: number) => void;
  goTo?: (id: string) => void;
}) {
  const sectionData = useSectionData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasArea = group.areaM2 != null;
  const srcType = group.areaSource?.type;
  const isManual = srcType === "manual";
  const isAuto = srcType === "auto";

  // Check if there's a formula for auto-sync
  const formula = BUDGET_FORMULAS[group.id];
  const calcResult = formula ? formula(sectionData) : null;
  const calcArea = calcResult?.value;
  const isDiff = hasArea && calcArea != null && Math.abs(calcArea - (group.areaM2 ?? 0)) > 0.01;

  if (!hasArea) {
    return <span className="text-text-soft text-[11px]">—</span>;
  }

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isManual || !onUpdateArea) return;
    setDraft(String(group.areaM2 ?? 0));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    const v = parseFloat(draft);
    if (!isNaN(v) && v >= 0 && onUpdateArea) onUpdateArea(si, gi, v);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-[70px] text-right text-xs font-semibold bg-white dark:bg-slate-800 border border-primary rounded px-1 py-0.5 outline-none tabular-nums"
      />
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Main value */}
      <span
        className={`font-semibold tabular-nums text-[11px] ${isManual ? "text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" : "text-emerald-600 dark:text-emerald-400"}`}
        onClick={isManual ? startEdit : undefined}
        title={isManual ? "Click para editar" : calcResult?.detail ?? ""}
      >
        {(group.areaM2 ?? 0).toFixed(2)}
      </span>
      <span className="text-[9px] text-text-soft">{group.metradoUnit ?? "m²"}</span>

      {/* Source badge */}
      {isAuto && (
        <Tooltip content={`Auto: ${calcResult?.detail ?? "calculado desde sección enlazada"}`}>
          <span className="flex items-center gap-0.5">
            <Link2 size={9} className="text-emerald-500" />
            {group.link && goTo && NAVIGABLE_LINKS.has(group.link) && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(group.link!); }}
                className="text-[8px] text-emerald-600 dark:text-emerald-400 underline cursor-pointer hover:text-emerald-500"
              >
                ver
              </button>
            )}
          </span>
        </Tooltip>
      )}
      {isManual && (
        <Tooltip content="Manual — click en el valor para editar">
          <Pencil size={9} className="text-blue-400 cursor-pointer" onClick={startEdit} />
        </Tooltip>
      )}

      {/* Sync button when auto is out of date */}
      {isAuto && isDiff && onSyncArea && (
        <Tooltip content={`Sincronizar: ${(group.areaM2 ?? 0).toFixed(1)} → ${calcArea!.toFixed(1)} m²`}>
          <button
            onClick={(e) => { e.stopPropagation(); onSyncArea(si, gi, calcArea!); }}
            className="text-amber-500 hover:text-amber-400 cursor-pointer"
          >
            <RefreshCw size={10} />
          </button>
        </Tooltip>
      )}

      {/* Toggle auto/manual */}
      {onToggleAreaSource && (
        <Tooltip content={isAuto ? "Cambiar a manual" : "Cambiar a auto (si hay fórmula)"}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleAreaSource(si, gi); }}
            className="text-text-soft hover:text-text cursor-pointer"
          >
            {isAuto ? <Unlink size={8} /> : <Link2 size={8} />}
          </button>
        </Tooltip>
      )}
    </div>
  );
}

export function ResumenS10({
  budget,
  onUpdateDesc,
  onUpdateCU,
  onUpdateMet,
  onUpdateFactor,
  onToggleItemFactor,
  onAddItem,
  onDelItem,
  onSyncArea,
  onUpdateArea,
  onToggleAreaSource,
  undo,
  redo,
  goTo,
}: ResumenS10Props) {
  const { insumos } = useInsumos();
  const { floors } = useFloors();
  const insumoMap = new Map(insumos.map((i) => [i.id, i]));

  // Flatten groups with their (si, gi) coordinates
  const flatEntries = useMemo(() => {
    const entries: { group: BudgetGroup; si: number; gi: number }[] = [];
    budget.forEach((section, si) => {
      section.groups.forEach((group, gi) => {
        entries.push({ group, si, gi });
      });
    });
    return entries;
  }, [budget]);

  // Selected partida key (si-gi)
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Extract distinct pisos from budget (dynamic)
  const pisos = useMemo(() => {
    const seen = new Set<string>();
    for (const { group } of flatEntries) {
      if (group.piso) seen.add(group.piso);
    }
    return Array.from(seen);
  }, [flatEntries]);

  const [pisoFilter, setPisoFilter] = useState<string>("todos");

  // Build tab list
  const floorMap = new Map(floors.map((f) => [f.id, f]));
  const tabs = useMemo(() => {
    const list: { id: string; label: string }[] = [{ id: "todos", label: "Todos" }];
    for (const p of pisos) {
      const floor = floorMap.get(p);
      list.push({ id: p, label: floor?.label ?? p });
    }
    return list;
  }, [pisos, floorMap]);

  // Filter sections by piso
  const filteredSections = useMemo(() => {
    if (pisoFilter === "todos") return budget;
    return budget
      .map((s) => ({ ...s, groups: s.groups.filter((g) => g.piso === pisoFilter) }))
      .filter((s) => s.groups.length > 0);
  }, [budget, pisoFilter]);

  // section.id → original si index
  const sectionIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    budget.forEach((s, si) => m.set(s.id, si));
    return m;
  }, [budget]);

  // Also map group.id → original gi in its section
  const groupIndexMap = useMemo(() => {
    const m = new Map<string, { si: number; gi: number }>();
    budget.forEach((s, si) => s.groups.forEach((g, gi) => m.set(g.id, { si, gi })));
    return m;
  }, [budget]);

  // Reset selection when filter changes
  useEffect(() => {
    if (selectedKey === null) return;
    const allKeys = new Set<string>();
    filteredSections.forEach((s) => {
      const si = sectionIndexMap.get(s.id)!;
      s.groups.forEach((g, gi) => allKeys.add(`${si}-${gi}`));
    });
    if (!allKeys.has(selectedKey)) setSelectedKey(null);
  }, [filteredSections, selectedKey, sectionIndexMap]);

  // Grand total
  const grandTotal = filteredSections.reduce(
    (s, sec) => s + sec.groups.reduce((ss, g) => ss + groupSubtotal(g), 0), 0,
  );

  // Selected entry
  const selectedEntry = selectedKey !== null
    ? flatEntries.find(({ si, gi }) => `${si}-${gi}` === selectedKey)
    : null;

  // ── Section B: Descomposicion por Tipo ──
  let matTotal = 0, moTotal = 0, eqTotal = 0;
  for (const sec of filteredSections) {
    for (const group of sec.groups) {
      for (const it of group.items) {
        const cp = it.m * it.cu;
        if (it.insumoId) {
          const ins = insumoMap.get(it.insumoId);
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
  const tipoTotal = matTotal + moTotal + eqTotal;

  // ── Section C: Consolidado ──
  interface ConsolidatedEntry {
    key: string; nombre: string; unidad: string; pu: number; cantTotal: number;
    grupo: "material" | "mano-de-obra" | "equipo";
  }
  const consolidated = new Map<string, ConsolidatedEntry>();
  for (const sec of filteredSections) {
    for (const group of sec.groups) {
      for (const it of group.items) {
        if (it.insumoId) {
          const ins = insumoMap.get(it.insumoId);
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
  const consolidatedArr = Array.from(consolidated.values());
  const groupLabels: Record<string, string> = { material: "Materiales", "mano-de-obra": "Mano de Obra", equipo: "Equipos" };
  const groupOrder = ["material", "mano-de-obra", "equipo"] as const;
  const consolidatedGrandTotal = consolidatedArr.reduce((s, e) => s + e.cantTotal * e.pu, 0);

  let subCounter = 0;

  return (
    <div className="space-y-6">
      {/* Floor tabs */}
      {pisos.length > 1 && (
        <div className="inline-flex rounded-xl border border-border overflow-hidden">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setPisoFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${pisoFilter === tab.id ? "bg-[#1E293B] text-white" : "bg-card text-text-mid hover:bg-muted"}`}
            >{tab.label}</button>
          ))}
        </div>
      )}

      {/* ═══ Section A: Side-by-side — Table left, Detail right ═══ */}
      <div className={`grid gap-4 ${selectedEntry ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-1"}`}>
        {/* Left: Table */}
        <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#1E293B] flex justify-between items-center">
            <span className="text-[13px] font-semibold text-white">A. Resumen por Partida</span>
            <span className="text-sm font-extrabold text-white tabular-nums">{fmtS(grandTotal)}</span>
          </div>
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 bg-muted text-text-mid text-center">#</TableHead>
                  <TableHead className="text-left bg-muted text-text-mid">Partida / Sub-partida</TableHead>
                  <TableHead className="w-[120px] text-right bg-muted text-text-mid">Metrado</TableHead>
                  <TableHead className="w-[90px] text-right bg-muted text-text-mid">Subtotal</TableHead>
                  <TableHead className="w-[45px] text-right bg-muted text-text-mid">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSections.map((sec) => {
                  const si = sectionIndexMap.get(sec.id)!;
                  const secTotal = sec.groups.reduce((s, g) => s + groupSubtotal(g), 0);

                  return (
                    <React.Fragment key={sec.id}>
                      {/* Section header */}
                      <TableRow className="bg-gradient-to-r from-[#0F172A] to-[#1E293B]">
                        <TableCell />
                        <TableCell className="text-xs font-bold text-white py-2" colSpan={2}>
                          {sec.title}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-white tabular-nums">
                          {fmtS(secTotal)}
                        </TableCell>
                        <TableCell className="text-right text-[10px] text-white/70 tabular-nums">
                          {grandTotal > 0 ? ((secTotal / grandTotal) * 100).toFixed(1) : "0.0"}%
                        </TableCell>
                      </TableRow>

                      {/* Sub-partida rows */}
                      {sec.groups.map((g, localGi) => {
                        subCounter++;
                        const realCoords = groupIndexMap.get(g.id);
                        const rsi = realCoords?.si ?? si;
                        const rgi = realCoords?.gi ?? localGi;
                        const sub = groupSubtotal(g);
                        const key = `${rsi}-${rgi}`;
                        const isSelected = selectedKey === key;

                        return (
                          <TableRow
                            key={key}
                            onClick={() => setSelectedKey(isSelected ? null : key)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary"
                                : subCounter % 2 === 0
                                  ? "bg-muted/50 hover:bg-muted"
                                  : "hover:bg-muted/50"
                            }`}
                          >
                            <TableCell className="text-center text-text-soft text-[10px] tabular-nums">
                              {subCounter}
                            </TableCell>
                            <TableCell className="text-xs pl-5">
                              <span className="flex items-center gap-1.5">
                                {isSelected && <span className="text-primary font-bold text-[10px]">▶</span>}
                                <span className={isSelected ? "font-semibold" : ""}>{g.cat}</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-right p-1">
                              <MetradoCell
                                group={g}
                                si={rsi}
                                gi={rgi}
                                onUpdateArea={onUpdateArea}
                                onSyncArea={onSyncArea}
                                onToggleAreaSource={onToggleAreaSource}
                                goTo={goTo}
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold tabular-nums">
                              {fmtS(sub)}
                            </TableCell>
                            <TableCell className="text-right text-[10px] text-text-soft tabular-nums">
                              {grandTotal > 0 ? ((sub / grandTotal) * 100).toFixed(1) : "0.0"}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                <TableRow className="bg-[#1E293B]">
                  <TableCell />
                  <TableCell className="text-xs font-bold text-white" colSpan={2}>COSTO DIRECTO</TableCell>
                  <TableCell className="text-right text-sm font-extrabold text-white tabular-nums">{fmtS(grandTotal)}</TableCell>
                  <TableCell className="text-right text-[10px] font-bold text-white">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-2 pt-3 pb-1 text-[10px] text-text-soft border-t border-border mt-2">
              <span className="flex items-center gap-1">
                <Link2 size={9} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Auto</span>
                — enlazado
              </span>
              <span className="flex items-center gap-1">
                <Pencil size={9} className="text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">Manual</span>
                — editable
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw size={9} className="text-amber-500" />
                Sincronizar
              </span>
            </div>
          </div>
        </div>

        {/* Right: Detail panel */}
        {selectedEntry && (
          <div className="lg:sticky lg:top-4 self-start max-h-[80vh] overflow-y-auto">
            <PartidaDetail
              group={selectedEntry.group}
              si={selectedEntry.si}
              gi={selectedEntry.gi}
              onUpdateDesc={onUpdateDesc}
              onUpdateCU={onUpdateCU}
              onUpdateMet={onUpdateMet}
              onUpdateFactor={onUpdateFactor}
              onToggleItemFactor={onToggleItemFactor}
              onAddItem={onAddItem}
              onDelItem={onDelItem}
              onSyncArea={onSyncArea}
              undo={undo}
              redo={redo}
            />
          </div>
        )}
      </div>

      {/* ═══ Section B + C side by side ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    </div>
  );
}
