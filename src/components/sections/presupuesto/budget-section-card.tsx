import { For } from "solid-js";
import type { BudgetSection } from "@/lib/types";
import type { PendingEdit, BudgetHandlers } from "./types";
import { fmtS } from "@/lib/utils";
import { FlashValue } from "@/components/shared/flash-value";
import { Tooltip } from "@/components/ui/tooltip";
import { Trash2, Plus } from "lucide-solid";
import { EditableSectionTitle } from "./editable-section-title";
import { BudgetGroupCard } from "./budget-group-card";

interface BudgetSectionCardProps {
  section: BudgetSection;
  si: number;
  pendingEdit: PendingEdit | null;
  handlers: BudgetHandlers;
  undo: () => void;
  redo: () => void;
  goTo: (id: string) => void;
  pickerKey: string | null;
  setPickerKey: (key: string | null) => void;
}

export function BudgetSectionCard(props: BudgetSectionCardProps) {
  const sectionTotal = () => props.section.groups.reduce(
    (s, g) => s + g.items.reduce((ss, it) => ss + it.m * it.cu, 0),
    0,
  );

  return (
    <div class="space-y-2">
      {/* Section header */}
      <div class="rounded-xl bg-[#18181B] px-4 py-3 flex justify-between items-center">
        <EditableSectionTitle
          value={props.section.title}
          onChange={(v) => props.handlers.updateSectionTitle(props.si, v)}
        />
        <div class="flex items-center gap-3">
          <span class="text-sm font-extrabold text-white">
            <FlashValue value={sectionTotal()} format={(v) => fmtS(Number(v))} />
          </span>
          <Tooltip content="Eliminar partida completa">
            <button
              onClick={() => props.handlers.delSection(props.si)}
              class="text-white/50 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Groups (sub-partidas) within section */}
      <For each={props.section.groups}>
        {(g, gi) => (
          <BudgetGroupCard
            group={g}
            si={props.si}
            gi={gi()}
            canDelete={props.section.groups.length > 1}
            pendingEdit={props.pendingEdit}
            handlers={props.handlers}
            undo={props.undo}
            redo={props.redo}
            goTo={props.goTo}
            pickerKey={props.pickerKey}
            setPickerKey={props.setPickerKey}
          />
        )}
      </For>

      {/* Add sub-partida button */}
      <button
        onClick={() => props.handlers.addGroup(props.si)}
        class="ml-4 w-[calc(100%-1rem)] py-2 bg-transparent border border-dashed border-border/60 rounded-lg text-text-soft hover:text-text-mid text-[11px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Plus size={12} />
        Agregar sub-partida
      </button>
    </div>
  );
}
