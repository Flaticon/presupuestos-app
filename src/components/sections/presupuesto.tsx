import { useState, useCallback, useEffect, useRef } from "react";
import { BUDGET_INIT } from "@/data/budget-data";
import { BUDGET_FORMULAS } from "@/data/budget-formulas";
import type { BudgetItem, BudgetGroup, BudgetSection } from "@/lib/types";
import { updateGroup, flatGroups } from "@/lib/budget-helpers";
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
import { Download, FileSpreadsheet, FileText, RefreshCw, Package, ClipboardList, Trash2, Plus, Unlink } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { InsumoPicker } from "@/components/shared/insumo-picker";

interface PresupuestoProps {
  goTo: (id: string) => void;
}

// Budget table cols WITHOUT factor: 0=del, 1=Desc, 2=Und, 3=Metrado, 4=C.Unit, 5=C.Parcial
const EDITABLE_COLS = new Set([1, 3, 4]);

function AreaBadge({ group, si, gi, onSync }: { group: BudgetGroup; si: number; gi: number; onSync?: (si: number, gi: number, newArea: number) => void }) {
  const sectionData = useSectionData();

  if (!group.areaM2 || !group.areaSource) return null;

  const formula = BUDGET_FORMULAS[group.id];
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
              onClick={() => onSync(si, gi, calcArea!)}
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

function EditableSectionTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
        className="text-sm font-bold text-white cursor-pointer hover:text-white/80"
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
      className="text-sm font-bold text-white bg-white/10 border border-white/30 rounded px-1.5 py-0.5 outline-none min-w-[250px]"
    />
  );
}

/** If persisted data is the old flat BudgetGroup[] format, return null to use defaults */
function migrateBudget(data: unknown): BudgetSection[] | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  // New format has `groups` array on each element; old format has `items` directly
  if (!data[0].groups) return null; // old format → discard, use defaults

  // Build a lookup from BUDGET_INIT to merge missing structural fields
  const initMap = new Map<string, BudgetGroup>();
  for (const sec of BUDGET_INIT) {
    for (const g of sec.groups) initMap.set(g.id, g);
  }

  const sections = data as BudgetSection[];
  for (const sec of sections) {
    for (let i = 0; i < sec.groups.length; i++) {
      const g = sec.groups[i];
      const init = initMap.get(g.id);
      if (init) {
        // Merge fields that may have been added after initial save
        if (g.areaM2 == null && init.areaM2 != null) g.areaM2 = init.areaM2;
        if (!g.areaSource && init.areaSource) g.areaSource = init.areaSource;
        if (!g.metradoUnit && init.metradoUnit) g.metradoUnit = init.metradoUnit;
        if (!g.link && init.link) g.link = init.link;
      }
    }
  }
  return sections;
}

function deepCloneSections(sections: BudgetSection[]): BudgetSection[] {
  return sections.map((s) => ({
    ...s,
    groups: s.groups.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it })) })),
  }));
}

