import { createSignal, createMemo, For, Show, Switch, Match } from "solid-js";
import type { BudgetSection, BudgetGroup, BudgetItem } from "@/lib/types";
import type { PendingEdit, BudgetHandlers } from "./types";
import { groupSubtotal } from "@/lib/budget-helpers";
import { fmtS } from "@/lib/utils";
import { EditCell } from "@/components/shared/edit-cell";
import { FlashValue } from "@/components/shared/flash-value";
import { SpreadsheetProvider } from "@/components/shared/spreadsheet-context";
import { InsumoPicker } from "@/components/shared/insumo-picker";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { EditableSectionTitle } from "./editable-section-title";
import { EditableCatName } from "./editable-cat-name";
import { AreaBadge } from "./area-badge";
import { ChevronRight, ChevronDown, Trash2, Plus, Unlink } from "lucide-solid";

type FlatRow =
  | { type: "section"; section: BudgetSection; si: number }
  | { type: "group"; group: BudgetGroup; si: number; gi: number }
  | { type: "item"; item: BudgetItem; si: number; gi: number; ii: number; globalRow: number }
  | { type: "add-item"; si: number; gi: number; groupId: string }
  | { type: "add-group"; si: number }
  | { type: "total" };

interface BudgetDetailTableProps {
  budget: BudgetSection[];
  handlers: BudgetHandlers;
  pendingEdit: PendingEdit | null;
  undo: () => void;
  redo: () => void;
  goTo: (id: string) => void;
  pickerKey: string | null;
  setPickerKey: (key: string | null) => void;
}

const COLS = 6;

