import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
import { LOSA_PANOS_INIT } from "@/data/losa-data";
import type { PanoLosa } from "@/lib/types";
import { usePublishSection } from "@/lib/section-data-context";
import type { LosaFloorAgg } from "@/lib/section-data-context";
import { useFloors } from "@/lib/floor-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { usePersistence } from "@/hooks/use-persistence";
import { SlabDiagram } from "@/components/diagrams/slab-diagram";
import { FloorPicker } from "@/components/shared/floor-picker";

// Cols: 0=del, 1=Paño, 2=Ejes, 3=Área, 4=N°Vig, 5=Dbl, 6=Vol, 7=Ladr
const EDITABLE_COLS = new Set([1, 2, 3, 4]);
const COL_FIELDS: (keyof PanoLosa | null)[] = [null, "p", "ej", "area", "nv", "dv", "vol", "lad"];

export function Losa() {
  const { state: panos, setState: setPanos, undo, redo } = useUndoRedo<PanoLosa[]>(
    () => LOSA_PANOS_INIT.map((p) => ({ ...p }))
  );
  usePersistence("losa", panos, setPanos, (data) => {
    if (!Array.isArray(data)) return null;
    return (data as PanoLosa[]).map((p) => ({ ...p, piso: p.piso ?? "3er-piso" }));
  });

  const [maciza, setMaciza] = createSignal<Record<string, number>>({ "3er-piso": 16.91 });
  const macizaAccessor = maciza;
  usePersistence("losa-maciza", macizaAccessor, setMaciza);

  const { floors } = useFloors();
  const [pendingEditRow, setPendingEditRow] = createSignal<number | null>(null);
  const [pisoFilter, setPisoFilter] = createSignal("todos");

  createEffect(() => {
    if (pendingEditRow() !== null) setPendingEditRow(null);
  });

  const floorTabs = () => {
    const pisos = new Set(panos().map((p) => p.piso));
    const allFloors = floors();
    const tabs: { id: string; label: string }[] = [{ id: "todos", label: "Todos" }];
    for (const f of allFloors) {
      if (pisos.has(f.id)) tabs.push({ id: f.id, label: f.label });
    }
    for (const p of pisos) {
      if (!tabs.find((t) => t.id === p)) tabs.push({ id: p, label: p });
    }
    return tabs;
  };

  const filtered = () => pisoFilter() === "todos" ? panos() : panos().filter((p) => p.piso === pisoFilter());
  const realIndices = () => filtered().map((fp) => panos().indexOf(fp));

  const tA = () => filtered().reduce((s, p) => s + p.area, 0);
  const tV = () => filtered().reduce((s, p) => s + p.vol, 0);
  const tL = () => filtered().reduce((s, p) => s + p.lad, 0);

  const publish = usePublishSection();
  const losaAgg = createMemo(() => {
    const byFloor: Record<string, LosaFloorAgg> = {};
    for (const p of panos()) {
      const piso = p.piso || "3er-piso";
      if (!byFloor[piso]) byFloor[piso] = { areaTotal: 0, volTotal: 0, ladrillos: 0 };
      byFloor[piso].areaTotal += p.area;
      byFloor[piso].volTotal += p.vol;
      byFloor[piso].ladrillos += p.lad;
    }
    const m = maciza();
    for (const [piso, areaMaciza] of Object.entries(m)) {
      if (!byFloor[piso]) byFloor[piso] = { areaTotal: 0, volTotal: 0, ladrillos: 0 };
      byFloor[piso].areaTotal += areaMaciza;
    }
    let areaTotal = 0;
    let volTotal = 0;
    let ladrillos = 0;
    for (const k of Object.keys(byFloor)) {
      byFloor[k].areaTotal = +byFloor[k].areaTotal.toFixed(2);
      byFloor[k].volTotal = +byFloor[k].volTotal.toFixed(2);
      areaTotal += byFloor[k].areaTotal;
      volTotal += byFloor[k].volTotal;
      ladrillos += byFloor[k].ladrillos;
    }
    return { areaTotal: +areaTotal.toFixed(2), volTotal: +volTotal.toFixed(2), ladrillos, byFloor };
  });
  createEffect(() => publish("losa", losaAgg()));

  const upd = (i: number, f: keyof PanoLosa, v: string | number) => {
    setPanos((p) => {
      const n = [...p];
      const updated = { ...n[i], [f]: v };
      if (f === "area") {
        const area = Number(updated.area);
        updated.vol = +(area * 0.0875).toFixed(4);
        updated.lad = Math.round(area * 8.33);
      }
      n[i] = updated;
      return n;
    });
  };

  const isCellEditable = (_row: number, col: number) => EDITABLE_COLS.has(col);

  const handleCellChange = (row: number, col: number, value: string | number) => {
    const field = COL_FIELDS[col];
    const ri = realIndices()[row];
    if (field && ri != null) upd(ri, field, value);
  };

  const currentMaciza = () => {
    const piso = pisoFilter() === "todos" ? null : pisoFilter();
    if (!piso) {
      return Object.values(maciza()).reduce((s, v) => s + v, 0);
    }
    return maciza()[piso] ?? 0;
  };

  return (
    <Card>
      <CardHeader class="bg-[#18181B]">
        <CardTitle class="text-white">Losa Aligerada — Metrado + Sistema</CardTitle>
        <CardDescription class="text-white/50">
          Área: {tA().toFixed(0)} m² · Vol: {tV().toFixed(2)} m³ · {tL()} ladrillos
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        {/* Floor tabs */}
        <div class="flex items-center gap-2">
          <div class="inline-flex rounded-lg border border-border overflow-hidden">
            <For each={floorTabs()}>
              {(tab) => (
                <button onClick={() => setPisoFilter(tab.id)}
                  class={`px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${pisoFilter() === tab.id ? "bg-[#18181B] text-white" : "bg-card text-text-mid hover:bg-muted"}`}
                >{tab.label}</button>
              )}
            </For>
          </div>
          <FloorPicker
            existingFloors={[...new Set(panos().map((p) => p.piso))]}
            onAddFloor={(floorId) => {
              setPendingEditRow(panos().length);
              setPanos((p) => [
                ...p,
                { p: "Nuevo", ej: "-", a: 4.0, l: 4.0, area: 16.0, nv: 10, dv: 0, vol: 1.40, lad: 133, piso: floorId },
              ]);
              setPisoFilter(floorId);
            }}
          />
        </div>

        <SlabDiagram />

        <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
          <b>Concreto</b> = Área × 0.0875 m³/m² &nbsp;·&nbsp; <b>Ladrillos</b> = Área × 8.33 und/m²
          <br />
          <span class="text-steel-12">Ø1/2" positivo: 1 barra/vigueta</span> &nbsp;·&nbsp;
          <span class="text-steel-14">Ø1/4" temp: @0.25 transversal</span>
        </div>

        {/* Losa maciza section */}
        <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5">
          <div class="text-xs font-bold text-steel-14 mb-1">Losa Maciza — Área m²</div>
          <Show when={pisoFilter() !== "todos"} fallback={
            <div class="text-xs leading-relaxed">
              <For each={Object.entries(maciza())}>
                {([piso, area]) => (
                  <div>
                    {piso}: <b class="text-steel-14">{area.toFixed(2)} m²</b> · V = {area} × 0.20 = <b>{(area * 0.20).toFixed(2)} m³</b>
                  </div>
                )}
              </For>
            </div>
          }>
            <div class="flex items-center gap-2 text-xs">
              <span>Área maciza {pisoFilter()}:</span>
              <input
                type="number"
                value={(maciza()[pisoFilter()] ?? 0).toFixed(2)}
                onInput={(e) => {
                  const val = parseFloat(e.currentTarget.value);
                  if (!isNaN(val) && val >= 0) {
                    setMaciza((prev) => ({ ...prev, [pisoFilter()]: val }));
                  }
                }}
                class="w-20 text-center border border-border rounded px-1 py-0.5 font-bold text-steel-14"
                step="0.01"
                min="0"
              />
              <span>m² · V = {(maciza()[pisoFilter()] ?? 0).toFixed(2)} × 0.20 = <b class="text-steel-14">{((maciza()[pisoFilter()] ?? 0) * 0.20).toFixed(2)} m³</b></span>
            </div>
          </Show>
        </div>

        <SpreadsheetProvider
          rows={filtered().length}
          cols={8}
          isCellEditable={isCellEditable}
          onCellChange={handleCellChange}
          onUndo={undo}
          onRedo={redo}
        >
          <Table class="min-w-[520px] spreadsheet-table">
            <colgroup>
              <col class="w-[28px]" />{/* del */}
              <col class="w-[64px]" />{/* Paño */}
              <col class="w-[80px]" />{/* Ejes */}
              <col class="w-[70px]" />{/* Área */}
              <col class="w-[52px]" />{/* N°Vig */}
              <col class="w-[44px]" />{/* Dbl */}
              <col class="w-[70px]" />{/* Vol */}
              <col class="w-[60px]" />{/* Ladr */}
            </colgroup>
            <TableHeader>
              <TableRow>
                <For each={["", "Paño", "Ejes", "Área m²", "N°Vig", "Dbl", "Vol m³", "Ladr."]}>
                  {(h) => <TableHead>{h}</TableHead>}
                </For>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={filtered()}>
                {(p, fi) => {
                  const ri = () => realIndices()[fi()];
                  return (
                    <TableRow class={fi() % 2 === 0 ? "bg-muted/30" : ""}>
                      <TableCell class="text-center p-0.5">
                        <button
                          onClick={() => setPanos((pr) => pr.filter((_, x) => x !== ri()))}
                          class="text-text-soft hover:text-danger transition-colors text-sm rounded px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </TableCell>
                      <TableCell class="p-0.5">
                        <EditCell value={p.p} onChange={(v) => upd(ri(), "p", v)} type="text" row={fi()} col={1} class="font-semibold text-left" autoEdit={pendingEditRow() === ri()} />
                      </TableCell>
                      <TableCell class="p-0.5">
                        <EditCell value={p.ej} onChange={(v) => upd(ri(), "ej", v)} type="text" row={fi()} col={2} class="text-left" />
                      </TableCell>
                      <TableCell class="p-0.5">
                        <EditCell value={p.area} onChange={(v) => upd(ri(), "area", v)} row={fi()} col={3} min={0.01} max={500} class="text-center" />
                      </TableCell>
                      <TableCell class="p-0.5">
                        <EditCell value={p.nv} onChange={(v) => upd(ri(), "nv", v)} row={fi()} col={4} min={0} max={200} class="text-center" />
                      </TableCell>
                      <TableCell class="text-center cell-readonly">
                        {p.dv ? (
                          <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-steel-58">SÍ</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell class="text-center font-bold text-primary cell-readonly">
                        <FlashValue value={p.vol} format={(v) => Number(v).toFixed(2)} />
                      </TableCell>
                      <TableCell class="text-center cell-readonly">
                        <FlashValue value={p.lad} format={(v) => String(v)} />
                      </TableCell>
                    </TableRow>
                  );
                }}
              </For>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} class="font-bold text-primary">TOTAL</TableCell>
                <TableCell class="text-center">
                  <FlashValue value={tA()} format={(v) => Number(v).toFixed(1)} />
                </TableCell>
                <TableCell class="text-center">
                  <FlashValue value={filtered().reduce((s, p) => s + p.nv, 0)} format={(v) => String(v)} />
                </TableCell>
                <TableCell />
                <TableCell class="text-center text-primary font-bold">
                  <FlashValue value={tV()} format={(v) => Number(v).toFixed(2)} />
                </TableCell>
                <TableCell class="text-center">
                  <FlashValue value={tL()} format={(v) => String(v)} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </SpreadsheetProvider>

        <button
          onClick={() => {
            const piso = pisoFilter() === "todos" ? "3er-piso" : pisoFilter();
            setPendingEditRow(panos().length);
            setPanos((p) => [
              ...p,
              { p: "Nuevo", ej: "-", a: 4.0, l: 4.0, area: 16.0, nv: 10, dv: 0, vol: 1.40, lad: 133, piso },
            ]);
          }}
          class="w-full py-2 mt-3 bg-transparent border border-dashed border-border/60 rounded-lg text-text-soft hover:text-text-mid text-xs font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
        >
          ＋ Agregar paño
        </button>
      </CardContent>
    </Card>
  );
}