export function Presupuesto({ goTo }: PresupuestoProps) {
  const { activeProject } = useProject();
  const { insumos } = useInsumos();
  const { floors } = useFloors();
  const { state: budget, setState: setBudget, undo, redo } = useUndoRedo<BudgetSection[]>(
    () => deepCloneSections(BUDGET_INIT)
  );
  usePersistence("budget", budget, setBudget, migrateBudget);

  const [view, setView] = useState<"detalle" | "resumen">("detalle");

  const [pendingEdit, setPendingEdit] = useState<{ si: number; gi: number; ii: number } | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  useEffect(() => {
    if (pendingEdit !== null) setPendingEdit(null);
  }, [pendingEdit]);

  const updateDesc = useCallback((si: number, gi: number, ii: number, v: string) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g,
      items: g.items.map((it, k) => (k === ii ? { ...it, d: v } : it)),
    })));
  }, [setBudget]);

  const updateCU = useCallback((si: number, gi: number, ii: number, v: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g,
      items: g.items.map((it, k) => (k === ii ? { ...it, cu: v } : it)),
    })));
  }, [setBudget]);

  const updateMet = useCallback((si: number, gi: number, ii: number, v: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g,
      items: g.items.map((it, k) => (k === ii ? { ...it, m: v } : it)),
    })));
  }, [setBudget]);

  const addItem = useCallback((si: number, gi: number, currentLen: number, item?: BudgetItem) => {
    setPendingEdit({ si, gi, ii: currentLen });
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g,
      items: [...g.items, item ?? { d: "Nuevo item", u: "Gbl.", m: 1, cu: 0 }],
    })));
  }, [setBudget]);

  const delItem = useCallback((si: number, gi: number, ii: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g,
      items: g.items.filter((_, x) => x !== ii),
    })));
  }, [setBudget]);

  const syncArea = useCallback((si: number, gi: number, newArea: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const group = { ...g, areaM2: +newArea.toFixed(2) };
      group.items = group.items.map((it) =>
        it.factor != null
          ? { ...it, m: +(newArea * it.factor).toFixed(2) }
          : it
      );
      return group;
    }));
  }, [setBudget]);

  const updateFactor = useCallback((si: number, gi: number, ii: number, factor: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const area = g.areaM2 ?? 0;
      return {
        ...g,
        items: g.items.map((it, k) =>
          k === ii ? { ...it, factor, m: +(area * factor).toFixed(2) } : it
        ),
      };
    }));
  }, [setBudget]);

  const toggleItemFactor = useCallback((si: number, gi: number, ii: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const area = g.areaM2 ?? 0;
      return {
        ...g,
        items: g.items.map((it, k) => {
          if (k !== ii) return it;
          if (it.factor != null) {
            // Remove factor → keep current m, make manual
            const { factor: _f, ...rest } = it;
            return rest;
          }
          // Add factor: compute from current values
          const defaultFactor = area > 0 && it.m > 0 ? +(it.m / area).toFixed(4) : 1;
          return { ...it, factor: defaultFactor, m: +(area * defaultFactor).toFixed(2) };
        }),
      };
    }));
  }, [setBudget]);

  const updateArea = useCallback((si: number, gi: number, newArea: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const group = { ...g, areaM2: +newArea.toFixed(2) };
      group.items = group.items.map((it) =>
        it.factor != null
          ? { ...it, m: +(newArea * it.factor).toFixed(2) }
          : it
      );
      return group;
    }));
  }, [setBudget]);

  const toggleAreaSource = useCallback((si: number, gi: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      if (!g.areaSource) return { ...g, areaM2: 0, areaSource: { type: "manual", nota: "Metrado manual" } };
      const newType = g.areaSource.type === "manual" ? "auto" : "manual";
      return { ...g, areaSource: { ...g.areaSource, type: newType } };
    }));
  }, [setBudget]);

  const updateCat = useCallback((si: number, gi: number, newName: string) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({ ...g, cat: newName })));
  }, [setBudget]);

  const updateSectionTitle = useCallback((si: number, newTitle: string) => {
    setBudget((p) => p.map((s, i) => (i === si ? { ...s, title: newTitle } : s)));
  }, [setBudget]);

  // Add a new section at the end
  const addSection = useCallback(() => {
    setBudget((p) => [
      ...p,
      {
        id: `sec-${Date.now()}`,
        title: `${p.length + 1}. NUEVA PARTIDA`,
        groups: [
          {
            id: `grp-${Date.now()}`,
            cat: `${p.length + 1}.1 Nueva sub-partida`,
            items: [{ d: "Nuevo item", u: "Gbl.", m: 1, cu: 0 }],
          },
        ],
      },
    ]);
  }, [setBudget]);

  // Delete a section
  const delSection = useCallback((si: number) => {
    setBudget((p) => p.filter((_, i) => i !== si));
  }, [setBudget]);

  // Add a sub-partida (group) to a section
  const addGroup = useCallback((si: number) => {
    setBudget((p) =>
      p.map((s, i) =>
        i === si
          ? {
              ...s,
              groups: [
                ...s.groups,
                {
                  id: `grp-${Date.now()}`,
                  cat: `${s.title.split(".")[0]}.${s.groups.length + 1} Nueva sub-partida`,
                  items: [{ d: "Nuevo item", u: "Gbl.", m: 1, cu: 0 }],
                },
              ],
            }
          : s,
      ),
    );
  }, [setBudget]);

  // Delete a group from a section
  const delGroup = useCallback((si: number, gi: number) => {
    setBudget((p) =>
      p.map((s, i) =>
        i === si
          ? { ...s, groups: s.groups.filter((_, j) => j !== gi) }
          : s,
      ),
    );
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
      b.map((s) => ({
        ...s,
        groups: s.groups.map((g) => ({
          ...g,
          items: g.items.map((it) =>
            it.insumoId && changed.includes(it.insumoId)
              ? { ...it, cu: priceMap.get(it.insumoId)! }
              : it
          ),
        })),
      }))
    );
  }, [insumos, setBudget]);

  const allGroups = flatGroups(budget);
  const grandTotal = allGroups.reduce(
    (s, g) => s + g.items.reduce((ss, it) => ss + it.m * it.cu, 0),
    0,
  );
  const totalItems = allGroups.reduce((s, g) => s + g.items.length, 0);
  const totalGroups = allGroups.length;

  const btnBase = "inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-text-mid shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-muted transition-all duration-200 cursor-pointer";

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={fmtS(grandTotal)} label="TOTAL PRESUPUESTO" color="#059669" />
        <StatCard
          value={totalItems}
          label={`items en ${totalGroups} sub-partidas · ${budget.length} partidas`}
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
          onToggleItemFactor={toggleItemFactor}
          onAddItem={addItem}
          onDelItem={delItem}
          onSyncArea={syncArea}
          onUpdateArea={updateArea}
          onToggleAreaSource={toggleAreaSource}
          undo={undo}
          redo={redo}
          goTo={goTo}
        />
      )}

      {/* View: Detalle */}
      {view === "detalle" && (
        <>
          <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 text-xs text-text-mid">
            <b className="text-text">Editable:</b> Click en celda → seleccionar · Doble-click → editar · Tab navega entre celdas · Ctrl+Z/Y para deshacer/rehacer
          </div>

          {/* Budget sections */}
          {budget.map((section, si) => {
            const sectionTotal = section.groups.reduce(
              (s, g) => s + g.items.reduce((ss, it) => ss + it.m * it.cu, 0),
              0,
            );

            return (
              <div key={section.id} className="space-y-2">
                {/* Section header */}
                <div className="rounded-2xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-4 py-3 flex justify-between items-center">
                  <EditableSectionTitle
                    value={section.title}
                    onChange={(v) => updateSectionTitle(si, v)}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-white">
                      <FlashValue value={sectionTotal} format={(v) => fmtS(Number(v))} />
                    </span>
                    <Tooltip content="Eliminar partida completa">
                      <button
                        onClick={() => delSection(si)}
                        className="text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Groups (sub-partidas) within section */}
                {section.groups.map((g, gi) => {
                  const sub = g.items.reduce((s, it) => s + it.m * it.cu, 0);
                  const itemCount = g.items.length;
                  const hasFactor = g.areaM2 != null;
                  const cuCol = hasFactor ? 5 : 4;

                  return (
                    <div key={g.id} className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ml-4">
                      <div className="px-4 py-2.5 bg-[#1E293B] flex justify-between items-center flex-wrap gap-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <EditableCatName value={g.cat} onChange={(v) => updateCat(si, gi, v)} />
                            <AreaBadge group={g} si={si} gi={gi} onSync={syncArea} />
                          </div>
                          {g.link && ["columnas", "vigas", "losa", "muros", "escalera"].includes(g.link) && (
                            <button
                              onClick={() => goTo(g.link!)}
                              className="text-white/60 text-xs underline cursor-pointer hover:text-white/90"
                            >
                              Ver metrado →
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-extrabold text-white">
                            <FlashValue value={sub} format={(v) => fmtS(Number(v))} />
                          </div>
                          {section.groups.length > 1 && (
                            <Tooltip content="Eliminar sub-partida">
                              <button
                                onClick={() => delGroup(si, gi)}
                                className="text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </Tooltip>
                          )}
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
                                          onClick={() => delItem(si, gi, ii)}
                                          className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </TableCell>
                                      <TableCell className="p-0.5">
                                        <EditCell
                                          value={it.d}
                                          onChange={(v) => updateDesc(si, gi, ii, v as string)}
                                          type="text"
                                          row={ii}
                                          col={1}
                                          className="text-xs text-left"
                                          autoEdit={pendingEdit?.si === si && pendingEdit?.gi === gi && pendingEdit?.ii === ii}
                                        />
                                      </TableCell>
                                      <TableCell className="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                                      <TableCell className="p-0.5">
                                        {hasItemFactor ? (
                                          <div className="flex items-center gap-0.5">
                                            <EditCell
                                              value={it.factor!}
                                              onChange={(v) => updateFactor(si, gi, ii, v as number)}
                                              row={ii}
                                              col={3}
                                              className="text-right text-amber-600 dark:text-amber-400 font-semibold flex-1"
                                            />
                                            <button
                                              onClick={() => toggleItemFactor(si, gi, ii)}
                                              className="text-amber-400 hover:text-red-400 cursor-pointer p-0.5"
                                              title="Desenlazar"
                                            >
                                              <Unlink size={9} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => toggleItemFactor(si, gi, ii)}
                                            className="block w-full text-center text-[11px] py-0.5 rounded transition-colors text-text-soft hover:bg-amber-500/10 hover:text-amber-600 cursor-pointer"
                                          >
                                            + enlazar
                                          </button>
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
                                            onChange={(v) => updateMet(si, gi, ii, v as number)}
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
                                            onChange={(v) => updateCU(si, gi, ii, v as number)}
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
                                        onClick={() => delItem(si, gi, ii)}
                                        className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </TableCell>
                                    <TableCell className="p-0.5">
                                      <EditCell
                                        value={it.d}
                                        onChange={(v) => updateDesc(si, gi, ii, v as string)}
                                        type="text"
                                        row={ii}
                                        col={1}
                                        className="text-xs text-left"
                                        autoEdit={pendingEdit?.si === si && pendingEdit?.gi === gi && pendingEdit?.ii === ii}
                                      />
                                    </TableCell>
                                    <TableCell className="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                                    <TableCell className="p-0.5">
                                      <EditCell
                                        value={it.m}
                                        onChange={(v) => updateMet(si, gi, ii, v as number)}
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
                                          onChange={(v) => updateCU(si, gi, ii, v as number)}
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
                        <div className="relative mt-1.5">
                          {pickerKey === `${si}-${gi}` && (
                            <InsumoPicker
                              onSelect={(item: BudgetItem) => {
                                addItem(si, gi, g.items.length, item);
                                setPickerKey(null);
                              }}
                              onCancel={() => setPickerKey(null)}
                            />
                          )}
                          <button
                            onClick={() => setPickerKey(pickerKey === `${si}-${gi}` ? null : `${si}-${gi}`)}
                            className="w-full py-2 bg-muted border-2 border-dashed border-border rounded-xl text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
                          >
                            ＋ Agregar insumo o item
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add sub-partida button */}
                <button
                  onClick={() => addGroup(si)}
                  className="ml-4 w-[calc(100%-1rem)] py-2 bg-muted/50 border-2 border-dashed border-border rounded-xl text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} />
                  Agregar sub-partida
                </button>
              </div>
            );
          })}

          {/* Add new section button */}
          <button
            onClick={addSection}
            className="w-full py-3 bg-muted/50 border-2 border-dashed border-border rounded-2xl text-text-mid text-xs font-semibold hover:bg-primary-bg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            Nueva Partida
          </button>
        </>
      )}
    </div>
  );
}
