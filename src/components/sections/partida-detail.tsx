import { useState } from "react";
import type { BudgetGroup, BudgetItem } from "@/lib/types";
import { InsumoPicker } from "@/components/shared/insumo-picker";
import { fmtS } from "@/lib/utils";
import { BUDGET_FORMULAS } from "@/data/budget-formulas";
import { useSectionData } from "@/lib/section-data-context";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { RefreshCw, Link2, Unlink } from "lucide-react";

export interface PartidaDetailProps {
  group: BudgetGroup;
  si: number;
  gi: number;
  onUpdateDesc: (si: number, gi: number, ii: number, v: string) => void;
  onUpdateCU: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateMet: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateFactor: (si: number, gi: number, ii: number, factor: number) => void;
  onToggleItemFactor?: (si: number, gi: number, ii: number) => void;
  onAddItem: (si: number, gi: number, currentLen: number, item?: import("@/lib/types").BudgetItem) => void;
  onDelItem: (si: number, gi: number, ii: number) => void;
  onSyncArea?: (si: number, gi: number, newArea: number) => void;
  undo: () => void;
  redo: () => void;
}

const EDITABLE_COLS = new Set([1, 3, 4]);

function AreaBadgeDetail({ group, si, gi, onSync }: { group: BudgetGroup; si: number; gi: number; onSync?: (si: number, gi: number, newArea: number) => void }) {
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

  return (
    <Tooltip content={tooltipText}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
        Híbrido: {currentArea.toFixed(2)} m²
        {calcArea != null && ` (calc: ${calcArea.toFixed(1)})`}
      </span>
    </Tooltip>
  );
}

export function PartidaDetail({
  group,
  si,
  gi,
  onUpdateDesc,
  onUpdateCU,
  onUpdateMet,
  onUpdateFactor,
  onToggleItemFactor,
  onAddItem,
  onDelItem,
  onSyncArea,
  undo,
  redo,
}: PartidaDetailProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const sub = group.items.reduce((s, it) => s + it.m * it.cu, 0);
  const itemCount = group.items.length;
  const hasFactor = group.areaM2 != null;
  const cuCol = hasFactor ? 5 : 4;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#1E293B] flex justify-between items-center flex-wrap gap-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-white">{group.cat}</span>
            <AreaBadgeDetail group={group} si={si} gi={gi} onSync={onSyncArea} />
          </div>
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
            if (col === cuCol && group.items[row]?.insumoId) return false;
            if (!hasFactor) return EDITABLE_COLS.has(col);
            if (col === 3) return group.items[row]?.factor != null;
            if (col === 4) return group.items[row]?.factor == null;
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
                  <TableHead className="w-[80px] bg-muted text-text-mid">
                    <Tooltip content={`Factor × ${group.metradoUnit ?? "m²"} = Metrado`}>
                      <span>Factor</span>
                    </Tooltip>
                  </TableHead>
                )}
                <TableHead className="w-[70px] bg-muted text-text-mid">Metrado</TableHead>
                <TableHead className="w-[75px] bg-muted text-text-mid">C.Unit</TableHead>
                <TableHead className="w-[85px] text-right bg-muted text-text-mid">C.Parcial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((it, ii) => {
                const cp2 = it.m * it.cu;
                const hasItemFactor = it.factor != null;
                const isLinked = !!it.insumoId;

                if (hasFactor) {
                  return (
                    <TableRow key={ii} className={ii % 2 === 0 ? "bg-muted/50" : ""}>
                      <TableCell className="text-center p-0.5">
                        <button
                          onClick={() => onDelItem(si, gi, ii)}
                          className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </TableCell>
                      <TableCell className="p-0.5">
                        <EditCell
                          value={it.d}
                          onChange={(v) => onUpdateDesc(si, gi, ii, v as string)}
                          type="text"
                          row={ii}
                          col={1}
                          className="text-xs text-left"
                        />
                      </TableCell>
                      <TableCell className="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                      <TableCell className="p-0.5">
                        {hasItemFactor ? (
                          <div className="flex items-center gap-0.5">
                            <EditCell
                              value={it.factor!}
                              onChange={(v) => onUpdateFactor(si, gi, ii, v as number)}
                              row={ii}
                              col={3}
                              className="text-right text-amber-600 dark:text-amber-400 font-semibold flex-1"
                            />
                            {onToggleItemFactor && (
                              <Tooltip content="Desenlazar: volver a metrado manual">
                                <button
                                  onClick={() => onToggleItemFactor(si, gi, ii)}
                                  className="text-amber-400 hover:text-red-400 cursor-pointer p-0.5"
                                >
                                  <Unlink size={9} />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <Tooltip content="Click para enlazar al metrado">
                            <button
                              onClick={() => onToggleItemFactor?.(si, gi, ii)}
                              className="block w-full text-center text-[11px] py-0.5 rounded transition-colors text-text-soft hover:bg-amber-500/10 hover:text-amber-600 cursor-pointer"
                            >
                              + enlazar
                            </button>
                          </Tooltip>
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
                            onChange={(v) => onUpdateMet(si, gi, ii, v as number)}
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
                            onChange={(v) => onUpdateCU(si, gi, ii, v as number)}
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

                return (
                  <TableRow key={ii} className={ii % 2 === 0 ? "bg-muted/50" : ""}>
                    <TableCell className="text-center p-0.5">
                      <button
                        onClick={() => onDelItem(si, gi, ii)}
                        className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </TableCell>
                    <TableCell className="p-0.5">
                      <EditCell
                        value={it.d}
                        onChange={(v) => onUpdateDesc(si, gi, ii, v as string)}
                        type="text"
                        row={ii}
                        col={1}
                        className="text-xs text-left"
                      />
                    </TableCell>
                    <TableCell className="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                    <TableCell className="p-0.5">
                      <EditCell
                        value={it.m}
                        onChange={(v) => onUpdateMet(si, gi, ii, v as number)}
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
                          onChange={(v) => onUpdateCU(si, gi, ii, v as number)}
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
          {pickerOpen && (
            <InsumoPicker
              onSelect={(item: BudgetItem) => {
                onAddItem(si, gi, group.items.length, item);
                setPickerOpen(false);
              }}
              onCancel={() => setPickerOpen(false)}
            />
          )}
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="w-full py-2 bg-muted border-2 border-dashed border-border rounded-xl text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
          >
            ＋ Agregar insumo o item
          </button>
        </div>
      </div>
    </div>
  );
}
