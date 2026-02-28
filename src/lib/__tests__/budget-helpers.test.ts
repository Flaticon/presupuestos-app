import { describe, it, expect } from "vitest";
import { flatGroups, updateGroup } from "../budget-helpers";
import type { BudgetSection, BudgetGroup } from "../types";

function makeGroup(id: string, items = [{ d: "test", u: "Gbl.", m: 1, cu: 10 }]): BudgetGroup {
  return { id, cat: `Cat ${id}`, items };
}

function makeSections(...groupCounts: number[]): BudgetSection[] {
  return groupCounts.map((count, si) => ({
    id: `sec-${si}`,
    title: `Seccion ${si}`,
    groups: Array.from({ length: count }, (_, gi) => makeGroup(`grp-${si}-${gi}`)),
  }));
}

describe("flatGroups", () => {
  it("extrae todos los grupos de multiples secciones", () => {
    const sections = makeSections(2, 3);
    const result = flatGroups(sections);
    expect(result).toHaveLength(5);
  });

  it("retorna array vacio para secciones vacias", () => {
    expect(flatGroups([])).toEqual([]);
  });

  it("retorna array vacio para secciones sin grupos", () => {
    const sections: BudgetSection[] = [
      { id: "s1", title: "Sec1", groups: [] },
    ];
    expect(flatGroups(sections)).toEqual([]);
  });

  it("preserva orden de grupos", () => {
    const sections = makeSections(2, 1);
    const result = flatGroups(sections);
    expect(result.map((g) => g.id)).toEqual(["grp-0-0", "grp-0-1", "grp-1-0"]);
  });

  it("preserva items dentro de grupos", () => {
    const sections: BudgetSection[] = [{
      id: "s1",
      title: "Sec",
      groups: [makeGroup("g1", [
        { d: "A", u: "m²", m: 5, cu: 100 },
        { d: "B", u: "Gbl.", m: 1, cu: 50 },
      ])],
    }];
    const result = flatGroups(sections);
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items[0].d).toBe("A");
  });
});

describe("updateGroup", () => {
  it("actualiza el grupo correcto por indices si/gi", () => {
    const sections = makeSections(2, 2);
    const result = updateGroup(sections, 1, 0, (g) => ({ ...g, cat: "Modificado" }));
    expect(result[1].groups[0].cat).toBe("Modificado");
    // otros no cambian
    expect(result[0].groups[0].cat).toBe("Cat grp-0-0");
    expect(result[1].groups[1].cat).toBe("Cat grp-1-1");
  });

  it("no muta el array original", () => {
    const sections = makeSections(1);
    const original = JSON.parse(JSON.stringify(sections));
    updateGroup(sections, 0, 0, (g) => ({ ...g, cat: "Nuevo" }));
    expect(sections).toEqual(original);
  });

  it("puede agregar items a un grupo", () => {
    const sections = makeSections(1);
    const result = updateGroup(sections, 0, 0, (g) => ({
      ...g,
      items: [...g.items, { d: "Nuevo", u: "Gbl.", m: 1, cu: 0 }],
    }));
    expect(result[0].groups[0].items).toHaveLength(2);
  });

  it("puede eliminar items de un grupo", () => {
    const sections: BudgetSection[] = [{
      id: "s1",
      title: "Sec",
      groups: [makeGroup("g1", [
        { d: "A", u: "m²", m: 5, cu: 100 },
        { d: "B", u: "Gbl.", m: 1, cu: 50 },
      ])],
    }];
    const result = updateGroup(sections, 0, 0, (g) => ({
      ...g,
      items: g.items.filter((_, i) => i !== 0),
    }));
    expect(result[0].groups[0].items).toHaveLength(1);
    expect(result[0].groups[0].items[0].d).toBe("B");
  });

  it("puede modificar areaM2 del grupo", () => {
    const sections: BudgetSection[] = [{
      id: "s1",
      title: "Sec",
      groups: [{ ...makeGroup("g1"), areaM2: 10 }],
    }];
    const result = updateGroup(sections, 0, 0, (g) => ({ ...g, areaM2: 25.5 }));
    expect(result[0].groups[0].areaM2).toBe(25.5);
  });
});
