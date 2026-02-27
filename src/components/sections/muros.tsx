import { useState, useCallback, useEffect, useMemo } from "react";
import { MUROS_INIT, REND, calcMuro } from "@/data/muros-data";
import type { Muro } from "@/lib/types";
import { useFloors } from "@/lib/floor-context";
import { usePublishSection } from "@/lib/section-data-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";

// Cols: 0=del 1=Id 2=Eje 3=Largo 4=Alto 5=hViga 6=Vanos 7=Área 8=Existe 9=ÁreaNueva 10=Lad 11=Mort 12=Cem 13=Arena
const EDITABLE_COLS = new Set([1, 2, 3, 4, 5, 6, 8]);
const COL_FIELDS: (keyof Muro | null)[] = [null, "id", "eje", "largo", "alto", "hViga", "vanos", "area", "existe", "areaNueva", "lad", "mort", "cem", "arena"];
const RECALC_FIELDS = new Set<string>(["largo", "alto", "hViga", "vanos", "existe"]);

function recalc(m: Muro): Muro {
  const res = calcMuro(m.largo, m.alto, m.hViga, m.vanos, m.existe);
  return { ...m, ...res };
}

const sumMuros = (arr: Muro[]) => ({
  area: arr.reduce((s, m) => s + m.area, 0),
  existe: arr.reduce((s, m) => s + m.existe, 0),
  nueva: arr.reduce((s, m) => s + m.areaNueva, 0),
  lad: arr.reduce((s, m) => s + m.lad, 0),
  mort: arr.reduce((s, m) => s + m.mort, 0),
  cem: arr.reduce((s, m) => s + m.cem, 0),
  arena: arr.reduce((s, m) => s + m.arena, 0),
});

