import { createSignal, createEffect, Show, untrack } from "solid-js";
import { BUDGET_INIT } from "@/data/budget-data";
import type { BudgetItem, BudgetGroup, BudgetSection } from "@/lib/types";
import { updateGroup, flatGroups, FLOOR_GROUP_TEMPLATES, createFloorBudgetGroup } from "@/lib/budget-helpers";
import { useProject } from "@/lib/project-context";
import { useInsumos } from "@/lib/insumo-context";
import { useFloors } from "@/lib/floor-context";
import { useSectionData } from "@/lib/section-data-context";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { usePersistence } from "@/hooks/use-persistence";
import { ResumenS10 } from "@/components/sections/resumen-s10";
import type { PendingEdit, BudgetHandlers } from "./types";
import { BudgetKPI } from "./budget-kpi";
import { ExportToolbar } from "./export-toolbar";
import { BudgetDetailTable } from "./budget-detail-table";

interface PresupuestoProps {
  goTo: (id: string) => void;
}

/** If persisted data is the old flat BudgetGroup[] format, return null to use defaults */
function migrateBudget(data: unknown): BudgetSection[] | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  if (!data[0].groups) return null;

  const initMap = new Map<string, BudgetGroup>();
  for (const sec of BUDGET_INIT) {
    for (const g of sec.groups) initMap.set(g.id, g);
  }

  const sections = data as BudgetSection[];
  for (const sec of sections) {
    for (let i = 0; i < sec.groups.length; i++) {
      const g = sec.groups[i];
      const init = initMap.get(g.id);
      if (init) {
        if (g.areaM2 == null && init.areaM2 != null) g.areaM2 = init.areaM2;
        if (!g.areaSource && init.areaSource) g.areaSource = init.areaSource;
        if (!g.metradoUnit && init.metradoUnit) g.metradoUnit = init.metradoUnit;
        if (!g.link && init.link) g.link = init.link;
      }
    }
  }
  return sections;
}

function deepCloneSections(sections: BudgetSection[]): BudgetSection[] {
  return sections.map((s) => ({
    ...s,
    groups: s.groups.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it })) })),
  }));
}

