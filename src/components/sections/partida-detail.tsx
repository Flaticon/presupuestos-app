import { createSignal, Show, For } from "solid-js";
import type { BudgetGroup, BudgetItem } from "@/lib/types";
import { InsumoPicker } from "@/components/shared/insumo-picker";
import { fmtS } from "@/lib/utils";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { Link2, Unlink } from "lucide-solid";
import { AreaBadge } from "@/components/sections/presupuesto/area-badge";

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

export function PartidaDetail(props: PartidaDetailProps) {
  const [pickerOpen, setPickerOpen] = createSignal(false);
  const sub = () => props.group.items.reduce((s, it) => s + it.m * it.cu, 0);
  const itemCount = () => props.group.items.length;
  const hasFactor = () => props.group.areaM2 != null;
  const cuCol = () => hasFactor() ? 5 : 4;

  return (
    <div class="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div class="px-4 py-2.5 bg-[#18181B] rounded-t-xl flex justify-between items-center flex-wrap gap-1">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[13px] font-semibold text-white">{props.group.cat}</span>
            <AreaBadge group={props.group} si={props.si} gi={props.gi} onSync={props.onSyncArea} />
          </div>
        </div>
        <div class="text-sm font-extrabold text-white">
          <FlashValue value={sub()} format={(v) => fmtS(Number(v))} />
        </div>
      </div>
      <div class="p-2">
        <SpreadsheetProvider
          rows={itemCount()}
          cols={hasFactor() ? 7 : 6}
          isCellEditable={(row, col) => {
            if (col === cuCol() && props.group.items[row]?.insumoId) return false;
            if (!hasFactor()) return EDITABLE_COLS.has(col);
            if (col === 3) return props.group.items[row]?.factor != null;
            if (col === 4) return props.group.items[row]?.factor == null;
            return col === 1 || col === 5;
          }}
          onUndo={props.undo}
          onRedo={props.redo}
        >
          <Table class="spreadsheet-table">
            <TableHeader>
              <TableRow>
                <TableHead class="w-7 bg-muted text-text-mid" />
                <TableHead class="text-left bg-muted text-text-mid">Descripción</TableHead>
                <TableHead class="w-[50px] bg-muted text-text-mid">Und.</TableHead>
                <Show when={hasFactor()}>
                  <TableHead class="w-[80px] bg-muted text-text-mid">
                    <Tooltip content={`Factor × ${props.group.metradoUnit ?? "m²"} = Metrado`}>
                      <span>Factor</span>
                    </Tooltip>
                  </TableHead>
                </Show>
                <TableHead class="w-[70px] bg-muted text-text-mid">Metrado</TableHead>
                <TableHead class="w-[75px] bg-muted text-text-mid">C.Unit</TableHead>
                <TableHead class="w-[85px] bg-muted text-text-mid">C.Parcial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={props.group.items}>
                {(it, ii) => {
                  const cp2 = () => it.m * it.cu;
                  const hasItemFactor = () => it.factor != null;
                  const isLinked = () => !!it.insumoId;

                  return (
                    <Show
                      when={hasFactor()}
                      fallback={
                        <TableRow class={ii() % 2 === 0 ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/30"}>
                          <TableCell class="text-center p-0.5">
                            <button
                              onClick={() => props.onDelItem(props.si, props.gi, ii())}
                              class="text-text-soft hover:text-danger transition-colors text-sm rounded px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </TableCell>
                          <TableCell class="p-0.5">
                            <EditCell
                              value={it.d}
                              onChange={(v) => props.onUpdateDesc(props.si, props.gi, ii(), v as string)}
                              type="text"
                              row={ii()}
                              col={1}
                              class="text-xs text-left"
                            />
                          </TableCell>
                          <TableCell class="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                          <TableCell class="p-0.5">
                            <EditCell
                              value={it.m}
                              onChange={(v) => props.onUpdateMet(props.si, props.gi, ii(), v as number)}
                              row={ii()}
                              col={3}
                              class="text-center text-primary font-semibold"
                            />
                          </TableCell>
                          <TableCell class="p-0.5">
                            <Show
                              when={isLinked()}
                              fallback={
                                <EditCell
                                  value={it.cu}
                                  onChange={(v) => props.onUpdateCU(props.si, props.gi, ii(), v as number)}
                                  row={ii()}
                                  col={4}
                                  class="text-center text-steel-58 font-semibold"
                                />
                              }
                            >
                              <Tooltip content="Precio de catálogo — editar en Insumos">
                                <span class="relative block text-center text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold cell-readonly">
                                  <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <FlashValue value={it.cu} format={(v) => String(v)} />
                                </span>
                              </Tooltip>
                            </Show>
                          </TableCell>
                          <TableCell class="text-center font-bold text-primary px-2">
                            <FlashValue value={cp2()} format={(v) => fmtS(Number(v))} />
                          </TableCell>
                        </TableRow>
                      }
                    >
                      <TableRow class={ii() % 2 === 0 ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/30"}>
                        <TableCell class="text-center p-0.5">
                          <button
                            onClick={() => props.onDelItem(props.si, props.gi, ii())}
                            class="text-text-soft hover:text-danger transition-colors text-sm rounded px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </TableCell>
                        <TableCell class="p-0.5">
                          <EditCell
                            value={it.d}
                            onChange={(v) => props.onUpdateDesc(props.si, props.gi, ii(), v as string)}
                            type="text"
                            row={ii()}
                            col={1}
                            class="text-xs text-left"
                          />
                        </TableCell>
                        <TableCell class="text-center text-text-soft text-[11px] cell-readonly">{it.u}</TableCell>
                        <TableCell class="p-0.5">
                          <Show
                            when={hasItemFactor()}
                            fallback={
                              <Tooltip content="Click para enlazar al metrado">
                                <button
                                  onClick={() => props.onToggleItemFactor?.(props.si, props.gi, ii())}
                                  class="block w-full text-center text-[11px] py-0.5 rounded transition-colors text-text-soft hover:bg-amber-500/10 hover:text-amber-600 cursor-pointer"
                                >
                                  + enlazar
                                </button>
                              </Tooltip>
                            }
                          >
                            <div class="flex items-center gap-0.5">
                              <EditCell
                                value={it.factor!}
                                onChange={(v) => props.onUpdateFactor(props.si, props.gi, ii(), v as number)}
                                row={ii()}
                                col={3}
                                class="text-right text-amber-600 dark:text-amber-400 font-semibold flex-1"
                              />
                              <Show when={props.onToggleItemFactor}>
                                <Tooltip content="Desenlazar: volver a metrado manual">
                                  <button
                                    onClick={() => props.onToggleItemFactor!(props.si, props.gi, ii())}
                                    class="text-amber-400 hover:text-red-400 cursor-pointer p-0.5"
                                  >
                                    <Unlink size={9} />
                                  </button>
                                </Tooltip>
                              </Show>
                            </div>
                          </Show>
                        </TableCell>
                        <TableCell class="p-0.5">
                          <Show
                            when={hasItemFactor()}
                            fallback={
                              <EditCell
                                value={it.m}
                                onChange={(v) => props.onUpdateMet(props.si, props.gi, ii(), v as number)}
                                row={ii()}
                                col={4}
                                class="text-center text-primary font-semibold"
                              />
                            }
                          >
                            <span class="block text-center text-primary font-semibold text-xs px-1.5 py-0.5 rounded bg-emerald-500/10">
                              <FlashValue value={it.m} format={(v) => String(v)} />
                            </span>
                          </Show>
                        </TableCell>
                        <TableCell class="p-0.5">
                          <Show
                            when={isLinked()}
                            fallback={
                              <EditCell
                                value={it.cu}
                                onChange={(v) => props.onUpdateCU(props.si, props.gi, ii(), v as number)}
                                row={ii()}
                                col={5}
                                class="text-center text-steel-58 font-semibold"
                              />
                            }
                          >
                            <Tooltip content="Precio de catálogo — editar en Insumos">
                              <span class="relative block text-center text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold cell-readonly">
                                <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <FlashValue value={it.cu} format={(v) => String(v)} />
                              </span>
                            </Tooltip>
                          </Show>
                        </TableCell>
                        <TableCell class="text-center font-bold text-primary px-2">
                          <FlashValue value={cp2()} format={(v) => fmtS(Number(v))} />
                        </TableCell>
                      </TableRow>
                    </Show>
                  );
                }}
              </For>
            </TableBody>
          </Table>
        </SpreadsheetProvider>
        <div class="relative mt-1.5">
          <Show when={pickerOpen()}>
            <InsumoPicker
              onSelect={(item: BudgetItem) => {
                props.onAddItem(props.si, props.gi, props.group.items.length, item);
                setPickerOpen(false);
              }}
              onCancel={() => setPickerOpen(false)}
            />
          </Show>
          <button
            onClick={() => setPickerOpen(!pickerOpen())}
            class="w-full py-2 bg-transparent border border-dashed border-border/60 rounded-lg text-text-soft hover:text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
          >
            ＋ Agregar insumo o item
          </button>
        </div>
      </div>
    </div>
  );
}
