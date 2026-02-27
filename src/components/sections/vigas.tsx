import { useState, useCallback, useEffect, Fragment } from "react";
import { VIGAS_INIT } from "@/data/vigas-data";
import type { Viga } from "@/lib/types";
import { usePublishSection } from "@/lib/section-data-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";

// Cols: 0=ID, 1=Secc, 2=b, 3=h, 4=Tramos, 5=L.tot, 6=Vol, 7=Eje, 8=Actions
const EDITABLE_COLS = new Set([0, 2, 3, 4, 5, 7]);
const COL_FIELDS: (keyof Viga | null)[] = ["id", "s", "b", "h", "t", "lt", "v", "eje", null];

export function Vigas() {
  const { state: vigas, setState: setVigas, undo, redo } = useUndoRedo<Viga[]>(
    () => VIGAS_INIT.map((v) => ({ ...v }))
  );
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [pendingEditRow, setPendingEditRow] = useState<number | null>(null);

  useEffect(() => {
    if (pendingEditRow !== null) setPendingEditRow(null);
  }, [pendingEditRow]);

  const totVol = vigas.reduce((s, v) => s + v.b * v.h * v.lt, 0);
  const totLt = vigas.reduce((s, v) => s + v.lt, 0);

  const publish = usePublishSection();
  useEffect(() => {
    const encTotal = vigas.reduce((s, v) => s + (2 * v.h + v.b) * v.lt, 0);
    const volTotal = vigas.reduce((s, v) => s + v.b * v.h * v.lt, 0);
    publish("vigas", { encTotal: +encTotal.toFixed(2), volTotal: +volTotal.toFixed(2) });
  }, [vigas, publish]);

  const upd = useCallback((i: number, f: keyof Viga, val: string | number) => {
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
  }, [setVigas]);

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
        <CardTitle className="text-white">VIGAS — Metrado + Secciones</CardTitle>
        <CardDescription className="text-white/60">
          {vigas.length} vigas · L.total: {totLt.toFixed(1)}m · Vol: {totVol.toFixed(2)} m³
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b>Acero long.</b> = N°barras × L.viga × <b>1.05</b> (factor empalme) &nbsp;·&nbsp; Varillas = ⌈metros÷9⌉
          <br />
          <b>Encofrado</b> = (2h + b) × L &nbsp;·&nbsp; <b>Vol</b> = b × h × L
        </div>

        <SpreadsheetProvider
          rows={vigas.length}
          cols={9}
          isCellEditable={isCellEditable}
          onCellChange={handleCellChange}
          onUndo={undo}
          onRedo={redo}
        >
          <Table className="min-w-[640px] spreadsheet-table">
            <colgroup>
              <col className="w-[72px]" />{/* ID */}
              <col className="w-[68px]" />{/* Secc */}
              <col className="w-[56px]" />{/* b */}
              <col className="w-[56px]" />{/* h */}
              <col className="w-[52px]" />{/* Tramos */}
              <col className="w-[68px]" />{/* L.tot */}
              <col className="w-[68px]" />{/* Vol */}
              <col className="w-[72px]" />{/* Eje */}
              <col className="w-[52px]" />{/* Actions */}
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
              {vigas.map((v, i) => {
                const vol = v.b * v.h * v.lt;
                const enc = (2 * v.h + v.b) * v.lt;
                const m34 = v.barras34 * v.lt * 1.05;
                const vl34 = Math.ceil(m34 / 9);
                const m58 = v.barras58 * v.lt * 1.05;
                const vl58 = Math.ceil(m58 / 9);
                const m12 = v.barras12 * v.lt * 1.05;
                const vl12 = Math.ceil(m12 / 9);
                const mEstr = v.nEstr * v.lEstr;

                return (
                  <Fragment key={i}>
                    <TableRow
                      className={`cursor-pointer ${i % 2 === 0 ? "bg-muted/50" : ""}`}
                      onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
                    >
                      <TableCell className="p-0.5" onClick={(e) => e.stopPropagation()}>
                        <EditCell value={v.id} onChange={(val) => upd(i, "id", val)} type="text" row={i} col={0} className="font-bold text-primary" autoEdit={pendingEditRow === i} />
                      </TableCell>
                      <TableCell className="text-center font-mono text-[10px] cell-readonly">{v.s}</TableCell>
                      <TableCell className="p-0.5" onClick={(e) => e.stopPropagation()}>
                        <EditCell value={v.b} onChange={(val) => upd(i, "b", val)} row={i} col={2} className="text-center" />
                      </TableCell>
                      <TableCell className="p-0.5" onClick={(e) => e.stopPropagation()}>
                        <EditCell value={v.h} onChange={(val) => upd(i, "h", val)} row={i} col={3} className="text-center" />
                      </TableCell>
                      <TableCell className="p-0.5" onClick={(e) => e.stopPropagation()}>
                        <EditCell value={v.t} onChange={(val) => upd(i, "t", val)} row={i} col={4} className="text-center" />
                      </TableCell>
                      <TableCell className="p-0.5" onClick={(e) => e.stopPropagation()}>
                        <EditCell value={v.lt} onChange={(val) => upd(i, "lt", val)} row={i} col={5} className="text-center text-primary font-bold" />
                      </TableCell>
                      <TableCell className="text-center font-bold text-primary">
                        <FlashValue value={vol} format={(val) => Number(val).toFixed(2)} />
                      </TableCell>
                      <TableCell className="p-0.5" onClick={(e) => e.stopPropagation()}>
                        <EditCell value={v.eje} onChange={(val) => upd(i, "eje", val)} type="text" row={i} col={7} className="text-[10px] text-text-soft" />
                      </TableCell>
                      <TableCell className="text-center">
                        <button className="text-primary text-xs font-bold cursor-pointer" title="Ver detalle">
                          {expanded[i] ? "▲" : "▼"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setVigas((p) => p.filter((_, x) => x !== i)); }}
                          className="text-danger font-bold text-sm ml-1 hover:bg-danger/10 rounded px-1 cursor-pointer"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </TableCell>
                    </TableRow>
                    {expanded[i] && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-2 bg-primary-bg border-b border-border">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div>
                              <div className="font-bold text-primary mb-1">Acero longitudinal</div>
                              <div className="text-steel-34 flex items-center gap-1 flex-wrap">
                                <span>Ø3/4":</span>
                                <EditCell value={v.barras34} onChange={(val) => upd(i, "barras34", val)} min={0} className="w-10 text-center font-bold" />
                                <span>×{v.lt}×1.05 =</span>
                                <FlashValue value={m34} format={(x) => Number(x).toFixed(1)} />
                                <span>m →</span>
                                <b><FlashValue value={vl34} format={(x) => String(x)} /> vll</b>
                              </div>
                              <div className="text-steel-58 flex items-center gap-1 flex-wrap">
                                <span>Ø5/8":</span>
                                <EditCell value={v.barras58} onChange={(val) => upd(i, "barras58", val)} min={0} className="w-10 text-center font-bold" />
                                <span>×{v.lt}×1.05 =</span>
                                <FlashValue value={m58} format={(x) => Number(x).toFixed(1)} />
                                <span>m →</span>
                                <b><FlashValue value={vl58} format={(x) => String(x)} /> vll</b>
                              </div>
                              <div className="text-steel-12 flex items-center gap-1 flex-wrap">
                                <span>Ø1/2":</span>
                                <EditCell value={v.barras12} onChange={(val) => upd(i, "barras12", val)} min={0} className="w-10 text-center font-bold" />
                                <span>×{v.lt}×1.05 =</span>
                                <FlashValue value={m12} format={(x) => Number(x).toFixed(1)} />
                                <span>m →</span>
                                <b><FlashValue value={vl12} format={(x) => String(x)} /> vll</b>
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-primary mb-1">Estribos + Encofrado</div>
                              <div className="text-steel-38 flex items-center gap-1 flex-wrap">
                                <span>Ø3/8":</span>
                                <EditCell value={v.nEstr} onChange={(val) => upd(i, "nEstr", val)} min={0} className="w-10 text-center font-bold" />
                                <span>est ×</span>
                                <EditCell value={v.lEstr} onChange={(val) => upd(i, "lEstr", val)} min={0} className="w-12 text-center font-bold" />
                                <span>m =</span>
                                <FlashValue value={mEstr} format={(x) => Number(x).toFixed(1)} />
                                <span>m →</span>
                                <b><FlashValue value={Math.ceil(mEstr / 9)} format={(x) => String(x)} /> vll</b>
                              </div>
                              <div>
                                Vol = {v.b}×{v.h}×{v.lt} = <b><FlashValue value={vol} format={(x) => Number(x).toFixed(2)} /> m³</b>
                              </div>
                              <div>
                                Enc = (2×{v.h}+{v.b})×{v.lt} = <b><FlashValue value={enc} format={(x) => Number(x).toFixed(2)} /> m²</b>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="font-bold text-primary">TOTAL</TableCell>
                <TableCell className="text-center text-primary font-bold">
                  <FlashValue value={totLt} format={(v) => Number(v).toFixed(1)} />
                </TableCell>
                <TableCell className="text-center text-primary font-bold">
                  <FlashValue value={totVol} format={(v) => Number(v).toFixed(2)} />
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </SpreadsheetProvider>

        <button
          onClick={() => {
            setPendingEditRow(vigas.length);
            setVigas((p) => [
              ...p,
              {
                id: "Nueva", s: "30×50", b: 0.30, h: 0.50, t: 1, lt: 5.0, v: 0.75,
                barras34: 4, barras58: 2, barras12: 0, barras38: 0, lEstr: 1.48, nEstr: 26, eje: "-",
              },
            ]);
          }}
          className="w-full py-2 mt-2 bg-muted border-2 border-dashed border-border rounded-xl text-text-mid text-xs font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
        >
          ＋ Agregar viga
        </button>
      </CardContent>
    </Card>
  );
}
