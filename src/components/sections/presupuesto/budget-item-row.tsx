import { Show } from "solid-js";
import type { BudgetItem } from "@/lib/types";
import type { PendingEdit } from "./types";
import { fmtS } from "@/lib/utils";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { Tooltip } from "@/components/ui/tooltip";
import { TableRow, TableCell } from "@/components/ui/table";
import { Unlink } from "lucide-solid";

interface BudgetItemRowProps {
  item: BudgetItem;
  si: number;
  gi: number;
  ii: number;
  hasFactor: boolean;
  cuCol: number;
  pendingEdit: PendingEdit | null;
  onUpdateDesc: (si: number, gi: number, ii: number, v: string) => void;
  onUpdateCU: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateMet: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateFactor: (si: number, gi: number, ii: number, factor: number) => void;
  onToggleItemFactor: (si: number, gi: number, ii: number) => void;
  onDelItem: (si: number, gi: number, ii: number) => void;
}

export function BudgetItemRow(props: BudgetItemRowProps) {
  const cp2 = () => props.item.m * props.item.cu;
  const hasItemFactor = () => props.item.factor != null;
  const isLinked = () => !!props.item.insumoId;
  const isAutoEdit = () => props.pendingEdit?.si === props.si && props.pendingEdit?.gi === props.gi && props.pendingEdit?.ii === props.ii;

  return (
    <Show when={props.hasFactor} fallback={
      /* Layout without Factor column */
      <TableRow class={props.ii % 2 === 0 ? "bg-muted/50" : ""}>
        <TableCell class="text-center p-0.5">
          <button
            onClick={() => props.onDelItem(props.si, props.gi, props.ii)}
            class="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
          >
            ✕
          </button>
        </TableCell>
        <TableCell class="p-0.5">
          <EditCell
            value={props.item.d}
            onChange={(v) => props.onUpdateDesc(props.si, props.gi, props.ii, v as string)}
            type="text"
            row={props.ii}
            col={1}
            class="text-xs text-left"
            autoEdit={isAutoEdit()}
          />
        </TableCell>
        <TableCell class="text-center text-text-soft text-[11px] cell-readonly">{props.item.u}</TableCell>
        <TableCell class="p-0.5">
          <EditCell
            value={props.item.m}
            onChange={(v) => props.onUpdateMet(props.si, props.gi, props.ii, v as number)}
            row={props.ii}
            col={3}
            class="text-right text-primary font-semibold"
          />
        </TableCell>
        <TableCell class="p-0.5">
          <Show when={isLinked()} fallback={
            <EditCell
              value={props.item.cu}
              onChange={(v) => props.onUpdateCU(props.si, props.gi, props.ii, v as number)}
              row={props.ii}
              col={4}
              class="text-right text-steel-58 font-semibold"
            />
          }>
            <Tooltip content="Precio de catalogo — editar en Insumos">
              <span class="relative block text-right text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold cell-readonly">
                <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                <FlashValue value={props.item.cu} format={(v) => String(v)} />
              </span>
            </Tooltip>
          </Show>
        </TableCell>
        <TableCell class="text-right font-bold text-primary px-2">
          <FlashValue value={cp2()} format={(v) => fmtS(Number(v))} />
        </TableCell>
      </TableRow>
    }>
      {/* Layout with Factor column */}
      <TableRow class={props.ii % 2 === 0 ? "bg-muted/50" : ""}>
        <TableCell class="text-center p-0.5">
          <button
            onClick={() => props.onDelItem(props.si, props.gi, props.ii)}
            class="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
          >
            ✕
          </button>
        </TableCell>
        <TableCell class="p-0.5">
          <EditCell
            value={props.item.d}
            onChange={(v) => props.onUpdateDesc(props.si, props.gi, props.ii, v as string)}
            type="text"
            row={props.ii}
            col={1}
            class="text-xs text-left"
            autoEdit={isAutoEdit()}
          />
        </TableCell>
        <TableCell class="text-center text-text-soft text-[11px] cell-readonly">{props.item.u}</TableCell>
        <TableCell class="p-0.5">
          <Show when={hasItemFactor()} fallback={
            <button
              onClick={() => props.onToggleItemFactor(props.si, props.gi, props.ii)}
              class="block w-full text-center text-[11px] py-0.5 rounded transition-colors text-text-soft hover:bg-amber-500/10 hover:text-amber-600 cursor-pointer"
            >
              + enlazar
            </button>
          }>
            <div class="flex items-center gap-0.5">
              <EditCell
                value={props.item.factor!}
                onChange={(v) => props.onUpdateFactor(props.si, props.gi, props.ii, v as number)}
                row={props.ii}
                col={3}
                class="text-right text-amber-600 dark:text-amber-400 font-semibold flex-1"
              />
              <button
                onClick={() => props.onToggleItemFactor(props.si, props.gi, props.ii)}
                class="text-amber-400 hover:text-red-400 cursor-pointer p-0.5"
                title="Desenlazar"
              >
                <Unlink size={9} />
              </button>
            </div>
          </Show>
        </TableCell>
        <TableCell class="p-0.5">
          <Show when={hasItemFactor()} fallback={
            <EditCell
              value={props.item.m}
              onChange={(v) => props.onUpdateMet(props.si, props.gi, props.ii, v as number)}
              row={props.ii}
              col={4}
              class="text-right text-primary font-semibold"
            />
          }>
            <span class="block text-right text-primary font-semibold text-xs px-1.5 py-0.5 rounded bg-emerald-500/10">
              <FlashValue value={props.item.m} format={(v) => String(v)} />
            </span>
          </Show>
        </TableCell>
        <TableCell class="p-0.5">
          <Show when={isLinked()} fallback={
            <EditCell
              value={props.item.cu}
              onChange={(v) => props.onUpdateCU(props.si, props.gi, props.ii, v as number)}
              row={props.ii}
              col={5}
              class="text-right text-steel-58 font-semibold"
            />
          }>
            <Tooltip content="Precio de catalogo — editar en Insumos">
              <span class="relative block text-right text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold cell-readonly">
                <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                <FlashValue value={props.item.cu} format={(v) => String(v)} />
              </span>
            </Tooltip>
          </Show>
        </TableCell>
        <TableCell class="text-right font-bold text-primary px-2">
          <FlashValue value={cp2()} format={(v) => fmtS(Number(v))} />
        </TableCell>
      </TableRow>
    </Show>
  );
}
