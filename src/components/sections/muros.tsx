import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
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
import { usePersistence } from "@/hooks/use-persistence";

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
  const { state: muros, stateAccessor, setState: setMuros, undo, redo } = useUndoRedo<Muro[]>(
    () => MUROS_INIT.map((m) => ({ ...m }))
  );
  usePersistence("muros", stateAccessor, setMuros, (data) => {
    if (!Array.isArray(data)) return null;
    return (data as Muro[]).map((m: any) => ({ ...m, piso: m.piso ?? m.nivel ?? "3er-piso" }));
  });
  const [pendingEditRow, setPendingEditRow] = createSignal<number | null>(null);
  const { floors, activeFloors } = useFloors();

  createEffect(() => {
    if (pendingEditRow() !== null) setPendingEditRow(null);
  });

  const activeFloorIds = createMemo(() => new Set(activeFloors().map((f) => f.id)));

  const visibleMuros = createMemo(
    () => muros.filter((m) => activeFloorIds().has(m.piso))
  );

  const floorGroups = createMemo(() => {
    const groups: { floor: ReturnType<typeof floors>[0]; muros: Muro[]; globalIndices: number[] }[] = [];
    for (const floor of floors()) {
      if (!activeFloorIds().has(floor.id)) continue;
      const floorMuros: Muro[] = [];
      const indices: number[] = [];
      muros.forEach((m, i) => {
        if (m.piso === floor.id) {
          floorMuros.push(m);
          indices.push(i);
        }
      });
      if (floorMuros.length > 0 || activeFloorIds().has(floor.id)) {
        groups.push({ floor, muros: floorMuros, globalIndices: indices });
      }
    }
    return groups;
  });

  const floorSums = createMemo(
    () => floorGroups().map((g) => ({ floor: g.floor, sum: sumMuros(g.muros) }))
  );

  const totals = createMemo(() => sumMuros(visibleMuros()));

  const publish = usePublishSection();
  createEffect(() => {
    const byFloor: Record<string, { areaBruta: number; areaNueva: number; lad: number; mort: number; cem: number; arena: number }> = {};
    for (const g of floorGroups()) {
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
  });

  const flatRows = createMemo(() => {
    const result: ({ type: "separator"; floor: ReturnType<typeof floors>[0]; sum: ReturnType<typeof sumMuros> } |
                   { type: "subtotal"; floor: ReturnType<typeof floors>[0]; sum: ReturnType<typeof sumMuros> } |
                   { type: "muro"; muro: Muro; globalIdx: number })[] = [];

    for (let gi = 0; gi < floorGroups().length; gi++) {
      const g = floorGroups()[gi];
      const s = floorSums()[gi].sum;

      result.push({ type: "separator", floor: g.floor, sum: s });

      for (let mi = 0; mi < g.muros.length; mi++) {
        result.push({ type: "muro", muro: g.muros[mi], globalIdx: g.globalIndices[mi] });
      }

      if (floorGroups().length > 1) {
        result.push({ type: "subtotal", floor: g.floor, sum: s });
      }
    }

    return result;
  });

  const upd = (i: number, f: keyof Muro, v: string | number) => {
    setMuros((prev) => {
      const n = [...prev];
      const updated = { ...n[i], [f]: v };
      n[i] = RECALC_FIELDS.has(f) ? recalc(updated) : updated;
      return n;
    });
  };

  const isCellEditable = (_row: number, col: number) => EDITABLE_COLS.has(col);

  const handleCellChange = (row: number, col: number, value: string | number) => {
    const muroRows = flatRows().filter((r) => r.type === "muro") as { type: "muro"; muro: Muro; globalIdx: number }[];
    if (row >= 0 && row < muroRows.length) {
      const field = COL_FIELDS[col];
      if (field) upd(muroRows[row].globalIdx, field, value);
    }
  };

  const summaryParts = () => floorSums().map((fs) => `${fs.floor.shortLabel}: ${fs.sum.nueva.toFixed(1)} m²`).join(" · ");

  return (
    <Card>
      <CardHeader class="bg-[#18181B]">
        <CardTitle class="text-white">Muros y Tabiquería — Metrado</CardTitle>
        <CardDescription class="text-white/50">
          {summaryParts()} · <b class="text-white">Total por construir: {totals().nueva.toFixed(1)} m²</b> · {totals().lad} ladrillos
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
          <b>Ladrillo King Kong 18 huecos</b> (23×12.5×9 cm) — Asentado de soga <b>e = 14 cm</b>
          <br />
          Rendimientos/m²: &nbsp;
          <span class="text-primary font-bold">{REND.lad} lad</span> · <span class="text-steel-38 font-bold">{REND.mort} m³ mort.</span> · <span class="text-steel-58 font-bold">{REND.cemPorM3} bls/m³</span> · <span class="text-steel-12 font-bold">{REND.arenaPorM3} m³ arena/m³</span>
        </div>

        <Show when={activeFloors().length === 0}>
          <div class="bg-amber-500/10 rounded-lg border border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 text-center">
            No hay niveles activos. Active al menos un nivel en el panel lateral.
          </div>
        </Show>

        <Show when={activeFloors().length > 0}>
          <SpreadsheetProvider
            rows={visibleMuros().length}
            cols={14}
            isCellEditable={isCellEditable}
            onCellChange={handleCellChange}
            onUndo={undo}
            onRedo={redo}
          >
            <Table class="min-w-[920px] spreadsheet-table">
              <colgroup>
                <col class="w-[26px]" />
                <col class="w-[50px]" />
                <col class="w-[130px]" />
                <col class="w-[56px]" />
                <col class="w-[48px]" />
                <col class="w-[50px]" />
                <col class="w-[56px]" />
                <col class="w-[58px]" />
                <col class="w-[58px]" />
                <col class="w-[62px]" />
                <col class="w-[52px]" />
                <col class="w-[58px]" />
                <col class="w-[52px]" />
                <col class="w-[58px]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <For each={["", "Muro", "Eje / Ubic.", "Largo", "Alto", "h.Viga", "Vanos", "Área", "Existe", "Nuevam²", "Lad.", "Mort.", "Cem.", "Arena"]}>
                    {(h) => <TableHead class="text-[10px] px-1">{h}</TableHead>}
                  </For>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let muroRowIdx = 0;
                  return (
                    <For each={flatRows()}>
                      {(row) => {
                        if (row.type === "separator") {
                          return (
                            <TableRow class="border-t-2" style={{ "border-color": `${row.floor.color}60` }}>
                              <TableCell
                                colSpan={14}
                                class="font-bold text-xs py-1.5 tracking-wide"
                                style={{ "background-color": `${row.floor.color}15`, color: row.floor.color }}
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
                            <TableRow style={{ "background-color": `${row.floor.color}10` }}>
                              <TableCell colSpan={7} class="font-bold text-[11px] py-1" style={{ color: row.floor.color }}>
                                SUBTOTAL {row.floor.shortLabel}
                              </TableCell>
                              <TableCell class="text-center text-[11px] py-1">{s.area.toFixed(1)}</TableCell>
                              <TableCell class="text-center text-emerald-600 font-bold text-[11px] py-1">{s.existe.toFixed(1)}</TableCell>
                              <TableCell class="text-center font-bold text-[11px] py-1" style={{ color: row.floor.color }}>{s.nueva.toFixed(1)}</TableCell>
                              <TableCell class="text-center font-bold text-[11px] py-1">{s.lad}</TableCell>
                              <TableCell class="text-center font-bold text-steel-38 text-[11px] py-1">{s.mort.toFixed(2)}</TableCell>
                              <TableCell class="text-center font-bold text-steel-58 text-[11px] py-1">{s.cem.toFixed(1)}</TableCell>
                              <TableCell class="text-center font-bold text-steel-12 text-[11px] py-1">{s.arena.toFixed(3)}</TableCell>
                            </TableRow>
                          );
                        }

                        // type === "muro"
                        const m = row.muro;
                        const idx = row.globalIdx;
                        const currentMuroIdx = muroRowIdx++;

                        return (
                          <TableRow class={currentMuroIdx % 2 === 0 ? "bg-muted/30" : ""}>
                            <TableCell class="text-center p-0.5">
                              <button
                                onClick={() => setMuros((p) => p.filter((_, x) => x !== idx))}
                                class="text-text-soft hover:text-danger transition-colors text-sm rounded px-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </TableCell>
                            <TableCell class="p-0.5">
                              <EditCell value={m.id} onChange={(v) => upd(idx, "id", v)} type="text" row={currentMuroIdx} col={1} class="font-semibold text-left text-[11px]" autoEdit={pendingEditRow() === idx} />
                            </TableCell>
                            <TableCell class="p-0.5">
                              <EditCell value={m.eje} onChange={(v) => upd(idx, "eje", v)} type="text" row={currentMuroIdx} col={2} class="text-left text-[11px]" />
                            </TableCell>
                            <TableCell class="p-0.5">
                              <EditCell value={m.largo} onChange={(v) => upd(idx, "largo", v)} row={currentMuroIdx} col={3} class="text-center text-[11px]" />
                            </TableCell>
                            <TableCell class="p-0.5">
                              <EditCell value={m.alto} onChange={(v) => upd(idx, "alto", v)} row={currentMuroIdx} col={4} class="text-center text-[11px]" />
                            </TableCell>
                            <TableCell class="p-0.5">
                              <EditCell value={m.hViga} onChange={(v) => upd(idx, "hViga", v)} row={currentMuroIdx} col={5} class="text-center text-steel-58 text-[11px]" />
                            </TableCell>
                            <TableCell class="p-0.5">
                              <EditCell value={m.vanos} onChange={(v) => upd(idx, "vanos", v)} row={currentMuroIdx} col={6} class="text-center text-steel-38 text-[11px]" />
                            </TableCell>
                            <TableCell class="text-center cell-readonly">
                              <FlashValue value={m.area} format={(v) => Number(v).toFixed(2)} class="text-[11px]" />
                            </TableCell>
                            <TableCell class="p-0.5">
                              <EditCell value={m.existe} onChange={(v) => upd(idx, "existe", v)} row={currentMuroIdx} col={8} class="text-center text-[11px]" />
                              <Show when={m.existe > 0}>
                                <span class="block text-[9px] text-center text-emerald-600 font-bold leading-none">CONST.</span>
                              </Show>
                            </TableCell>
                            <TableCell class="text-center cell-readonly">
                              <FlashValue value={m.areaNueva} format={(v) => Number(v).toFixed(2)} class="font-bold text-primary text-[11px]" />
                            </TableCell>
                            <TableCell class="text-center cell-readonly">
                              <FlashValue value={m.lad} format={(v) => String(v)} class="font-bold text-[11px]" />
                            </TableCell>
                            <TableCell class="text-center cell-readonly">
                              <FlashValue value={m.mort} format={(v) => Number(v).toFixed(3)} class="text-steel-38 text-[11px]" />
                            </TableCell>
                            <TableCell class="text-center cell-readonly">
                              <FlashValue value={m.cem} format={(v) => Number(v).toFixed(2)} class="text-steel-58 text-[11px]" />
                            </TableCell>
                            <TableCell class="text-center cell-readonly">
                              <FlashValue value={m.arena} format={(v) => Number(v).toFixed(3)} class="text-steel-12 text-[11px]" />
                            </TableCell>
                          </TableRow>
                        );
                      }}
                    </For>
                  );
                })()}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} class="font-bold text-primary text-[11px]">TOTAL GENERAL</TableCell>
                  <TableCell class="text-center text-[11px]">
                    <FlashValue value={totals().area} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell class="text-center text-emerald-600 font-bold text-[11px]">
                    <FlashValue value={totals().existe} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell class="text-center font-bold text-primary text-[11px]">
                    <FlashValue value={totals().nueva} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell class="text-center font-bold text-[11px]">
                    <FlashValue value={totals().lad} format={(v) => String(v)} />
                  </TableCell>
                  <TableCell class="text-center font-bold text-steel-38 text-[11px]">
                    <FlashValue value={totals().mort} format={(v) => Number(v).toFixed(2)} />
                  </TableCell>
                  <TableCell class="text-center font-bold text-steel-58 text-[11px]">
                    <FlashValue value={totals().cem} format={(v) => Number(v).toFixed(1)} />
                  </TableCell>
                  <TableCell class="text-center font-bold text-steel-12 text-[11px]">
                    <FlashValue value={totals().arena} format={(v) => Number(v).toFixed(3)} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </SpreadsheetProvider>
        </Show>

        <div class="flex gap-2 mt-2 flex-wrap">
          <For each={activeFloors()}>
            {(floor) => {
              const isDefault3P = floor.id === "3er-piso";
              const defaults = isDefault3P
                ? { alto: 3.50, hViga: 0.50, prefix: "M" }
                : floor.id === "azotea"
                ? { alto: 1.50, hViga: 0, prefix: "AZ" }
                : { alto: 3.00, hViga: 0, prefix: floor.shortLabel.replace(/\s/g, "") };

              return (
                <button
                  onClick={() => {
                    const floorMuros = muros.filter((m) => m.piso === floor.id);
                    const count = floorMuros.length;
                    const def = calcMuro(3.0, defaults.alto, defaults.hViga, 0, 0);
                    const lastIdx = muros.reduce((last, m, idx) => (m.piso === floor.id ? idx : last), -1);
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
                  class="flex-1 min-w-[140px] py-2 border border-dashed rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    "background-color": `${floor.color}10`,
                    "border-color": `${floor.color}40`,
                    color: floor.color,
                  }}
                >
                  ＋ Agregar muro {floor.label}
                </button>
              );
            }}
          </For>
        </div>
      </CardContent>
    </Card>
  );
}
