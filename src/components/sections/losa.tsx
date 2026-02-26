import { useState, useCallback, useEffect } from "react";
import { LOSA_PANOS_INIT } from "@/data/losa-data";
import type { PanoLosa } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { SlabDiagram } from "@/components/diagrams/slab-diagram";

// Cols: 0=del, 1=Paño, 2=Ejes, 3=Área, 4=N°Vig, 5=Dbl, 6=Vol, 7=Ladr
const EDITABLE_COLS = new Set([1, 2, 3, 4]);
const COL_FIELDS: (keyof PanoLosa | null)[] = [null, "p", "ej", "area", "nv", "dv", "vol", "lad"];

export function Losa() {
  const { state: panos, setState: setPanos, undo, redo } = useUndoRedo<PanoLosa[]>(
    () => LOSA_PANOS_INIT.map((p) => ({ ...p }))
  );
  const [pendingEditRow, setPendingEditRow] = useState<number | null>(null);

  useEffect(() => {
    if (pendingEditRow !== null) setPendingEditRow(null);
  }, [pendingEditRow]);

  const tA = panos.reduce((s, p) => s + p.area, 0);
  const tV = panos.reduce((s, p) => s + p.vol, 0);
  const tL = panos.reduce((s, p) => s + p.lad, 0);

  const upd = useCallback((i: number, f: keyof PanoLosa, v: string | number) => {
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
  }, [setPanos]);

  const isCellEditable = useCallback(
    (_row: number, col: number) => EDITABLE_COLS.has(col),
    []
  );

  const handleCellChange = useCallback(
    (row: number, col: number, value: string | number) => {
      const field = COL_FIELDS[col];
      if (field) upd(row, field, value);
    },
    [upd]
  );

  return (
    <Card>
      <CardHeader className="bg-[#1E293B]">
        <CardTitle className="text-white">LOSA ALIGERADA — Metrado + Sistema</CardTitle>
        <CardDescription className="text-white/60">
          Área: {tA.toFixed(0)} m² · Vol: {tV.toFixed(2)} m³ · {tL} ladrillos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SlabDiagram />

        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b>Concreto</b> = Área × 0.0875 m³/m² &nbsp;·&nbsp; <b>Ladrillos</b> = Área × 8.33 und/m²
          <br />
          <span className="text-steel-12">Ø1/2" positivo: 1 barra/vigueta</span> &nbsp;·&nbsp;
          <span className="text-steel-14">Ø1/4" temp: @0.25 transversal</span>
        </div>

        {/* Losa maciza section */}
        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5">
          <div className="text-xs font-bold text-steel-14 mb-1">LOSA MACIZA — Ejes 5-7 (16.91 m²)</div>
          <div className="text-xs leading-relaxed">
            V = 16.91 × 0.20 = <b className="text-steel-14">3.38 m³</b> &nbsp;·&nbsp;
            Acero <span className="text-steel-38">Ø3/8" @0.20 ambas dir.</span> →
            Dir X: 22 barras = 92.4m &nbsp;·&nbsp; Dir Y: 22 barras = 88.7m &nbsp;·&nbsp;
            <b>Total: 21 varillas Ø3/8"</b>
          </div>
        </div>

        <SpreadsheetProvider
          rows={panos.length}
          cols={8}
          isCellEditable={isCellEditable}
          onCellChange={handleCellChange}
          onUndo={undo}
          onRedo={redo}
        >
          <Table className="min-w-[520px] spreadsheet-table">
            <colgroup>
              <col className="w-[28px]" />{/* del */}
              <col className="w-[64px]" />{/* Paño */}
              <col className="w-[80px]" />{/* Ejes */}
              <col className="w-[70px]" />{/* Área */}
              <col className="w-[52px]" />{/* N°Vig */}
              <col className="w-[44px]" />{/* Dbl */}
              <col className="w-[70px]" />{/* Vol */}
              <col className="w-[60px]" />{/* Ladr */}
            </colgroup>
            <TableHeader>
              <TableRow>
                {["", "Paño", "Ejes", "Área m²", "N°Vig", "Dbl", "Vol m³", "Ladr."].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {panos.map((p, i) => (
                <TableRow key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="text-center p-0.5">
                    <button
                      onClick={() => setPanos((pr) => pr.filter((_, x) => x !== i))}
                      className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={p.p} onChange={(v) => upd(i, "p", v)} type="text" row={i} col={1} className="font-semibold text-left" autoEdit={pendingEditRow === i} />
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={p.ej} onChange={(v) => upd(i, "ej", v)} type="text" row={i} col={2} className="text-left" />
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={p.area} onChange={(v) => upd(i, "area", v)} row={i} col={3} className="text-center" />
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={p.nv} onChange={(v) => upd(i, "nv", v)} row={i} col={4} className="text-center" />
                  </TableCell>
                  <TableCell className="text-center cell-readonly">
                    {p.dv ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-steel-58">SÍ</span>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary cell-readonly">
                    <FlashValue value={p.vol} format={(v) => Number(v).toFixed(2)} />
                  </TableCell>
                  <TableCell className="text-center cell-readonly">
                    <FlashValue value={p.lad} format={(v) => String(v)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold text-primary">TOTAL</TableCell>
                <TableCell className="text-center">
                  <FlashValue value={tA} format={(v) => Number(v).toFixed(1)} />
                </TableCell>
                <TableCell className="text-center">
                  <FlashValue value={panos.reduce((s, p) => s + p.nv, 0)} format={(v) => String(v)} />
                </TableCell>
                <TableCell />
                <TableCell className="text-center text-primary font-bold">
                  <FlashValue value={tV} format={(v) => Number(v).toFixed(2)} />
                </TableCell>
                <TableCell className="text-center">
                  <FlashValue value={tL} format={(v) => String(v)} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </SpreadsheetProvider>

        <button
          onClick={() => {
            setPendingEditRow(panos.length);
            setPanos((p) => [
              ...p,
              { p: "Nuevo", ej: "-", a: 4.0, l: 4.0, area: 16.0, nv: 10, dv: 0, vol: 1.40, lad: 133 },
            ]);
          }}
          className="w-full py-2 mt-2 bg-muted border-2 border-dashed border-border rounded-xl text-text-mid text-xs font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
        >
          ＋ Agregar paño
        </button>
      </CardContent>
    </Card>
  );
}
