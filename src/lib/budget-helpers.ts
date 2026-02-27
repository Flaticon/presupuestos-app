import type { BudgetSection, BudgetGroup } from "@/lib/types";

export function flatGroups(sections: BudgetSection[]): BudgetGroup[] {
  return sections.flatMap((s) => s.groups);
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
