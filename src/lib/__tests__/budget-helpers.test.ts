import { describe, it, expect } from "vitest";
import { flatGroups, updateGroup, groupSubtotal, classifyItem, createFloorBudgetGroup } from "../budget-helpers";
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

describe("groupSubtotal", () => {
  it("suma m * cu de todos los items", () => {
    const g = makeGroup("g1", [
      { d: "A", u: "m3", m: 2, cu: 100 },
      { d: "B", u: "kg", m: 5, cu: 20 },
    ]);
    expect(groupSubtotal(g)).toBe(300);
  });

  it("retorna 0 si no hay items", () => {
    expect(groupSubtotal(makeGroup("g1", []))).toBe(0);
  });

  it("maneja decimales", () => {
    const g = makeGroup("g1", [{ d: "A", u: "m2", m: 1.5, cu: 33.33 }]);
    expect(groupSubtotal(g)).toBeCloseTo(49.995, 3);
  });
});

describe("classifyItem", () => {
  it("clasifica 'MO Encofrado' como mano-de-obra", () => {
    expect(classifyItem("MO Encofrado")).toBe("mano-de-obra");
  });

  it("clasifica 'mo albañileria' como mano-de-obra", () => {
    expect(classifyItem("mo albañileria")).toBe("mano-de-obra");
  });

  it("clasifica 'Mano de obra vaciado' como mano-de-obra", () => {
    expect(classifyItem("Mano de obra vaciado")).toBe("mano-de-obra");
  });

  it("clasifica 'mano de obra' exacto como mano-de-obra", () => {
    expect(classifyItem("mano de obra")).toBe("mano-de-obra");
  });

  it("clasifica 'Concreto f'c=210' como material", () => {
    expect(classifyItem("Concreto f'c=210")).toBe("material");
  });

  it("clasifica 'Acero 3/4' como material", () => {
    expect(classifyItem("Acero 3/4")).toBe("material");
  });

  it("clasifica string vacio como material", () => {
    expect(classifyItem("")).toBe("material");
  });
});

describe("createFloorBudgetGroup", () => {
  const source: BudgetGroup = {
    id: "vigas-3p",
    cat: "VIGAS f'c=210 3er Piso",
    piso: "3er-piso",
    link: "vigas",
    areaM2: 45.5,
    areaSource: { type: "auto" },
    metradoUnit: "m3",
    items: [
      { d: "Concreto", u: "m3", m: 2.5, cu: 350 },
      { d: "Acero 3/4", u: "var", m: 10, cu: 45, factor: 1.05 },
    ],
  } as BudgetGroup;

  const result = createFloorBudgetGroup(source, "azotea", "Azotea", "vigas-azotea", "VIGAS f'c=210 Azotea");

  it("usa el nuevo id", () => {
    expect(result.id).toBe("vigas-azotea");
  });

  it("usa la nueva categoria", () => {
    expect(result.cat).toBe("VIGAS f'c=210 Azotea");
  });

  it("asigna el piso destino", () => {
    expect(result.piso).toBe("azotea");
  });

  it("resetea areaM2 a 0 si existia", () => {
    expect(result.areaM2).toBe(0);
  });

  it("conserva link del source", () => {
    expect(result.link).toBe("vigas");
  });

  it("items sin factor conservan metrado original", () => {
    expect(result.items[0].m).toBe(2.5);
  });

  it("items con factor resetean metrado a 0", () => {
    expect(result.items[1].m).toBe(0);
  });

  it("no muta el source", () => {
    expect(source.id).toBe("vigas-3p");
    expect(source.items[1].m).toBe(10);
  });

  it("areaM2 es undefined si source no lo tiene", () => {
    const noArea = { ...source, areaM2: undefined };
    const r = createFloorBudgetGroup(noArea, "az", "Az", "id", "cat");
    expect(r.areaM2).toBeUndefined();
  });
});