export function BudgetDetailTable(props: BudgetDetailTableProps) {
  const [collapsed, setCollapsed] = createSignal<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const flatRows = createMemo(() => {
    const rows: FlatRow[] = [];
    let globalRow = 0;
    for (let si = 0; si < props.budget.length; si++) {
      const section = props.budget[si];
      rows.push({ type: "section", section, si });
      for (let gi = 0; gi < section.groups.length; gi++) {
        const group = section.groups[gi];
        const groupKey = `${si}-${gi}`;
        rows.push({ type: "group", group, si, gi });
        if (!collapsed().has(groupKey)) {
          for (let ii = 0; ii < group.items.length; ii++) {
            rows.push({ type: "item", item: group.items[ii], si, gi, ii, globalRow });
            globalRow++;
          }
          rows.push({ type: "add-item", si, gi, groupId: group.id });
        }
      }
      rows.push({ type: "add-group", si });
    }
    rows.push({ type: "total" });
    return rows;
  });

  const itemRows = createMemo(() =>
    flatRows().filter((r): r is Extract<FlatRow, { type: "item" }> => r.type === "item")
  );

  const visibleItemCount = () => itemRows().length;

  const grandTotal = createMemo(() =>
    props.budget.reduce(
      (s, sec) => s + sec.groups.reduce(
        (ss, g) => ss + g.items.reduce((sss, it) => sss + it.m * it.cu, 0), 0
      ), 0
    )
  );

  const sectionTotal = (section: BudgetSection) =>
    section.groups.reduce((s, g) => g.items.reduce((ss, it) => ss + it.m * it.cu, s), 0);

  const isCellEditable = (row: number, col: number) => {
    const ir = itemRows()[row];
    if (!ir) return false;
    if (col === 1) return true;
    if (col === 3) return ir.item.factor == null;
    if (col === 4) return !ir.item.insumoId;
    return false;
  };

  const onCellChange = (row: number, col: number, value: string | number) => {
    const ir = itemRows()[row];
    if (!ir) return;
    if (col === 1) props.handlers.updateDesc(ir.si, ir.gi, ir.ii, value as string);
    else if (col === 3) props.handlers.updateMet(ir.si, ir.gi, ir.ii, value as number);
    else if (col === 4) props.handlers.updateCU(ir.si, ir.gi, ir.ii, value as number);
  };

  return (
    <div class="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div class="bg-muted/50 px-3.5 py-2 text-xs text-text-mid border-b border-border rounded-t-xl">
        <b class="text-text">Editable:</b> Click en celda → seleccionar · Doble-click → editar · Tab navega entre celdas · Ctrl+Z/Y deshacer/rehacer · Click en ▶ para expandir/contraer
      </div>

      <SpreadsheetProvider
        rows={visibleItemCount}
        cols={COLS}
        isCellEditable={isCellEditable}
        onCellChange={onCellChange}
        onUndo={props.undo}
        onRedo={props.redo}
      >
        <div class="max-h-[75vh] overflow-y-auto">
          <Table class="spreadsheet-table">
            <TableHeader>
              <TableRow>
                <TableHead class="w-8 bg-muted text-text-mid" />
                <TableHead class="text-left bg-muted text-text-mid">Descripcion</TableHead>
                <TableHead class="w-[50px] bg-muted text-text-mid">Und.</TableHead>
                <TableHead class="w-[80px] bg-muted text-text-mid">Metrado</TableHead>
                <TableHead class="w-[80px] bg-muted text-text-mid">C.Unit</TableHead>
                <TableHead class="w-[95px] text-right bg-muted text-text-mid">C.Parcial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={flatRows()}>
                {(row) => (
                  <Switch>
                    {/* ── Section header ── */}
                    <Match when={row.type === "section" && row as Extract<FlatRow, { type: "section" }>}>
                      {(r) => (
                        <TableRow class="bg-[#18181B]">
                          <TableCell class="text-center p-1">
                            <Tooltip content="Eliminar partida">
                              <button
                                onClick={() => props.handlers.delSection(r().si)}
                                class="text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </Tooltip>
                          </TableCell>
                          <TableCell class="py-2" colSpan={3}>
                            <EditableSectionTitle
                              value={r().section.title}
                              onChange={(v) => props.handlers.updateSectionTitle(r().si, v)}
                            />
                          </TableCell>
                          <TableCell />
                          <TableCell class="text-right text-sm font-extrabold text-white tabular-nums py-2">
                            <FlashValue value={sectionTotal(r().section)} format={(v) => fmtS(Number(v))} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Match>

                    {/* ── Group row ── */}
                    <Match when={row.type === "group" && row as Extract<FlatRow, { type: "group" }>}>
                      {(r) => {
                        const gKey = () => `${r().si}-${r().gi}`;
                        const isCollapsed = () => collapsed().has(gKey());
                        const sub = () => groupSubtotal(r().group);
                        const hasArea = () => r().group.areaM2 != null;

                        return (
                          <TableRow class="bg-[#18181B]/90 hover:bg-[#18181B] transition-colors">
                            <TableCell class="text-center p-1">
                              <button
                                onClick={() => toggleGroup(gKey())}
                                class="text-white/70 hover:text-white cursor-pointer p-0.5"
                              >
                                <Show when={isCollapsed()} fallback={<ChevronDown size={14} />}>
                                  <ChevronRight size={14} />
                                </Show>
                              </button>
                            </TableCell>
                            <TableCell class="py-1.5">
                              <div class="flex items-center gap-2 flex-wrap">
                                <EditableCatName
                                  value={r().group.cat}
                                  onChange={(v) => props.handlers.updateCat(r().si, r().gi, v)}
                                />
                                <AreaBadge
                                  group={r().group}
                                  si={r().si}
                                  gi={r().gi}
                                  onSync={props.handlers.syncArea}
                                />
                              </div>
                              <Show when={r().group.link && ["columnas", "vigas", "losa", "muros", "escalera"].includes(r().group.link!)}>
                                <button
                                  onClick={() => props.goTo(r().group.link!)}
                                  class="text-white/50 text-[10px] underline cursor-pointer hover:text-white/80 mt-0.5"
                                >
                                  Ver metrado →
                                </button>
                              </Show>
                            </TableCell>
                            <TableCell class="text-center text-white/50 text-[10px]">
                              <Show when={hasArea()}>
                                {r().group.metradoUnit ?? "m²"}
                              </Show>
                            </TableCell>
                            <TableCell class="text-right text-[11px] text-white/80 font-semibold tabular-nums">
                              <Show when={hasArea()}>
                                {(r().group.areaM2 ?? 0).toFixed(2)}
                              </Show>
                            </TableCell>
                            <TableCell class="text-center p-1">
                              <Show when={props.budget[r().si].groups.length > 1}>
                                <Tooltip content="Eliminar sub-partida">
                                  <button
                                    onClick={() => props.handlers.delGroup(r().si, r().gi)}
                                    class="text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </Tooltip>
                              </Show>
                            </TableCell>
                            <TableCell class="text-right text-xs font-bold text-white tabular-nums">
                              <FlashValue value={sub()} format={(v) => fmtS(Number(v))} />
                            </TableCell>
                          </TableRow>
                        );
                      }}
                    </Match>

                    {/* ── Item row ── */}
                    <Match when={row.type === "item" && row as Extract<FlatRow, { type: "item" }>}>
                      {(r) => {
                        const cp = () => r().item.m * r().item.cu;
                        const hasFactor = () => r().item.factor != null;
                        const isLinked = () => !!r().item.insumoId;
                        const isAutoEdit = () =>
                          props.pendingEdit?.si === r().si &&
                          props.pendingEdit?.gi === r().gi &&
                          props.pendingEdit?.ii === r().ii;

                        return (
                          <TableRow class={r().ii % 2 === 0 ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/30"}>
                            {/* Col 0: Delete */}
                            <TableCell class="text-center p-0.5">
                              <button
                                onClick={() => props.handlers.delItem(r().si, r().gi, r().ii)}
                                class="text-text-soft hover:text-danger transition-colors text-sm rounded px-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </TableCell>

                            {/* Col 1: Description */}
                            <TableCell class="p-0.5">
                              <EditCell
                                value={r().item.d}
                                onChange={(v) => props.handlers.updateDesc(r().si, r().gi, r().ii, v as string)}
                                type="text"
                                row={r().globalRow}
                                col={1}
                                class="text-xs text-left"
                                autoEdit={isAutoEdit()}
                              />
                            </TableCell>

                            {/* Col 2: Unit (readonly) */}
                            <TableCell class="text-center text-text-soft text-[11px] cell-readonly">
                              {r().item.u}
                            </TableCell>

                            {/* Col 3: Metrado */}
                            <TableCell class="p-0.5">
                              <Show when={!hasFactor()} fallback={
                                <div class="flex items-center gap-0.5 justify-end">
                                  <span class="text-right text-primary font-semibold text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 tabular-nums">
                                    <FlashValue value={r().item.m} format={(v) => String(v)} />
                                  </span>
                                  <Tooltip content={`Factor: ×${r().item.factor!.toFixed(4)}`}>
                                    <span class="text-[9px] text-amber-500 font-medium">×{r().item.factor!.toFixed(2)}</span>
                                  </Tooltip>
                                  <button
                                    onClick={() => props.handlers.toggleItemFactor(r().si, r().gi, r().ii)}
                                    class="text-amber-400 hover:text-red-400 cursor-pointer p-0.5"
                                    title="Desenlazar factor"
                                  >
                                    <Unlink size={9} />
                                  </button>
                                </div>
                              }>
                                <EditCell
                                  value={r().item.m}
                                  onChange={(v) => props.handlers.updateMet(r().si, r().gi, r().ii, v as number)}
                                  row={r().globalRow}
                                  col={3}
                                  class="text-right text-primary font-semibold"
                                />
                              </Show>
                            </TableCell>

                            {/* Col 4: C.Unit */}
                            <TableCell class="p-0.5">
                              <Show when={!isLinked()} fallback={
                                <Tooltip content="Precio de catalogo — editar en Insumos">
                                  <span class="relative block text-right text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold cell-readonly">
                                    <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <FlashValue value={r().item.cu} format={(v) => String(v)} />
                                  </span>
                                </Tooltip>
                              }>
                                <EditCell
                                  value={r().item.cu}
                                  onChange={(v) => props.handlers.updateCU(r().si, r().gi, r().ii, v as number)}
                                  row={r().globalRow}
                                  col={4}
                                  class="text-right text-steel-58 font-semibold"
                                />
                              </Show>
                            </TableCell>

                            {/* Col 5: C.Parcial */}
                            <TableCell class="text-right font-bold text-primary px-2">
                              <FlashValue value={cp()} format={(v) => fmtS(Number(v))} />
                            </TableCell>
                          </TableRow>
                        );
                      }}
                    </Match>

                    {/* ── Add item button ── */}
                    <Match when={row.type === "add-item" && row as Extract<FlatRow, { type: "add-item" }>}>
                      {(r) => {
                        const pk = () => `${r().si}-${r().gi}`;
                        const isOpen = () => props.pickerKey === pk();
                        return (
                          <TableRow class="border-b border-border/50">
                            <TableCell />
                            <TableCell colSpan={5} class="p-1">
                              <div class="relative">
                                <Show when={isOpen()}>
                                  <InsumoPicker
                                    onSelect={(item: BudgetItem) => {
                                      const group = props.budget[r().si]?.groups[r().gi];
                                      if (group) props.handlers.addItem(r().si, r().gi, group.items.length, item);
                                      props.setPickerKey(null);
                                    }}
                                    onCancel={() => props.setPickerKey(null)}
                                  />
                                </Show>
                                <button
                                  onClick={() => props.setPickerKey(isOpen() ? null : pk())}
                                  class="w-full py-1 text-text-mid text-[11px] font-medium hover:bg-primary-bg hover:text-primary transition-all duration-200 cursor-pointer rounded"
                                >
                                  + Agregar insumo o item
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }}
                    </Match>

                    {/* ── Add group button ── */}
                    <Match when={row.type === "add-group" && row as Extract<FlatRow, { type: "add-group" }>}>
                      {(r) => (
                        <TableRow class="border-b-2 border-border">
                          <TableCell />
                          <TableCell colSpan={5} class="p-1">
                            <button
                              onClick={() => props.handlers.addGroup(r().si)}
                              class="w-full py-1 text-text-mid text-[11px] font-medium hover:bg-primary-bg hover:text-primary transition-all duration-200 cursor-pointer rounded flex items-center justify-center gap-1"
                            >
                              <Plus size={11} />
                              Agregar sub-partida
                            </button>
                          </TableCell>
                        </TableRow>
                      )}
                    </Match>

                    {/* ── Grand total ── */}
                    <Match when={row.type === "total"}>
                      <TableRow class="bg-[#18181B]">
                        <TableCell />
                        <TableCell class="text-xs font-bold text-white py-2.5" colSpan={4}>
                          COSTO DIRECTO
                        </TableCell>
                        <TableCell class="text-right text-sm font-extrabold text-white tabular-nums py-2.5">
                          <FlashValue value={grandTotal()} format={(v) => fmtS(Number(v))} />
                        </TableCell>
                      </TableRow>
                    </Match>
                  </Switch>
                )}
              </For>
            </TableBody>
          </Table>
        </div>
      </SpreadsheetProvider>

      {/* Add new section */}
      <div class="p-2 border-t border-border">
        <button
          onClick={() => props.handlers.addSection()}
          class="w-full py-2.5 bg-transparent border border-dashed border-border/60 rounded-lg text-text-soft hover:text-text-mid text-xs font-semibold hover:bg-primary-bg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Nueva Partida
        </button>
      </div>
    </div>
  );
}
