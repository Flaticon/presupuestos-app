import { useState, useCallback, useEffect, useRef } from "react";
import { BUDGET_INIT } from "@/data/budget-data";
import { BUDGET_FORMULAS } from "@/data/budget-formulas";
import type { BudgetGroup } from "@/lib/types";
import { fmtS } from "@/lib/utils";
import { exportBudgetCSV, exportBudgetXLS, exportBudgetPDF, exportInsumosPDF } from "@/lib/export-budget";
import { useProject } from "@/lib/project-context";
import { useSectionData } from "@/lib/section-data-context";
import { useInsumos } from "@/lib/insumo-context";
import { useFloors } from "@/lib/floor-context";
import { StatCard } from "@/components/shared/stat-card";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { usePersistence } from "@/hooks/use-persistence";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ResumenS10 } from "@/components/sections/resumen-s10";
import { Download, FileSpreadsheet, FileText, RefreshCw, Package, ClipboardList } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

interface PresupuestoProps {
  goTo: (id: string) => void;
}

// Budget table cols WITHOUT factor: 0=del, 1=Desc, 2=Und, 3=Metrado, 4=C.Unit, 5=C.Parcial
const EDITABLE_COLS = new Set([1, 3, 4]);

function AreaBadge({ group, gi, onSync }: { group: BudgetGroup; gi: number; onSync?: (gi: number, newArea: number) => void }) {
  const sectionData = useSectionData();

  if (!group.areaM2 || !group.areaSource) return null;

  const formula = BUDGET_FORMULAS[gi];
  const calcResult = formula ? formula(sectionData) : null;

  const { type, nota } = group.areaSource;
  const currentArea = group.areaM2;
  const calcArea = calcResult?.value;
  const isDiff = calcArea != null && Math.abs(calcArea - currentArea) > 0.01;

  const tooltipText = nota + (calcResult ? ` | ${calcResult.detail}` : "");

  if (type === "auto") {
    return (
      <div className="inline-flex items-center gap-1.5">
        <Tooltip content={tooltipText}>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            Auto: {currentArea.toFixed(2)} m²
          </span>
        </Tooltip>
        {isDiff && onSync && (
          <Tooltip content={`Sincronizar: ${currentArea.toFixed(2)} → ${calcArea!.toFixed(2)} m²`}>
            <button
              onClick={() => onSync(gi, calcArea!)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 cursor-pointer hover:bg-amber-500/25 transition-colors"
            >
              <RefreshCw size={10} />
              {calcArea!.toFixed(1)}
            </button>
          </Tooltip>
        )}
      </div>
    );
  }

  if (type === "manual") {
    return (
      <Tooltip content={nota || ""}>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25">
          Manual: {currentArea.toFixed(2)} m²
        </span>
      </Tooltip>
    );
  }

  // hybrid
  return (
    <Tooltip content={tooltipText}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
        Híbrido: {currentArea.toFixed(2)} m²
        {calcArea != null && ` (calc: ${calcArea.toFixed(1)})`}
      </span>
    </Tooltip>
  );
}

function EditableCatName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onChange(draft.trim());
  };

  if (!editing) {
    return (
      <span
        onDoubleClick={start}
        className="text-[13px] font-semibold text-white cursor-pointer hover:text-white/80"
        title="Doble click para editar"
      >
        {value}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      className="text-[13px] font-semibold text-white bg-white/10 border border-white/30 rounded px-1.5 py-0.5 outline-none min-w-[200px]"
    />
  );
}

