import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
import { VIGAS_INIT } from "@/data/vigas-data";
import type { Viga } from "@/lib/types";
import { usePublishSection } from "@/lib/section-data-context";
import type { VigaFloorAgg } from "@/lib/section-data-context";
import { useFloors } from "@/lib/floor-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { usePersistence } from "@/hooks/use-persistence";
import { FloorPicker } from "@/components/shared/floor-picker";

// Cols: 0=ID, 1=Secc, 2=b, 3=h, 4=Tramos, 5=L.tot, 6=Vol, 7=Eje, 8=Actions
const EDITABLE_COLS = new Set([0, 2, 3, 4, 5, 7]);
const COL_FIELDS: (keyof Viga | null)[] = ["id", "s", "b", "h", "t", "lt", "v", "eje", null];

export function Vigas() {
  const { state: vigas, setState: setVigas, undo, redo } = useUndoRedo<Viga[]>(
    () => VIGAS_INIT.map((v) => ({ ...v }))
  );
  usePersistence("vigas", vigas, setVigas, (data) => {
    if (!Array.isArray(data)) return null;
    return (data as Viga[]).map((v) => ({ ...v, piso: v.piso ?? "3er-piso" }));
  });

  const { floors } = useFloors();
  const [expanded, setExpanded] = createSignal<Record<number, boolean>>({});
  const [pendingEditRow, setPendingEditRow] = createSignal<number | null>(null);
  const [pisoFilter, setPisoFilter] = createSignal("todos");

  createEffect(() => {
    if (pendingEditRow() !== null) setPendingEditRow(null);
  });

  const floorTabs = () => {
    const pisos = new Set(vigas().map((v) => v.piso));
    const allFloors = floors();
    const tabs: { id: string; label: string }[] = [{ id: "todos", label: "Todos" }];
    for (const f of allFloors) {
      if (pisos.has(f.id)) tabs.push({ id: f.id, label: f.label });
    }
    // Add any pisos in data that aren't in floors
    for (const p of pisos) {
      if (!tabs.find((t) => t.id === p)) tabs.push({ id: p, label: p });
    }
    return tabs;
  };

  const filtered = () => pisoFilter() === "todos" ? vigas() : vigas().filter((v) => v.piso === pisoFilter());
  const realIndices = () => filtered().map((fv) => vigas().indexOf(fv));

  const totVol = () => filtered().reduce((s, v) => s + v.b * v.h * v.lt, 0);
  const totLt = () => filtered().reduce((s, v) => s + v.lt, 0);

  const publish = usePublishSection();
  const vigasAgg = createMemo(() => {
    const byFloor: Record<string, VigaFloorAgg> = {};
    const steel = { v34: 0, v58: 0, v12: 0, v38: 0, v14: 0 };
    for (const v of vigas()) {
      const p = v.piso || "3er-piso";
      if (!byFloor[p]) byFloor[p] = { encTotal: 0, volTotal: 0, steel: { v34: 0, v58: 0, v12: 0, v38: 0, v14: 0 } };
      byFloor[p].encTotal += (2 * v.h + v.b) * v.lt;
      byFloor[p].volTotal += v.b * v.h * v.lt;
      const vl34 = Math.ceil((v.barras34 * v.lt * 1.05) / 9);
      const vl58 = Math.ceil((v.barras58 * v.lt * 1.05) / 9);
      const vl12 = Math.ceil((v.barras12 * v.lt * 1.05) / 9);
      const vlEstr = Math.ceil((v.nEstr * v.lEstr) / 9);
      byFloor[p].steel.v34 += vl34;
      byFloor[p].steel.v58 += vl58;
      byFloor[p].steel.v12 += vl12;
      byFloor[p].steel.v38 += vlEstr;
    }
    let encTotal = 0;
    let volTotal = 0;
    for (const k of Object.keys(byFloor)) {
      byFloor[k].encTotal = +byFloor[k].encTotal.toFixed(2);
      byFloor[k].volTotal = +byFloor[k].volTotal.toFixed(2);
      encTotal += byFloor[k].encTotal;
      volTotal += byFloor[k].volTotal;
      steel.v34 += byFloor[k].steel.v34;
      steel.v58 += byFloor[k].steel.v58;
      steel.v12 += byFloor[k].steel.v12;
      steel.v38 += byFloor[k].steel.v38;
    }
    return { encTotal: +encTotal.toFixed(2), volTotal: +volTotal.toFixed(2), steel, byFloor };
  });
  createEffect(() => publish("vigas", vigasAgg()));

  const upd = (i: number, f: keyof Viga, val: string | number) => {
    setVigas((p) => {
      const n = [...p];
      const updated = { ...n[i], [f]: val };
      if (f === "b" || f === "h") {
        updated.s = `${Math.round(Number(updated.b) * 100)}×${Math.round(Number(updated.h) * 100)}`;
      }
      if (f === "b" || f === "h" || f === "lt") {
        updated.v = +(Number(updated.b) * Number(updated.h) * Number(updated.lt)).toFixed(4);
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

  return (
    <Card>
      <CardHeader class="bg-[#18181B]">
        <CardTitle class="text-white">Vigas — Metrado + Secciones</CardTitle>
        <CardDescription class="text-white/50">
          {filtered().length} vigas · L.total: {totLt().toFixed(1)}m · Vol: {totVol().toFixed(2)} m³
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
            existingFloors={[...new Set(vigas().map((v) => v.piso))]}
            onAddFloor={(floorId) => {
              setPendingEditRow(vigas().length);
              setVigas((p) => [
                ...p,
                { id: "V-01", piso: floorId, s: "25×50", b: 0.25, h: 0.50, t: 1, lt: 3.0, v: 0.375, eje: "A" },
              ]);
              setPisoFilter(floorId);
            }}
          />
        </div>

        <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
          <b>Acero long.</b> = N°barras × L.viga × <b>1.05</b> (factor empalme) &nbsp;·&nbsp; Varillas = ⌈metros÷9⌉
          <br />
          <b>Encofrado</b> = (2h + b) × L &nbsp;·&nbsp; <b>Vol</b> = b × h × L
        </div>

        <SpreadsheetProvider
          rows={filtered().length}
          cols={9}
          isCellEditable={isCellEditable}
          onCellChange={handleCellChange}
          onUndo={undo}
          onRedo={redo}
        >
          <Table class="min-w-[640px] spreadsheet-table">
            <colgroup>
              <col class="w-[72px]" />{/* ID */}
              <col class="w-[68px]" />{/* Secc */}
              <col class="w-[56px]" />{/* b */}
              <col class="w-[56px]" />{/* h */}
              <col class="w-[52px]" />{/* Tramos */}
              <col class="w-[68px]" />{/* L.tot */}
              <col class="w-[68px]" />{/* Vol */}
              <col class="w-[72px]" />{/* Eje */}
              <col class="w-[52px]" />{/* Actions */}
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Secc.</TableHead>
                <TableHead>b (m)</TableHead>
                <TableHead>h (m)</TableHead>
                <TableHead>Tramos</TableHead>
                <TableHead>L.tot (m)</TableHead>
                <TableHead>Vol (m³)</TableHead>
                <TableHead>Eje</TableHead>
                <TableHead>+</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={filtered()}>
                {(v, fi) => {
                  const ri = () => realIndices()[fi()];
                  const vol = () => v.b * v.h * v.lt;
                  const enc = () => (2 * v.h + v.b) * v.lt;
                  const m34 = () => v.barras34 * v.lt * 1.05;
                  const vl34 = () => Math.ceil(m34() / 9);
                  const m58 = () => v.barras58 * v.lt * 1.05;
                  const vl58 = () => Math.ceil(m58() / 9);
                  const m12 = () => v.barras12 * v.lt * 1.05;
                  const vl12 = () => Math.ceil(m12() / 9);
                  const mEstr = () => v.nEstr * v.lEstr;

                  return (
                    <>
                      <TableRow
                        class={`cursor-pointer ${fi() % 2 === 0 ? "bg-muted/30" : ""}`}
                        onClick={() => setExpanded((p) => ({ ...p, [ri()]: !p[ri()] }))}
                      >
                        <TableCell class="p-0.5" onClick={(e: MouseEvent) => e.stopPropagation()}>
                          <EditCell value={v.id} onChange={(val) => upd(ri(), "id", val)} type="text" row={fi()} col={0} class="font-bold text-primary" autoEdit={pendingEditRow() === ri()} />
                        </TableCell>
                        <TableCell class="text-center font-mono text-[10px] cell-readonly">{v.s}</TableCell>
                        <TableCell class="p-0.5" onClick={(e: MouseEvent) => e.stopPropagation()}>
                          <EditCell value={v.b} onChange={(val) => upd(ri(), "b", val)} row={fi()} col={2} min={0.10} max={1.0} class="text-center" />
                        </TableCell>
                        <TableCell class="p-0.5" onClick={(e: MouseEvent) => e.stopPropagation()}>
                          <EditCell value={v.h} onChange={(val) => upd(ri(), "h", val)} row={fi()} col={3} min={0.15} max={2.0} class="text-center" />
                        </TableCell>
                        <TableCell class="p-0.5" onClick={(e: MouseEvent) => e.stopPropagation()}>
                          <EditCell value={v.t} onChange={(val) => upd(ri(), "t", val)} row={fi()} col={4} min={1} max={10} class="text-center" />
                        </TableCell>
                        <TableCell class="p-0.5" onClick={(e: MouseEvent) => e.stopPropagation()}>
                          <EditCell value={v.lt} onChange={(val) => upd(ri(), "lt", val)} row={fi()} col={5} min={0.5} max={50} class="text-center text-primary font-bold" />
                        </TableCell>
                        <TableCell class="text-center font-bold text-primary">
                          <FlashValue value={vol()} format={(val) => Number(val).toFixed(2)} />
                        </TableCell>
                        <TableCell class="p-0.5" onClick={(e: MouseEvent) => e.stopPropagation()}>
                          <EditCell value={v.eje} onChange={(val) => upd(ri(), "eje", val)} type="text" row={fi()} col={7} class="text-[10px] text-text-soft" />
                        </TableCell>
                        <TableCell class="text-center">
                          <button class="text-primary text-xs font-bold cursor-pointer" title="Ver detalle">
                            {expanded()[ri()] ? "▲" : "▼"}
                          </button>
                          <button
                            onClick={(e: MouseEvent) => { e.stopPropagation(); setVigas((p) => p.filter((_, x) => x !== ri())); }}
                            class="text-text-soft hover:text-danger transition-colors text-sm ml-1 rounded px-1 cursor-pointer"
                            title="Eliminar"
                          >
                            ✕
                          </button>
                        </TableCell>
                      </TableRow>
                      <Show when={expanded()[ri()]}>
                        <TableRow>
                          <TableCell colSpan={9} class="p-2 bg-primary-bg border-b border-border">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              <div>
                                <div class="font-bold text-primary mb-1">Acero longitudinal</div>
                                <div class="text-steel-34 flex items-center gap-1 flex-wrap">
                                  <span>Ø3/4":</span>
                                  <EditCell value={v.barras34} onChange={(val) => upd(ri(), "barras34", val)} min={0} class="w-10 text-center font-bold" />
                                  <span>×{v.lt}×1.05 =</span>
                                  <FlashValue value={m34()} format={(x) => Number(x).toFixed(1)} />
                                  <span>m →</span>
                                  <b><FlashValue value={vl34()} format={(x) => String(x)} /> vll</b>
                                </div>
                                <div class="text-steel-58 flex items-center gap-1 flex-wrap">
                                  <span>Ø5/8":</span>
                                  <EditCell value={v.barras58} onChange={(val) => upd(ri(), "barras58", val)} min={0} class="w-10 text-center font-bold" />
                                  <span>×{v.lt}×1.05 =</span>
                                  <FlashValue value={m58()} format={(x) => Number(x).toFixed(1)} />
                                  <span>m →</span>
                                  <b><FlashValue value={vl58()} format={(x) => String(x)} /> vll</b>
                                </div>
                                <div class="text-steel-12 flex items-center gap-1 flex-wrap">
                                  <span>Ø1/2":</span>
                                  <EditCell value={v.barras12} onChange={(val) => upd(ri(), "barras12", val)} min={0} class="w-10 text-center font-bold" />
                                  <span>×{v.lt}×1.05 =</span>
                                  <FlashValue value={m12()} format={(x) => Number(x).toFixed(1)} />
                                  <span>m →</span>
                                  <b><FlashValue value={vl12()} format={(x) => String(x)} /> vll</b>
                                </div>
                              </div>
                              <div>
                                <div class="font-bold text-primary mb-1">Estribos + Encofrado</div>
                                <div class="text-steel-38 flex items-center gap-1 flex-wrap">
                                  <span>Ø3/8":</span>
                                  <EditCell value={v.nEstr} onChange={(val) => upd(ri(), "nEstr", val)} min={0} class="w-10 text-center font-bold" />
                                  <span>est ×</span>
                                  <EditCell value={v.lEstr} onChange={(val) => upd(ri(), "lEstr", val)} min={0} class="w-12 text-center font-bold" />
                                  <span>m =</span>
                                  <FlashValue value={mEstr()} format={(x) => Number(x).toFixed(1)} />
                                  <span>m →</span>
                                  <b><FlashValue value={Math.ceil(mEstr() / 9)} format={(x) => String(x)} /> vll</b>
                                </div>
                                <div>
                                  Vol = {v.b}×{v.h}×{v.lt} = <b><FlashValue value={vol()} format={(x) => Number(x).toFixed(2)} /> m³</b>
                                </div>
                                <div>
                                  Enc = (2×{v.h}+{v.b})×{v.lt} = <b><FlashValue value={enc()} format={(x) => Number(x).toFixed(2)} /> m²</b>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </Show>
                    </>
                  );
                }}
              </For>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} class="font-bold text-primary">TOTAL</TableCell>
                <TableCell class="text-center text-primary font-bold">
                  <FlashValue value={totLt()} format={(v) => Number(v).toFixed(1)} />
                </TableCell>
                <TableCell class="text-center text-primary font-bold">
                  <FlashValue value={totVol()} format={(v) => Number(v).toFixed(2)} />
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </SpreadsheetProvider>

        <button
          onClick={() => {
            const piso = pisoFilter() === "todos" ? "3er-piso" : pisoFilter();
            setPendingEditRow(vigas().length);
            setVigas((p) => [
              ...p,
              {
                id: "Nueva", s: "30×50", b: 0.30, h: 0.50, t: 1, lt: 5.0, v: 0.75,
                barras34: 4, barras58: 2, barras12: 0, barras38: 0, lEstr: 1.48, nEstr: 26, eje: "-",
                piso,
              },
            ]);
          }}
          class="w-full py-2 mt-3 bg-transparent border border-dashed border-border/60 rounded-lg text-text-soft hover:text-text-mid text-xs font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
        >
          ＋ Agregar viga
        </button>
      </CardContent>
    </Card>
  );
}