export function Presupuesto(props: PresupuestoProps) {
  const { activeProject } = useProject();
  const { insumos } = useInsumos();
  const { floors } = useFloors();
  const sectionData = useSectionData();
  const { state: budget, setState: setBudget, undo, redo } = useUndoRedo<BudgetSection[]>(
    () => deepCloneSections(BUDGET_INIT)
  );
  usePersistence("budget", budget, setBudget, migrateBudget);

  const [view, setView] = createSignal<"detalle" | "resumen">("detalle");
  const [pendingEdit, setPendingEdit] = createSignal<PendingEdit | null>(null);
  const [pickerKey, setPickerKey] = createSignal<string | null>(null);

  createEffect(() => {
    if (pendingEdit() !== null) setPendingEdit(null);
  });

  // --- All callbacks ---

  const updateDesc = (si: number, gi: number, ii: number, v: string) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g, items: g.items.map((it, k) => (k === ii ? { ...it, d: v } : it)),
    })));
  };

  const updateCU = (si: number, gi: number, ii: number, v: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g, items: g.items.map((it, k) => (k === ii ? { ...it, cu: v } : it)),
    })));
  };

  const updateMet = (si: number, gi: number, ii: number, v: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g, items: g.items.map((it, k) => (k === ii ? { ...it, m: v } : it)),
    })));
  };

  const addItem = (si: number, gi: number, currentLen: number, item?: BudgetItem) => {
    setPendingEdit({ si, gi, ii: currentLen });
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g, items: [...g.items, item ?? { d: "Nuevo item", u: "Gbl.", m: 1, cu: 0 }],
    })));
  };

  const delItem = (si: number, gi: number, ii: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({
      ...g, items: g.items.filter((_, x) => x !== ii),
    })));
  };

  const syncArea = (si: number, gi: number, newArea: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const group = { ...g, areaM2: +newArea.toFixed(2) };
      group.items = group.items.map((it) =>
        it.factor != null ? { ...it, m: +(newArea * it.factor).toFixed(2) } : it
      );
      return group;
    }));
  };

  const updateFactor = (si: number, gi: number, ii: number, factor: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const area = g.areaM2 ?? 0;
      return {
        ...g,
        items: g.items.map((it, k) =>
          k === ii ? { ...it, factor, m: +(area * factor).toFixed(2) } : it
        ),
      };
    }));
  };

  const toggleItemFactor = (si: number, gi: number, ii: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const area = g.areaM2 ?? 0;
      return {
        ...g,
        items: g.items.map((it, k) => {
          if (k !== ii) return it;
          if (it.factor != null) {
            const { factor: _f, ...rest } = it;
            return rest;
          }
          const defaultFactor = area > 0 && it.m > 0 ? +(it.m / area).toFixed(4) : 1;
          return { ...it, factor: defaultFactor, m: +(area * defaultFactor).toFixed(2) };
        }),
      };
    }));
  };

  const updateArea = (si: number, gi: number, newArea: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      const group = { ...g, areaM2: +newArea.toFixed(2) };
      group.items = group.items.map((it) =>
        it.factor != null ? { ...it, m: +(newArea * it.factor).toFixed(2) } : it
      );
      return group;
    }));
  };

  const toggleAreaSource = (si: number, gi: number) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => {
      if (!g.areaSource) return { ...g, areaM2: 0, areaSource: { type: "manual", nota: "Metrado manual" } };
      const newType = g.areaSource.type === "manual" ? "auto" : "manual";
      return { ...g, areaSource: { ...g.areaSource, type: newType } };
    }));
  };

  const updateCat = (si: number, gi: number, newName: string) => {
    setBudget((p) => updateGroup(p, si, gi, (g) => ({ ...g, cat: newName })));
  };

  const updateSectionTitle = (si: number, newTitle: string) => {
    setBudget((p) => p.map((s, i) => (i === si ? { ...s, title: newTitle } : s)));
  };

  const addSection = () => {
    setBudget((p) => [
      ...p,
      {
        id: `sec-${Date.now()}`,
        title: `${p.length + 1}. NUEVA PARTIDA`,
        groups: [{
          id: `grp-${Date.now()}`,
          cat: `${p.length + 1}.1 Nueva sub-partida`,
          items: [{ d: "Nuevo item", u: "Gbl.", m: 1, cu: 0 }],
        }],
      },
    ]);
  };

  const delSection = (si: number) => {
    setBudget((p) => p.filter((_, i) => i !== si));
  };

  const addGroup = (si: number) => {
    setBudget((p) =>
      p.map((s, i) =>
        i === si
          ? {
              ...s,
              groups: [
                ...s.groups,
                {
                  id: `grp-${Date.now()}`,
                  cat: `${s.title.split(".")[0]}.${s.groups.length + 1} Nueva sub-partida`,
                  items: [{ d: "Nuevo item", u: "Gbl.", m: 1, cu: 0 }],
                },
              ],
            }
          : s,
      ),
    );
  };

  const delGroup = (si: number, gi: number) => {
    setBudget((p) =>
      p.map((s, i) =>
        i === si ? { ...s, groups: s.groups.filter((_, j) => j !== gi) } : s,
      ),
    );
  };

  // Sync insumo prices from context -> budget items
  let prevPrices: Map<string, number> = new Map();
  createEffect(() => {
    const currentInsumos = insumos();
    const priceMap = new Map(currentInsumos.map((i) => [i.id, i.precio]));
    const prev = prevPrices;
    const changed: string[] = [];
    for (const [id, precio] of priceMap) {
      if (prev.has(id) && prev.get(id) !== precio) changed.push(id);
    }
    prevPrices = priceMap;
    if (changed.length === 0) return;
    setBudget((b) =>
      b.map((s) => ({
        ...s,
        groups: s.groups.map((g) => ({
          ...g,
          items: g.items.map((it) =>
            it.insumoId && changed.includes(it.insumoId)
              ? { ...it, cu: priceMap.get(it.insumoId)! }
              : it
          ),
        })),
      }))
    );
  });

  // Auto-create budget groups when new floors appear in section data
  createEffect(() => {
    const agg = sectionData();
    const existingIds = new Set(untrack(() => flatGroups(budget()).map((g) => g.id)));
    const floorList = floors();
    const toAdd: { sectionId: string; group: BudgetGroup }[] = [];

    for (const tmpl of FLOOR_GROUP_TEMPLATES) {
      const sectionAgg = agg[tmpl.sectionKey as keyof typeof agg];
      if (!sectionAgg || !("byFloor" in sectionAgg)) continue;
      const byFloor = (sectionAgg as { byFloor: Record<string, unknown> }).byFloor;

      for (const floorId of Object.keys(byFloor)) {
        const newId = tmpl.idPattern.replace("{floor}", floorId);
        if (existingIds.has(newId)) continue;

        const floorInfo = floorList.find((f) => f.id === floorId);
        const floorLabel = floorInfo?.label ?? floorId;

        // Find source group in current budget
        const sourceGroup = untrack(() => flatGroups(budget()).find((g) => g.id === tmpl.sourceGroupId));
        if (!sourceGroup) continue;

        const newCat = tmpl.catPattern.replace("{label}", floorLabel);
        const newGroup = createFloorBudgetGroup(sourceGroup, floorId, floorLabel, newId, newCat);
        toAdd.push({ sectionId: tmpl.budgetSectionId, group: newGroup });
        existingIds.add(newId);

        // Add companion groups
        for (const comp of tmpl.companions) {
          const compNewId = comp.idPattern.replace("{floor}", floorId);
          if (existingIds.has(compNewId)) continue;
          const compSource = untrack(() => flatGroups(budget()).find((g) => g.id === comp.sourceGroupId));
          if (!compSource) continue;
          const compCat = comp.catPattern.replace("{label}", floorLabel);
          const compGroup = createFloorBudgetGroup(compSource, floorId, floorLabel, compNewId, compCat);
          toAdd.push({ sectionId: comp.budgetSectionId, group: compGroup });
          existingIds.add(compNewId);
        }
      }
    }

    if (toAdd.length > 0) {
      setBudget((prev) =>
        prev.map((s) => {
          const groupsForSection = toAdd.filter((a) => a.sectionId === s.id);
          if (groupsForSection.length === 0) return s;
          return { ...s, groups: [...s.groups, ...groupsForSection.map((a) => a.group)] };
        })
      );
    }
  });

  // --- Derived ---

  const allGroups = () => flatGroups(budget());
  const grandTotal = () => allGroups().reduce(
    (s, g) => s + g.items.reduce((ss, it) => ss + it.m * it.cu, 0), 0,
  );
  const totalItems = () => allGroups().reduce((s, g) => s + g.items.length, 0);
  const totalGroups = () => allGroups().length;

  const handlers: BudgetHandlers = {
    updateDesc, updateCU, updateMet, addItem, delItem, syncArea,
    updateFactor, toggleItemFactor, updateArea, toggleAreaSource,
    updateCat, updateSectionTitle, addSection, delSection, addGroup, delGroup,
  };

  return (
    <div class="space-y-4">
      <BudgetKPI
        grandTotal={grandTotal()}
        totalItems={totalItems()}
        totalGroups={totalGroups()}
        totalSections={budget().length}
      />

      <ExportToolbar
        view={view()}
        setView={setView}
        budget={budget()}
        activeProject={activeProject}
        insumos={insumos()}
        floors={floors()}
        goTo={props.goTo}
      />

      <Show when={view() === "resumen"}>
        <ResumenS10
          budget={budget()}
          onUpdateDesc={updateDesc}
          onUpdateCU={updateCU}
          onUpdateMet={updateMet}
          onUpdateFactor={updateFactor}
          onToggleItemFactor={toggleItemFactor}
          onAddItem={addItem}
          onDelItem={delItem}
          onSyncArea={syncArea}
          onUpdateArea={updateArea}
          onToggleAreaSource={toggleAreaSource}
          onAddSection={addSection}
          onAddGroup={addGroup}
          undo={undo}
          redo={redo}
          goTo={props.goTo}
        />
      </Show>

      <Show when={view() === "detalle"}>
        <BudgetDetailTable
          budget={budget()}
          handlers={handlers}
          pendingEdit={pendingEdit()}
          undo={undo}
          redo={redo}
          goTo={props.goTo}
          pickerKey={pickerKey()}
          setPickerKey={setPickerKey}
        />
      </Show>
    </div>
  );
}