export function Presupuesto({ goTo }: PresupuestoProps) {
  const { activeProject } = useProject();
  const { insumos } = useInsumos();
  const { floors } = useFloors();
  const { state: budget, setState: setBudget, undo, redo } = useUndoRedo<BudgetGroup[]>(
    () => BUDGET_INIT.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it })) }))
  );
  usePersistence("budget", budget, setBudget);

  const [view, setView] = useState<"detalle" | "resumen">("detalle");

  const [pendingEdit, setPendingEdit] = useState<{ gi: number; ii: number } | null>(null);

  useEffect(() => {
    if (pendingEdit !== null) setPendingEdit(null);
  }, [pendingEdit]);

  const updateDesc = useCallback((gi: number, ii: number, v: string) => {
    setBudget((p) => {
      const n = [...p];
      n[gi] = { ...n[gi], items: [...n[gi].items] };
      n[gi].items[ii] = { ...n[gi].items[ii], d: v };
      return n;
    });
  }, [setBudget]);

  const updateCU = useCallback((gi: number, ii: number, v: number) => {
    setBudget((p) => {
      const n = [...p];
      n[gi] = { ...n[gi], items: [...n[gi].items] };
      n[gi].items[ii] = { ...n[gi].items[ii], cu: v };
      return n;
    });
  }, [setBudget]);

  const updateMet = useCallback((gi: number, ii: number, v: number) => {
    setBudget((p) => {
      const n = [...p];
      n[gi] = { ...n[gi], items: [...n[gi].items] };
      n[gi].items[ii] = { ...n[gi].items[ii], m: v };
      return n;
    });
  }, [setBudget]);

  const addItem = useCallback((gi: number, currentLen: number) => {
    setPendingEdit({ gi, ii: currentLen });
    setBudget((p) => {
      const n = [...p];
      n[gi] = { ...n[gi], items: [...n[gi].items, { d: "Nuevo item", u: "Gbl.", m: 1, cu: 0 }] };
      return n;
    });
  }, [setBudget]);

  const delItem = useCallback((gi: number, ii: number) => {
    setBudget((p) => {
      const n = [...p];
      n[gi] = { ...n[gi], items: n[gi].items.filter((_, x) => x !== ii) };
      return n;
    });
  }, [setBudget]);

  const syncArea = useCallback((gi: number, newArea: number) => {
    setBudget((p) => {
      const n = [...p];
      const group = { ...n[gi], areaM2: +newArea.toFixed(2) };
      group.items = group.items.map((it) =>
        it.factor != null
          ? { ...it, m: +(newArea * it.factor).toFixed(2) }
          : it
      );
      n[gi] = group;
      return n;
    });
  }, [setBudget]);

  const updateFactor = useCallback((gi: number, ii: number, factor: number) => {
    setBudget((p) => {
      const n = [...p];
      const area = n[gi].areaM2 ?? 0;
      n[gi] = { ...n[gi], items: [...n[gi].items] };
      n[gi].items[ii] = { ...n[gi].items[ii], factor, m: +(area * factor).toFixed(2) };
      return n;
    });
  }, [setBudget]);

  const updateCat = useCallback((gi: number, newName: string) => {
    setBudget((p) => {
      const n = [...p];
      n[gi] = { ...n[gi], cat: newName };
      return n;
    });
  }, [setBudget]);

  // Sync insumo prices from context → budget items
  const prevPricesRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const priceMap = new Map(insumos.map((i) => [i.id, i.precio]));
    const prev = prevPricesRef.current;
    const changed: string[] = [];
    for (const [id, precio] of priceMap) {
      if (prev.has(id) && prev.get(id) !== precio) changed.push(id);
    }
    prevPricesRef.current = priceMap;
    if (changed.length === 0) return;
    setBudget((b) =>
      b.map((g) => ({
        ...g,
        items: g.items.map((it) =>
          it.insumoId && changed.includes(it.insumoId)
            ? { ...it, cu: priceMap.get(it.insumoId)! }
            : it
        ),
      }))
    );
  }, [insumos, setBudget]);

  const grandTotal = budget.reduce((s, g) => s + g.items.reduce((ss, it) => ss + it.m * it.cu, 0), 0);

  const btnBase = "inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-text-mid shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-muted transition-all duration-200 cursor-pointer";

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={fmtS(grandTotal)} label="TOTAL PRESUPUESTO" color="#059669" />
        <StatCard
          value={budget.reduce((s, g) => s + g.items.length, 0)}
          label={`items en ${budget.length} partidas`}
          color="#2563EB"
        />
      </div>

      {/* View toggle + export buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setView("detalle")}
            className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              view === "detalle"
                ? "bg-[#1E293B] text-white"
                : "bg-card text-text-mid hover:bg-muted"
            }`}
          >
            Detalle
          </button>
          <button
            onClick={() => setView("resumen")}
            className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              view === "resumen"
                ? "bg-[#1E293B] text-white"
                : "bg-card text-text-mid hover:bg-muted"
            }`}
          >
            Resumen S10
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => goTo("insumos")} className={btnBase}>
            <Package className="h-3.5 w-3.5" />
            Insumos
          </button>
          <button onClick={() => activeProject && exportBudgetCSV(budget, activeProject)} className={btnBase}>
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button onClick={() => activeProject && exportBudgetXLS(budget, activeProject)} className={btnBase}>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </button>
          <button onClick={() => activeProject && exportBudgetPDF(budget, activeProject)} className={btnBase}>
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
          <button onClick={() => activeProject && exportInsumosPDF(budget, insumos, floors, activeProject)} className={btnBase}>
            <ClipboardList className="h-3.5 w-3.5" />
            Insumos PDF
          </button>
        </div>
      </div>

      {/* View: Resumen S10 */}
      {view === "resumen" && (
        <ResumenS10
          budget={budget}
          onUpdateDesc={updateDesc}
          onUpdateCU={updateCU}
          onUpdateMet={updateMet}
          onUpdateFactor={updateFactor}
          onAddItem={addItem}
          onDelItem={delItem}
          onSyncArea={syncArea}
          undo={undo}
          redo={redo}
        />
      )}

      {/* View: Detalle */}
      {view === "detalle" && (
        <>
          <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 text-xs text-text-mid">
            <b className="text-text">Editable:</b> Click en celda → seleccionar · Doble-click → editar · Tab navega entre celdas · Ctrl+Z/Y para deshacer/rehacer
          </div>

          {/* Budget categories */}
          {budget.map((g, gi) => {
            const sub = g.items.reduce((s, it) => s + it.m * it.cu, 0);
            const itemCount = g.items.length;
            const hasFactor = g.areaM2 != null;
            const cuCol = hasFactor ? 5 : 4;

            return (
              <div key={gi} className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#1E293B] flex justify-between items-center flex-wrap gap-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EditableCatName value={g.cat} onChange={(v) => updateCat(gi, v)} />
                      <AreaBadge group={g} gi={gi} onSync={syncArea} />
                    </div>
                    {g.link && (
                      <button
                        onClick={() => goTo(g.link!)}
                        className="text-white/60 text-xs underline cursor-pointer hover:text-white/90"
                      >
                        Ver metrado →
                      </button>
                    )}
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    <FlashValue value={sub} format={(v) => fmtS(Number(v))} />
                  </div>
                </div>
                <div className="p-2">
                  <SpreadsheetProvider
                    rows={itemCount}
                    cols={hasFactor ? 7 : 6}
                    isCellEditable={(row, col) => {
                      // Block cu column for items linked to catalog
                      if (col === cuCol && g.items[row]?.insumoId) return false;
                      if (!hasFactor) return EDITABLE_COLS.has(col);
                      if (col === 3) return g.items[row]?.factor != null;
                      if (col === 4) return g.items[row]?.factor == null;
                      return col === 1 || col === 5;
                    }}
                    onUndo={undo}
                    onRedo={redo}
                  >
                    <Table className="spreadsheet-table">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-7 bg-muted text-text-mid" />
                          <TableHead className="text-left bg-muted text-text-mid">Descripción</TableHead>
                          <TableHead className="w-[50px] bg-muted text-text-mid">Und.</TableHead>
                          {hasFactor && (
                            <TableHead className="w-[65px] bg-muted text-text-mid">Factor</TableHead>
                          )}
                          <TableHead className="w-[70px] bg-muted text-text-mid">Metrado</TableHead>
                          <TableHead className="w-[75px] bg-muted text-text-mid">C.Unit</TableHead>
                          <TableHead className="w-[85px] text-right bg-muted text-text-mid">C.Parcial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {g.items.map((it, ii) => {
                          const cp2 = it.m * it.cu;
                          const hasItemFactor = it.factor != null;
                          const isLinked = !!it.insumoId;

                          if (hasFactor) {
                            return (
                              <TableRow key={ii} className={ii % 2 === 0 ? "bg-muted/50" : ""}>
                                <TableCell className="text-center p-0.5">
                                  <button
                                    onClick={() => delItem(gi, ii)}
                                    className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </TableCell>
                                <TableCell className="p-0.5">
                                  <EditCell
                                    value={it.d}
                                    onChange={(v) => updateDesc(gi, ii, v as string)}
                                    type="text"
                                    row={ii}
                                    col={1}
                                    className="text-xs text-left"
                                    autoEdit={pendingEdit?.gi === gi && pendingEdit?.ii === ii}
                                  />
                                </TableCell>
                                <TableCell className="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                                <TableCell className="p-0.5">
                                  {hasItemFactor ? (
                                    <EditCell
                                      value={it.factor!}
                                      onChange={(v) => updateFactor(gi, ii, v as number)}
                                      row={ii}
                                      col={3}
                                      className="text-right text-amber-600 dark:text-amber-400 font-semibold"
                                    />
                                  ) : (
                                    <span className="block text-center text-text-soft text-[11px] cell-readonly">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="p-0.5">
                                  {hasItemFactor ? (
                                    <span className="block text-right text-primary font-semibold text-xs px-1.5 py-0.5 rounded bg-emerald-500/10">
                                      <FlashValue value={it.m} format={(v) => String(v)} />
                                    </span>
                                  ) : (
                                    <EditCell
                                      value={it.m}
                                      onChange={(v) => updateMet(gi, ii, v as number)}
                                      row={ii}
                                      col={4}
                                      className="text-right text-primary font-semibold"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="p-0.5">
                                  {isLinked ? (
                                    <Tooltip content="Precio de catálogo — editar en Insumos">
                                      <span className="relative block text-right text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold cell-readonly">
                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <FlashValue value={it.cu} format={(v) => String(v)} />
                                      </span>
                                    </Tooltip>
                                  ) : (
                                    <EditCell
                                      value={it.cu}
                                      onChange={(v) => updateCU(gi, ii, v as number)}
                                      row={ii}
                                      col={5}
                                      className="text-right text-steel-58 font-semibold"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary px-2">
                                  <FlashValue value={cp2} format={(v) => fmtS(Number(v))} />
                                </TableCell>
                              </TableRow>
                            );
                          }

                          // Layout without Factor column
                          return (
                            <TableRow key={ii} className={ii % 2 === 0 ? "bg-muted/50" : ""}>
                              <TableCell className="text-center p-0.5">
                                <button
                                  onClick={() => delItem(gi, ii)}
                                  className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </TableCell>
                              <TableCell className="p-0.5">
                                <EditCell
                                  value={it.d}
                                  onChange={(v) => updateDesc(gi, ii, v as string)}
                                  type="text"
                                  row={ii}
                                  col={1}
                                  className="text-xs text-left"
                                  autoEdit={pendingEdit?.gi === gi && pendingEdit?.ii === ii}
                                />
                              </TableCell>
                              <TableCell className="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                              <TableCell className="p-0.5">
                                <EditCell
                                  value={it.m}
                                  onChange={(v) => updateMet(gi, ii, v as number)}
                                  row={ii}
                                  col={3}
                                  className="text-right text-primary font-semibold"
                                />
                              </TableCell>
                              <TableCell className="p-0.5">
                                {isLinked ? (
                                  <Tooltip content="Precio de catálogo — editar en Insumos">
                                    <span className="relative block text-right text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold cell-readonly">
                                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                      <FlashValue value={it.cu} format={(v) => String(v)} />
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <EditCell
                                    value={it.cu}
                                    onChange={(v) => updateCU(gi, ii, v as number)}
                                    row={ii}
                                    col={4}
                                    className="text-right text-steel-58 font-semibold"
                                  />
                                )}
                              </TableCell>
                              <TableCell className="text-right font-bold text-primary px-2">
                                <FlashValue value={cp2} format={(v) => fmtS(Number(v))} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </SpreadsheetProvider>
                  <button
                    onClick={() => addItem(gi, g.items.length)}
                    className="w-full py-2 mt-1.5 bg-muted border-2 border-dashed border-border rounded-xl text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
                  >
                    ＋ Agregar item
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
