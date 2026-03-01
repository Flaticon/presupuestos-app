import { createSignal, createMemo, createEffect, For, Show } from "solid-js";
import type { BudgetSection, BudgetGroup } from "@/lib/types";
import { groupSubtotal } from "@/lib/budget-helpers";
import { fmtS } from "@/lib/utils";
import { useInsumos } from "@/lib/insumo-context";
import { useFloors } from "@/lib/floor-context";
import { PartidaDetail } from "@/components/sections/partida-detail";
import { MetradoCell } from "@/components/shared/metrado-cell";
import { TipoBreakdownTable } from "./tipo-breakdown";
import { ConsolidatedTable } from "./consolidated-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Link2, Pencil, Plus, RefreshCw } from "lucide-solid";

export interface ResumenS10Props {
  budget: BudgetSection[];
  onUpdateDesc: (si: number, gi: number, ii: number, v: string) => void;
  onUpdateCU: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateMet: (si: number, gi: number, ii: number, v: number) => void;
  onUpdateFactor: (si: number, gi: number, ii: number, factor: number) => void;
  onToggleItemFactor: (si: number, gi: number, ii: number) => void;
  onAddItem: (si: number, gi: number, currentLen: number, item?: import("@/lib/types").BudgetItem) => void;
  onDelItem: (si: number, gi: number, ii: number) => void;
  onSyncArea?: (si: number, gi: number, newArea: number) => void;
  onUpdateArea?: (si: number, gi: number, newArea: number) => void;
  onToggleAreaSource?: (si: number, gi: number) => void;
  onAddSection?: () => void;
  onAddGroup?: (si: number) => void;
  undo: () => void;
  redo: () => void;
  goTo?: (id: string) => void;
}

