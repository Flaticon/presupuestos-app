import { Show, For } from "solid-js";
import type { BudgetGroup, BudgetItem } from "@/lib/types";
import type { PendingEdit, BudgetHandlers } from "./types";
import { fmtS } from "@/lib/utils";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { InsumoPicker } from "@/components/shared/insumo-picker";
import { Trash2 } from "lucide-solid";
import { EditableCatName } from "./editable-cat-name";
import { AreaBadge } from "./area-badge";
import { BudgetItemRow } from "./budget-item-row";

// Budget table cols WITHOUT factor: 0=del, 1=Desc, 2=Und, 3=Metrado, 4=C.Unit, 5=C.Parcial
const EDITABLE_COLS = new Set([1, 3, 4]);

interface BudgetGroupCardProps {
  group: BudgetGroup;
  si: number;
  gi: number;
  canDelete: boolean;
  pendingEdit: PendingEdit | null;
  handlers: BudgetHandlers;
  undo: () => void;
  redo: () => void;
  goTo: (id: string) => void;
  pickerKey: string | null;
  setPickerKey: (key: string | null) => void;
}

export function BudgetGroupCard(props: BudgetGroupCardProps) {
  const sub = () => props.group.items.reduce((s, it) => s + it.m * it.cu, 0);
  const itemCount = () => props.group.items.length;
  const hasFactor = () => props.group.areaM2 != null;
  const cuCol = () => hasFactor() ? 5 : 4;
  const pk = () => `${props.si}-${props.gi}`;

  return (
    <div class="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)] ml-4">
      <div class="px-4 py-2.5 bg-[#18181B] rounded-t-xl flex justify-between items-center flex-wrap gap-1">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <EditableCatName value={props.group.cat} onChange={(v) => props.handlers.updateCat(props.si, props.gi, v)} />
            <AreaBadge group={props.group} si={props.si} gi={props.gi} onSync={props.handlers.syncArea} />
          </div>
          <Show when={props.group.link && ["columnas", "vigas", "losa", "muros", "escalera"].includes(props.group.link!)}>
            <button
              onClick={() => props.goTo(props.group.link!)}
              class="text-white/60 text-xs underline cursor-pointer hover:text-white/90"
            >
              Ver metrado →
            </button>
          </Show>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-sm font-extrabold text-white">
            <FlashValue value={sub()} format={(v) => fmtS(Number(v))} />
          </div>
          <Show when={props.canDelete}>
            <Tooltip content="Eliminar sub-partida">
              <button
                onClick={() => props.handlers.delGroup(props.si, props.gi)}
                class="text-white/50 hover:text-red-400 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </Tooltip>
          </Show>
        </div>
      </div>
      <div class="p-2">
        <SpreadsheetProvider
          rows={itemCount()}
          cols={hasFactor() ? 7 : 6}
          isCellEditable={(row: number, col: number) => {
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
                <TableHead class="text-left bg-muted text-text-mid">Descripcion</TableHead>
                <TableHead class="w-[50px] bg-muted text-text-mid">Und.</TableHead>
                <Show when={hasFactor()}>
                  <TableHead class="w-[65px] bg-muted text-text-mid">Factor</TableHead>
                </Show>
                <TableHead class="w-[70px] bg-muted text-text-mid">Metrado</TableHead>
                <TableHead class="w-[75px] bg-muted text-text-mid">C.Unit</TableHead>
                <TableHead class="w-[85px] text-right bg-muted text-text-mid">C.Parcial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={props.group.items}>
                {(it, ii) => (
                  <BudgetItemRow
                    item={it}
                    si={props.si}
                    gi={props.gi}
                    ii={ii()}
                    hasFactor={hasFactor()}
                    cuCol={cuCol()}
                    pendingEdit={props.pendingEdit}
                    onUpdateDesc={props.handlers.updateDesc}
                    onUpdateCU={props.handlers.updateCU}
                    onUpdateMet={props.handlers.updateMet}
                    onUpdateFactor={props.handlers.updateFactor}
                    onToggleItemFactor={props.handlers.toggleItemFactor}
                    onDelItem={props.handlers.delItem}
                  />
                )}
              </For>
            </TableBody>
          </Table>
        </SpreadsheetProvider>
        <div class="relative mt-1.5">
          <Show when={props.pickerKey === pk()}>
            <InsumoPicker
              onSelect={(item: BudgetItem) => {
                props.handlers.addItem(props.si, props.gi, props.group.items.length, item);
                props.setPickerKey(null);
              }}
              onCancel={() => props.setPickerKey(null)}
            />
          </Show>
          <button
            onClick={() => props.setPickerKey(props.pickerKey === pk() ? null : pk())}
            class="w-full py-2 bg-transparent border border-dashed border-border/60 rounded-lg text-text-soft hover:text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
          >
            + Agregar insumo o item
          </button>
        </div>
      </div>
    </div>
  );
}