export function Muros() {
  const { state: muros, setState: setMuros, undo, redo } = useUndoRedo<Muro[]>(
    () => MUROS_INIT.map((m) => ({ ...m }))
  );
  const [pendingEditRow, setPendingEditRow] = useState<number | null>(null);
  const { floors, activeFloors } = useFloors();

  useEffect(() => {
    if (pendingEditRow !== null) setPendingEditRow(null);
  }, [pendingEditRow]);

  const activeFloorIds = useMemo(() => new Set(activeFloors.map((f) => f.id)), [activeFloors]);

  // Filter muros by active floors
  const visibleMuros = useMemo(
    () => muros.filter((m) => activeFloorIds.has(m.nivel)),
    [muros, activeFloorIds]
  );

  // Group by floor
  const floorGroups = useMemo(() => {
    const groups: { floor: typeof floors[0]; muros: Muro[]; globalIndices: number[] }[] = [];
    for (const floor of floors) {
      if (!activeFloorIds.has(floor.id)) continue;
      const floorMuros: Muro[] = [];
      const indices: number[] = [];
      muros.forEach((m, i) => {
        if (m.nivel === floor.id) {
          floorMuros.push(m);
          indices.push(i);
        }
      });
      if (floorMuros.length > 0 || activeFloorIds.has(floor.id)) {
        groups.push({ floor, muros: floorMuros, globalIndices: indices });
      }
    }
    return groups;
  }, [muros, floors, activeFloorIds]);

  // Subtotals per floor
  const floorSums = useMemo(
    () => floorGroups.map((g) => ({ floor: g.floor, sum: sumMuros(g.muros) })),
    [floorGroups]
  );

  // Totals across active floors
  const totals = useMemo(() => sumMuros(visibleMuros), [visibleMuros]);

  // Publish aggregates to section data bus
  const publish = usePublishSection();
  useEffect(() => {
    const byFloor: Record<string, { areaBruta: number; areaNueva: number; lad: number; mort: number; cem: number; arena: number }> = {};
    for (const g of floorGroups) {
      const s = sumMuros(g.muros);
      byFloor[g.floor.id] = {
        areaBruta: s.area,
        areaNueva: s.nueva,
        lad: s.lad,
        mort: s.mort,
        cem: s.cem,
        arena: s.arena,
      };
    }
    publish("muros", { byFloor });
  }, [floorGroups, publish]);

  // Build a flat row list with separators for the table
  const flatRows = useMemo(() => {
    const rows: { type: "separator"; floor: typeof floors[0]; sum: ReturnType<typeof sumMuros> }[] |
                { type: "muro"; muro: Muro; globalIdx: number }[] = [];
    const result: ({ type: "separator"; floor: typeof floors[0]; sum: ReturnType<typeof sumMuros> } |
                   { type: "subtotal"; floor: typeof floors[0]; sum: ReturnType<typeof sumMuros> } |
                   { type: "muro"; muro: Muro; globalIdx: number })[] = [];

    for (let gi = 0; gi < floorGroups.length; gi++) {
      const g = floorGroups[gi];
      const s = floorSums[gi].sum;

      // Separator header for this floor
      result.push({ type: "separator", floor: g.floor, sum: s });

      // Muro rows
      for (let mi = 0; mi < g.muros.length; mi++) {
        result.push({ type: "muro", muro: g.muros[mi], globalIdx: g.globalIndices[mi] });
      }

      // Subtotal row (if more than one floor group)
      if (floorGroups.length > 1) {
        result.push({ type: "subtotal", floor: g.floor, sum: s });
      }
    }

    return result;
  }, [floorGroups, floorSums]);

  const upd = useCallback((i: number, f: keyof Muro, v: string | number) => {
    setMuros((prev) => {
      const n = [...prev];
      const updated = { ...n[i], [f]: v };
      n[i] = RECALC_FIELDS.has(f) ? recalc(updated) : updated;
      return n;
    });
  }, [setMuros]);

  const isCellEditable = useCallback(
    (_row: number, col: number) => EDITABLE_COLS.has(col),
    []
  );

  const handleCellChange = useCallback(
    (row: number, col: number, value: string | number) => {
      // row here is the flat index among muro-type rows only
      const muroRows = flatRows.filter((r) => r.type === "muro") as { type: "muro"; muro: Muro; globalIdx: number }[];
      if (row >= 0 && row < muroRows.length) {
        const field = COL_FIELDS[col];
        if (field) upd(muroRows[row].globalIdx, field, value);
      }
    },
    [flatRows, upd]
  );

  // Summary line
  const summaryParts = floorSums.map((fs) => `${fs.floor.shortLabel}: ${fs.sum.nueva.toFixed(1)} m²`).join(" · ");

  return (
    <Card>
      <CardHeader className="bg-[#1E293B]">
        <CardTitle className="text-white">MUROS Y TABIQUERÍA — Metrado</CardTitle>
        <CardDescription className="text-white/60">
          {summaryParts} · <b className="text-white">Total por construir: {totals.nueva.toFixed(1)} m²</b> · {totals.lad} ladrillos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b>Ladrillo King Kong 18 huecos</b> (23×12.5×9 cm) — Asentado de soga <b>e = 14 cm</b>
          <br />
          Rendimientos/m²: &nbsp;
          <span className="text-primary font-bold">{REND.lad} lad</span> · <span className="text-steel-38 font-bold">{REND.mort} m³ mort.</span> · <span className="text-steel-58 font-bold">{REND.cemPorM3} bls/m³</span> · <span className="text-steel-12 font-bold">{REND.arenaPorM3} m³ arena/m³</span>
        </div>

        {activeFloors.length === 0 && (
          <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 text-center">
            No hay niveles activos. Active al menos un nivel en el panel lateral.
          </div>
        )}

        {activeFloors.length > 0 && (
          <SpreadsheetProvider
            rows={visibleMuros.length}
            cols={14}
            isCellEditable={isCellEditable}
            onCellChange={handleCellChange}
            onUndo={undo}
            onRedo={redo}
          >
            <Table className="min-w-[920px] spreadsheet-table">
              <colgroup>
                <col className="w-[26px]" />
                <col className="w-[50px]" />
                <col className="w-[130px]" />
                <col className="w-[56px]" />
                <col className="w-[48px]" />
                <col className="w-[50px]" />
                <col className="w-[56px]" />
                <col className="w-[58px]" />
                <col className="w-[58px]" />
                <col className="w-[62px]" />
                <col className="w-[52px]" />
                <col className="w-[58px]" />
                <col className="w-[52px]" />
                <col className="w-[58px]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  {["", "Muro", "Eje / Ubic.", "Largo", "Alto", "h.Viga", "Vanos", "Área", "Existe", "Nuevam²", "Lad.", "Mort.", "Cem.", "Arena"].map((h) => (
                    <TableHead key={h} className="text-[10px] px-1">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let muroRowIdx = 0;
                  return flatRows.map((row, flatIdx) => {
                    if (row.type === "separator") {
                      return (
                        <TableRow key={`sep-${row.floor.id}`} className="border-t-2" style={{ borderColor: `${row.floor.color}60` }}>
                          <TableCell
                            colSpan={14}
                            className="font-bold text-xs py-1.5 tracking-wide"
                            style={{ backgroundColor: `${row.floor.color}15`, color: row.floor.color }}
                          >
                            {row.floor.label.toUpperCase()}
                            {row.floor.id === "3er-piso" && " — Vigas 30×50, peralte 0.50 m, h=3.50 m"}
                            {row.floor.id === "azotea" && " — Parapetos perimetrales h=1.50 m"}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    if (row.type === "subtotal") {
                      const s = row.sum;
                      return (
                        <TableRow key={`sub-${row.floor.id}`} style={{ backgroundColor: `${row.floor.color}10` }}>
                          <TableCell colSpan={7} className="font-bold text-[11px] py-1" style={{ color: row.floor.color }}>
                            SUBTOTAL {row.floor.shortLabel}
                          </TableCell>
                          <TableCell className="text-center text-[11px] py-1">{s.area.toFixed(1)}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-bold text-[11px] py-1">{s.existe.toFixed(1)}</TableCell>
                          <TableCell className="text-center font-bold text-[11px] py-1" style={{ color: row.floor.color }}>{s.nueva.toFixed(1)}</TableCell>
                          <TableCell className="text-center font-bold text-[11px] py-1">{s.lad}</TableCell>
                          <TableCell className="text-center font-bold text-steel-38 text-[11px] py-1">{s.mort.toFixed(2)}</TableCell>
                          <TableCell className="text-center font-bold text-steel-58 text-[11px] py-1">{s.cem.toFixed(1)}</TableCell>
                          <TableCell className="text-center font-bold text-steel-12 text-[11px] py-1">{s.arena.toFixed(3)}</TableCell>
                        </TableRow>
                      );
                    }

                    // type === "muro"
                    const m = row.muro;
                    const i = row.globalIdx;
                    const currentMuroIdx = muroRowIdx++;

                    return (
                      <TableRow key={i} className={currentMuroIdx % 2 === 0 ? "bg-muted/50" : ""}>
                        <TableCell className="text-center p-0.5">
                          <button
                            onClick={() => setMuros((p) => p.filter((_, x) => x !== i))}
                            className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </TableCell>
                        <TableCell className="p-0.5">
                          <EditCell value={m.id} onChange={(v) => upd(i, "id", v)} type="text" row={currentMuroIdx} col={1} className="font-semibold text-left text-[11px]" autoEdit={pendingEditRow === i} />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <EditCell value={m.eje} onChange={(v) => upd(i, "eje", v)} type="text" row={currentMuroIdx} col={2} className="text-left text-[11px]" />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <EditCell value={m.largo} onChange={(v) => upd(i, "largo", v)} row={currentMuroIdx} col={3} className="text-center text-[11px]" />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <EditCell value={m.alto} onChange={(v) => upd(i, "alto", v)} row={currentMuroIdx} col={4} className="text-center text-[11px]" />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <EditCell value={m.hViga} onChange={(v) => upd(i, "hViga", v)} row={currentMuroIdx} col={5} className="text-center text-steel-58 text-[11px]" />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <EditCell value={m.vanos} onChange={(v) => upd(i, "vanos", v)} row={currentMuroIdx} col={6} className="text-center text-steel-38 text-[11px]" />
                        </TableCell>
                        <TableCell className="text-center cell-readonly">
                          <FlashValue value={m.area} format={(v) => Number(v).toFixed(2)} className="text-[11px]" />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <EditCell value={m.existe} onChange={(v) => upd(i, "existe", v)} row={currentMuroIdx} col={8} className="text-center text-[11px]" />
                          {m.existe > 0 && (
                            <span className="block text-[9px] text-center text-emerald-600 font-bold leading-none">CONST.</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center cell-readonly">
                          <FlashValue value={m.areaNueva} format={(v) => Number(v).toFixed(2)} className="font-bold text-primary text-[11px]" />
                        </TableCell>
                        <TableCell className="text-center cell-readonly">
                          <FlashValue value={m.lad} format={(v) => String(v)} className="font-bold text-[11px]" />
                        </TableCell>
                        <TableCell className="text-center cell-readonly">
                          <FlashValue value={m.mort} format={(v) => Number(v).toFixed(3)} className="text-steel-38 text-[11px]" />
                        </TableCell>
                        <TableCell className="text-center cell-readonly">
                          <FlashValue value={m.cem} format={(v) => Number(v).toFixed(2)} className="text-steel-58 text-[11px]" />
                        </TableCell>
                        <TableCell className="text-center cell-readonly">
                          <FlashValue value={m.arena} format={(v) => Number(v).toFixed(3)} className="text-steel-12 text-[11px]" />
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="font-bold text-primary text-[11px]">TOTAL GENERAL</TableCell>
                  <TableCell className="text-center text-[11px]">
                    <FlashValue value={totals.area} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell className="text-center text-emerald-600 font-bold text-[11px]">
                    <FlashValue value={totals.existe} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary text-[11px]">
                    <FlashValue value={totals.nueva} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell className="text-center font-bold text-[11px]">
                    <FlashValue value={totals.lad} format={(v) => String(v)} />
                  </TableCell>
                  <TableCell className="text-center font-bold text-steel-38 text-[11px]">
                    <FlashValue value={totals.mort} format={(v) => Number(v).toFixed(2)} />
                  </TableCell>
                  <TableCell className="text-center font-bold text-steel-58 text-[11px]">
                    <FlashValue value={totals.cem} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell className="text-center font-bold text-steel-12 text-[11px]">
                    <FlashValue value={totals.arena} format={(v) => Number(v).toFixed(3)} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </SpreadsheetProvider>
        )}

        <div className="flex gap-2 mt-2 flex-wrap">
          {activeFloors.map((floor) => {
            const isDefault3P = floor.id === "3er-piso";
            const defaults = isDefault3P
              ? { alto: 3.50, hViga: 0.50, prefix: "M" }
              : floor.id === "azotea"
              ? { alto: 1.50, hViga: 0, prefix: "AZ" }
              : { alto: 3.00, hViga: 0, prefix: floor.shortLabel.replace(/\s/g, "") };

            return (
              <button
                key={floor.id}
                onClick={() => {
                  const floorMuros = muros.filter((m) => m.nivel === floor.id);
                  const count = floorMuros.length;
                  const def = calcMuro(3.0, defaults.alto, defaults.hViga, 0, 0);
                  // Find insertion point: after last muro of this floor
                  const lastIdx = muros.reduce((last, m, idx) => (m.nivel === floor.id ? idx : last), -1);
                  const insertIdx = lastIdx >= 0 ? lastIdx + 1 : muros.length;
                  setPendingEditRow(insertIdx);
                  setMuros((p) => {
                    const n = [...p];
                    n.splice(insertIdx, 0, {
                      id: `${defaults.prefix}-${String(count + 1).padStart(2, "0")}`,
                      nivel: floor.id,
                      eje: "-",
                      largo: 3.0,
                      alto: defaults.alto,
                      hViga: defaults.hViga,
                      vanos: 0,
                      existe: 0,
                      ...def,
                    });
                    return n;
                  });
                }}
                className="flex-1 min-w-[140px] py-2 border-2 border-dashed rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: `${floor.color}10`,
                  borderColor: `${floor.color}40`,
                  color: floor.color,
                }}
              >
                ＋ Agregar muro {floor.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