export function ResumenS10(props: ResumenS10Props) {
  const { insumos } = useInsumos();
  const { floors } = useFloors();
  const insumoMap = () => new Map(insumos().map((i) => [i.id, i]));

  const flatEntries = createMemo(() => {
    const entries: { group: BudgetGroup; si: number; gi: number }[] = [];
    props.budget.forEach((section, si) => {
      section.groups.forEach((group, gi) => {
        entries.push({ group, si, gi });
      });
    });
    return entries;
  });

  const [selectedKey, setSelectedKey] = createSignal<string | null>(null);

  const pisos = createMemo(() => {
    const seen = new Set<string>();
    for (const { group } of flatEntries()) {
      if (group.piso) seen.add(group.piso);
    }
    return Array.from(seen);
  });

  const [pisoFilter, setPisoFilter] = createSignal<string>("todos");

  const floorMap = () => new Map(floors().map((f) => [f.id, f]));
  const tabs = createMemo(() => {
    const list: { id: string; label: string }[] = [{ id: "todos", label: "Todos" }];
    for (const p of pisos()) {
      const floor = floorMap().get(p);
      list.push({ id: p, label: floor?.label ?? p });
    }
    return list;
  });

  const filteredSections = createMemo(() => {
    if (pisoFilter() === "todos") return props.budget;
    return props.budget
      .map((s) => ({ ...s, groups: s.groups.filter((g) => g.piso === pisoFilter()) }))
      .filter((s) => s.groups.length > 0);
  });

  const sectionIndexMap = createMemo(() => {
    const m = new Map<string, number>();
    props.budget.forEach((s, si) => m.set(s.id, si));
    return m;
  });

  const groupIndexMap = createMemo(() => {
    const m = new Map<string, { si: number; gi: number }>();
    props.budget.forEach((s, si) => s.groups.forEach((g, gi) => m.set(g.id, { si, gi })));
    return m;
  });

  createEffect(() => {
    const sk = selectedKey();
    if (sk === null) return;
    const allKeys = new Set<string>();
    filteredSections().forEach((s) => {
      const si = sectionIndexMap().get(s.id)!;
      s.groups.forEach((_g, gi) => allKeys.add(`${si}-${gi}`));
    });
    if (!allKeys.has(sk)) setSelectedKey(null);
  });

  const grandTotal = () => filteredSections().reduce(
    (s, sec) => s + sec.groups.reduce((ss, g) => ss + groupSubtotal(g), 0), 0,
  );

  const selectedEntry = () => {
    const sk = selectedKey();
    return sk !== null
      ? flatEntries().find(({ si, gi }) => `${si}-${gi}` === sk) ?? null
      : null;
  };

  let subCounter = 0;

  return (
    <div class="space-y-6">
      {/* Floor tabs */}
      <Show when={pisos().length > 1}>
        <div class="inline-flex rounded-lg border border-border overflow-hidden">
          <For each={tabs()}>
            {(tab) => (
              <button onClick={() => setPisoFilter(tab.id)}
                class={`px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${pisoFilter() === tab.id ? "bg-[#18181B] text-white" : "bg-card text-text-mid hover:bg-muted"}`}
              >{tab.label}</button>
            )}
          </For>
        </div>
      </Show>

      {/* Section A: Side-by-side */}
      <div class={`grid gap-4 ${selectedEntry() ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-1"}`}>
        {/* Left: Table */}
        <div class="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div class="px-4 py-2.5 bg-[#18181B] rounded-t-xl flex justify-between items-center">
            <span class="text-[13px] font-semibold text-white">A. Resumen por Partida</span>
            <span class="text-sm font-extrabold text-white tabular-nums">{fmtS(grandTotal())}</span>
          </div>
          <div class="p-2 max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-8 bg-muted text-text-mid text-center">#</TableHead>
                  <TableHead class="text-left bg-muted text-text-mid">Partida / Sub-partida</TableHead>
                  <TableHead class="w-[120px] text-center bg-muted text-text-mid">Metrado</TableHead>
                  <TableHead class="w-[90px] text-center bg-muted text-text-mid">Subtotal</TableHead>
                  <TableHead class="w-[45px] text-center bg-muted text-text-mid">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  subCounter = 0;
                  return (
                    <For each={filteredSections()}>
                      {(sec) => {
                        const si = () => sectionIndexMap().get(sec.id)!;
                        const secTotal = () => sec.groups.reduce((s, g) => s + groupSubtotal(g), 0);

                        return (
                          <>
                            {/* Section header */}
                            <TableRow class="bg-[#18181B]">
                              <TableCell />
                              <TableCell class="text-xs font-bold text-white py-2" colSpan={2}>
                                {sec.title}
                              </TableCell>
                              <TableCell class="text-center text-xs font-bold text-white tabular-nums">
                                {fmtS(secTotal())}
                              </TableCell>
                              <TableCell class="text-center text-[10px] text-white/70 tabular-nums">
                                {grandTotal() > 0 ? ((secTotal() / grandTotal()) * 100).toFixed(1) : "0.0"}%
                              </TableCell>
                            </TableRow>

                            {/* Sub-partida rows */}
                            <For each={sec.groups}>
                              {(g, localGi) => {
                                subCounter++;
                                const currentCounter = subCounter;
                                const realCoords = () => groupIndexMap().get(g.id);
                                const rsi = () => realCoords()?.si ?? si();
                                const rgi = () => realCoords()?.gi ?? localGi();
                                const sub = () => groupSubtotal(g);
                                const key = () => `${rsi()}-${rgi()}`;
                                const isSelected = () => selectedKey() === key();

                                return (
                                  <TableRow
                                    onClick={() => setSelectedKey(isSelected() ? null : key())}
                                    class={`cursor-pointer transition-colors ${
                                      isSelected()
                                        ? "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary"
                                        : currentCounter % 2 === 0
                                          ? "bg-muted/30 hover:bg-muted"
                                          : "hover:bg-muted/30"
                                    }`}
                                  >
                                    <TableCell class="text-center text-text-soft text-[10px] tabular-nums">
                                      {currentCounter}
                                    </TableCell>
                                    <TableCell class="text-xs pl-5">
                                      <span class="flex items-center gap-1.5">
                                        <Show when={isSelected()}>
                                          <span class="text-primary font-bold text-[10px]">▶</span>
                                        </Show>
                                        <span class={isSelected() ? "font-semibold" : ""}>{g.cat}</span>
                                      </span>
                                    </TableCell>
                                    <TableCell class="text-center p-1">
                                      <MetradoCell
                                        group={g}
                                        si={rsi()}
                                        gi={rgi()}
                                        onUpdateArea={props.onUpdateArea}
                                        onSyncArea={props.onSyncArea}
                                        onToggleAreaSource={props.onToggleAreaSource}
                                        goTo={props.goTo}
                                      />
                                    </TableCell>
                                    <TableCell class="text-center text-xs font-semibold tabular-nums">
                                      {fmtS(sub())}
                                    </TableCell>
                                    <TableCell class="text-center text-[10px] text-text-soft tabular-nums">
                                      {grandTotal() > 0 ? ((sub() / grandTotal()) * 100).toFixed(1) : "0.0"}%
                                    </TableCell>
                                  </TableRow>
                                );
                              }}
                            </For>

                            {/* Add sub-partida button */}
                            <Show when={props.onAddGroup}>
                              <TableRow class="border-b-0">
                                <TableCell />
                                <TableCell colSpan={4} class="py-1">
                                  <button
                                    onClick={(e: MouseEvent) => { e.stopPropagation(); props.onAddGroup!(si()); }}
                                    class="w-full py-1 text-text-mid text-[11px] font-medium hover:bg-primary-bg hover:text-primary transition-all duration-200 cursor-pointer rounded flex items-center justify-center gap-1"
                                  >
                                    <Plus size={11} />
                                    Agregar sub-partida
                                  </button>
                                </TableCell>
                              </TableRow>
                            </Show>
                          </>
                        );
                      }}
                    </For>
                  );
                })()}
                <TableRow class="bg-[#18181B]">
                  <TableCell />
                  <TableCell class="text-xs font-bold text-white" colSpan={2}>COSTO DIRECTO</TableCell>
                  <TableCell class="text-center text-sm font-extrabold text-white tabular-nums">{fmtS(grandTotal())}</TableCell>
                  <TableCell class="text-center text-[10px] font-bold text-white">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Legend */}
            <div class="flex flex-wrap items-center gap-4 px-2 pt-3 pb-1 text-[10px] text-text-soft border-t border-border mt-2">
              <span class="flex items-center gap-1">
                <Link2 size={9} class="text-emerald-500" />
                <span class="text-emerald-600 dark:text-emerald-400 font-medium">Auto</span>
                — enlazado
              </span>
              <span class="flex items-center gap-1">
                <Pencil size={9} class="text-blue-400" />
                <span class="text-blue-600 dark:text-blue-400 font-medium">Manual</span>
                — editable
              </span>
              <span class="flex items-center gap-1">
                <RefreshCw size={9} class="text-amber-500" />
                Sincronizar
              </span>
            </div>

            <Show when={props.onAddSection}>
              <button
                onClick={() => props.onAddSection?.()}
                class="w-full py-2 mt-2 bg-transparent border border-dashed border-border/60 rounded-lg text-text-soft hover:text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={13} />
                Nueva Partida
              </button>
            </Show>
          </div>
        </div>

        {/* Right: Detail panel */}
        <Show when={selectedEntry()}>
          {(entry) => (
            <div class="lg:sticky lg:top-4 self-start">
              <PartidaDetail
                group={entry().group}
                si={entry().si}
                gi={entry().gi}
                onUpdateDesc={props.onUpdateDesc}
                onUpdateCU={props.onUpdateCU}
                onUpdateMet={props.onUpdateMet}
                onUpdateFactor={props.onUpdateFactor}
                onToggleItemFactor={props.onToggleItemFactor}
                onAddItem={props.onAddItem}
                onDelItem={props.onDelItem}
                onSyncArea={props.onSyncArea}
                undo={props.undo}
                redo={props.redo}
              />
            </div>
          )}
        </Show>
      </div>

      {/* Section B + C side by side */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TipoBreakdownTable sections={filteredSections()} insumoMap={insumoMap} />
        <ConsolidatedTable sections={filteredSections()} insumoMap={insumoMap} />
      </div>
    </div>
  );
}
