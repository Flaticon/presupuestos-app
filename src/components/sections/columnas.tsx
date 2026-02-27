import { useState, useCallback, useEffect } from "react";
import { COLUMNAS_INIT } from "@/data/columnas-data";
import type { Columna } from "@/lib/types";
import { usePublishSection } from "@/lib/section-data-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { ColumnDiagrams } from "@/components/diagrams/column-diagrams";
import { StirrupDiagram } from "@/components/diagrams/stirrup-diagram";

// Columns: 0=del, 1=ID, 2=Tipo, 3=Cant, 4=H, 5=Área, 6=Vol, 7=Ø1, 8=C1, 9=Ø2, 10=C2, 11=Pos, 12=Met.Estr
const EDITABLE_COLS = new Set([1, 3, 4, 5, 8, 11, 12]);
const COL_FIELDS: (keyof Columna | null)[] = [null, "id", "tipo", "cant", "alt", "area", "vol", "dia1", "c1", "dia2", "c2", "npos", "mestr"];

export function Columnas() {
  const { state: cols, setState: setCols, undo, redo } = useUndoRedo<Columna[]>(
    () => COLUMNAS_INIT.map((c) => ({ ...c }))
  );
  const [pendingEditRow, setPendingEditRow] = useState<number | null>(null);

  useEffect(() => {
    if (pendingEditRow !== null) setPendingEditRow(null);
  }, [pendingEditRow]);

  const totVol = cols.reduce((s, c) => s + c.vol, 0);

  const publish = usePublishSection();
  useEffect(() => {
    const areaTarrajeo = cols.reduce((s, c) => s + 2 * (c.b + c.h) * c.alt * c.cant, 0);
    publish("columnas", { areaTarrajeo: +areaTarrajeo.toFixed(2) });
  }, [cols, publish]);

  const upd = useCallback((i: number, f: keyof Columna, v: string | number) => {
    setCols((p) => {
      const n = [...p];
      const updated = { ...n[i], [f]: v };
      if (f === "area" || f === "alt" || f === "cant") {
        updated.vol = +(Number(updated.area) * Number(updated.alt) * Number(updated.cant)).toFixed(4);
      }
      n[i] = updated;
      return n;
    });
  }, [setCols]);

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
        <CardTitle className="text-white">COLUMNAS — Metrado + Secciones</CardTitle>
        <CardDescription className="text-white/60">Vol: {totVol.toFixed(2)} m³ · {cols.length} tipos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ColumnDiagrams />

        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b>Vol</b> = Área × H × Cant &nbsp;|&nbsp; <b>Empalme (H≥2m):</b> Le=40×db &nbsp;·&nbsp;
          <span className="text-steel-34">Ø3/4"=0.75m</span> &nbsp;
          <span className="text-steel-58">Ø5/8"=0.65m</span>
        </div>

        <StirrupDiagram />

        <SpreadsheetProvider
          rows={cols.length}
          cols={13}
          isCellEditable={isCellEditable}
          onCellChange={handleCellChange}
          onUndo={undo}
          onRedo={redo}
        >
          <Table className="min-w-[720px] spreadsheet-table">
            <colgroup>
              <col className="w-[28px]" />{/* del */}
              <col className="w-[72px]" />{/* ID */}
              <col className="w-[70px]" />{/* Tipo */}
              <col className="w-[44px]" />{/* Cant */}
              <col className="w-[50px]" />{/* H */}
              <col className="w-[56px]" />{/* Área */}
              <col className="w-[60px]" />{/* Vol */}
              <col className="w-[50px]" />{/* Ø1 */}
              <col className="w-[44px]" />{/* C1 */}
              <col className="w-[50px]" />{/* Ø2 */}
              <col className="w-[44px]" />{/* C2 */}
              <col className="w-[44px]" />{/* Pos */}
              <col className="w-[60px]" />{/* Met.Estr */}
            </colgroup>
            <TableHeader>
              <TableRow>
                {["", "ID", "Tipo", "Cant", "H", "Área", "Vol", "Ø1", "C1", "Ø2", "C2", "Pos", "Met.Estr"].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cols.map((c, i) => (
                <TableRow key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="text-center p-0.5">
                    <button
                      onClick={() => setCols((p) => p.filter((_, x) => x !== i))}
                      className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={c.id} onChange={(v) => upd(i, "id", v)} type="text" row={i} col={1} className="font-semibold text-[10px] text-left" autoEdit={pendingEditRow === i} />
                  </TableCell>
                  <TableCell className="text-center text-[9px] font-semibold cell-readonly">{c.tipo}</TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={c.cant} onChange={(v) => upd(i, "cant", v)} row={i} col={3} className="text-center font-bold" />
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={c.alt} onChange={(v) => upd(i, "alt", v)} row={i} col={4} className="text-center" />
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={c.area} onChange={(v) => upd(i, "area", v)} row={i} col={5} className="text-center font-semibold text-primary" />
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary cell-readonly">
                    <FlashValue value={c.vol} format={(v) => Number(v).toFixed(2)} />
                  </TableCell>
                  <TableCell className={`text-center font-semibold cell-readonly ${c.dia1.includes("5/8") ? "text-steel-58" : "text-steel-34"}`}>
                    {c.dia1}
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={c.c1} onChange={(v) => upd(i, "c1", v)} row={i} col={8} className="text-center" />
                  </TableCell>
                  <TableCell className={`text-center font-semibold cell-readonly ${c.dia2.includes("3/4") ? "text-steel-34" : "text-text-soft"}`}>
                    {c.dia2}
                  </TableCell>
                  <TableCell className="text-center cell-readonly">{c.c2 || "-"}</TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={c.npos} onChange={(v) => upd(i, "npos", v)} row={i} col={11} className="text-center" />
                  </TableCell>
                  <TableCell className="p-0.5">
                    <EditCell value={c.mestr} onChange={(v) => upd(i, "mestr", v)} row={i} col={12} className="text-center text-steel-38 font-semibold" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="font-bold text-primary">TOTAL</TableCell>
                <TableCell />
                <TableCell className="text-center font-extrabold text-primary">
                  <FlashValue value={totVol} format={(v) => Number(v).toFixed(2)} />
                </TableCell>
                <TableCell colSpan={6} />
              </TableRow>
            </TableFooter>
          </Table>
        </SpreadsheetProvider>

        <button
          onClick={() => {
            setPendingEditRow(cols.length);
            setCols((p) => [
              ...p,
              {
                id: "Nueva", tipo: "C-30×50", cant: 1, alt: 3.5, b: 0.50, h: 0.30, area: 0.15, vol: 0.525,
                dia1: '5/8"', c1: 8, dia2: "-", c2: 0, npos: 29, lpos: 3.20, mestr: 92.8, md1: 33.2, md2: 0,
              },
            ]);
          }}
          className="w-full py-2 mt-2 bg-muted border-2 border-dashed border-border rounded-xl text-text-mid text-xs font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
        >
          ＋ Agregar columna
        </button>
      </CardContent>
    </Card>
  );
}
