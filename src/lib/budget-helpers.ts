import type { BudgetSection, BudgetGroup } from "@/lib/types";

export function flatGroups(sections: BudgetSection[]): BudgetGroup[] {
  return sections.flatMap((s) => s.groups);
}

export function groupSubtotal(g: BudgetGroup): number {
  return g.items.reduce((s, it) => s + it.m * it.cu, 0);
}

export function classifyItem(d: string): "mano-de-obra" | "material" {
  const dl = d.toLowerCase();
  if (dl.startsWith("mo ") || dl.startsWith("mano de obra") || dl === "mano de obra") return "mano-de-obra";
  return "material";
}

export function updateGroup(
  sections: BudgetSection[],
  si: number,
  gi: number,
  updater: (g: BudgetGroup) => BudgetGroup,
): BudgetSection[] {
  return sections.map((s, i) =>
    i === si
      ? { ...s, groups: s.groups.map((g, j) => (j === gi ? updater(g) : g)) }
      : s,
  );
}

// ── Floor group templates for auto-creation ──

export interface FloorGroupTemplate {
  sourceGroupId: string;
  sectionKey: string;
  budgetSectionId: string;
  idPattern: string;
  catPattern: string;
  link?: string;
  companions: {
    sourceGroupId: string;
    budgetSectionId: string;
    idPattern: string;
    catPattern: string;
  }[];
}

export const FLOOR_GROUP_TEMPLATES: FloorGroupTemplate[] = [
  {
    sourceGroupId: "vigas-3p",
    sectionKey: "vigas",
    budgetSectionId: "sec-concreto",
    idPattern: "vigas-{floor}",
    catPattern: "VIGAS f'c=210 {label}",
    link: "vigas",
    companions: [
      {
        sourceGroupId: "tarrajeo-vigas",
        budgetSectionId: "sec-reboques",
        idPattern: "tarrajeo-vigas-{floor}",
        catPattern: "TARRAJEO VIGAS {label}",
      },
    ],
  },
  {
    sourceGroupId: "losa-3p",
    sectionKey: "losa",
    budgetSectionId: "sec-concreto",
    idPattern: "losa-{floor}",
    catPattern: "LOSA ALIGERADA {label}",
    link: "losa",
    companions: [
      {
        sourceGroupId: "cieloraso-3p",
        budgetSectionId: "sec-reboques",
        idPattern: "cieloraso-{floor}",
        catPattern: "CIELORASO {label}",
      },
    ],
  },
  {
    sourceGroupId: "escalera-3p",
    sectionKey: "escalera",
    budgetSectionId: "sec-concreto",
    idPattern: "escalera-{floor}",
    catPattern: "ESCALERA {label}",
    link: "escalera",
    companions: [
      {
        sourceGroupId: "revest-escalera",
        budgetSectionId: "sec-reboques",
        idPattern: "revest-escalera-{floor}",
        catPattern: "REVEST. ESCALERA {label}",
      },
    ],
  },
];

export function createFloorBudgetGroup(
  source: BudgetGroup,
  floorId: string,
  floorLabel: string,
  newId: string,
  newCat: string,
): BudgetGroup {
  return {
    ...source,
    id: newId,
    cat: newCat,
    piso: floorId,
    areaM2: source.areaM2 != null ? 0 : undefined,
    areaSource: source.areaSource ? { ...source.areaSource } : undefined,
    metradoUnit: source.metradoUnit,
    link: source.link,
    items: source.items.map((it) => ({
      ...it,
      m: it.factor != null ? 0 : it.m,
    })),
  };
}
