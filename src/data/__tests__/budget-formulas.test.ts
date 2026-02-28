import { describe, it, expect } from "vitest";
import { BUDGET_FORMULAS, resolveFormula } from "../budget-formulas";
import type { SectionAggregates } from "@/lib/section-data-context";

function emptyAgg(): SectionAggregates {
  return { muros: null, vigas: null, columnas: null, losa: null, escalera: null };
}

describe("BUDGET_FORMULAS", () => {
  // ── Null handling: retorna null cuando faltan datos ──

  describe("null handling", () => {
    const agg = emptyAgg();

    it("columnas-3p retorna null sin datos de columnas", () => {
      expect(BUDGET_FORMULAS["columnas-3p"](agg)).toBeNull();
    });

    it("vigas-3p retorna null sin datos de vigas", () => {
      expect(BUDGET_FORMULAS["vigas-3p"](agg)).toBeNull();
    });

    it("losa-3p retorna null sin datos de losa", () => {
      expect(BUDGET_FORMULAS["losa-3p"](agg)).toBeNull();
    });

    it("escalera-3p retorna null sin datos de escalera", () => {
      expect(BUDGET_FORMULAS["escalera-3p"](agg)).toBeNull();
    });

    it("tarrajeo-ie retorna null sin datos de muros", () => {
      expect(BUDGET_FORMULAS["tarrajeo-ie"](agg)).toBeNull();
    });
  });

  // ── Columnas ──

  describe("columnas-3p", () => {
    it("retorna volTotal del 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        columnas: {
          areaTarrajeo: 30,
          volTotal: 8.5,
          byFloor: {
            "3er-piso": { areaTarrajeo: 20, volTotal: 5.2 },
            "azotea": { areaTarrajeo: 10, volTotal: 3.3 },
          },
        },
      };
      const result = BUDGET_FORMULAS["columnas-3p"](agg);
      expect(result).not.toBeNull();
      expect(result!.value).toBe(5.2);
      expect(result!.detail).toContain("5.20");
    });

    it("retorna null si no hay piso 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        columnas: {
          areaTarrajeo: 10,
          volTotal: 3,
          byFloor: { "azotea": { areaTarrajeo: 10, volTotal: 3 } },
        },
      };
      expect(BUDGET_FORMULAS["columnas-3p"](agg)).toBeNull();
    });
  });

  describe("columnas-az", () => {
    it("retorna volTotal de azotea", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        columnas: {
          areaTarrajeo: 30,
          volTotal: 8.5,
          byFloor: {
            "3er-piso": { areaTarrajeo: 20, volTotal: 5.2 },
            "azotea": { areaTarrajeo: 10, volTotal: 3.3 },
          },
        },
      };
      const result = BUDGET_FORMULAS["columnas-az"](agg);
      expect(result!.value).toBe(3.3);
    });
  });

  // ── Vigas (byFloor) ──

  describe("vigas-3p", () => {
    it("retorna volTotal de vigas 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        vigas: { encTotal: 45.3, volTotal: 6.8, byFloor: { "3er-piso": { encTotal: 45.3, volTotal: 6.8 } } },
      };
      const result = BUDGET_FORMULAS["vigas-3p"](agg);
      expect(result!.value).toBe(6.8);
      expect(result!.detail).toContain("6.80");
    });
  });

  describe("tarrajeo-vigas", () => {
    it("retorna encTotal de vigas 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        vigas: { encTotal: 45.3, volTotal: 6.8, byFloor: { "3er-piso": { encTotal: 45.3, volTotal: 6.8 } } },
      };
      const result = BUDGET_FORMULAS["tarrajeo-vigas"](agg);
      expect(result!.value).toBe(45.3);
    });
  });

  // ── Losa (byFloor) ──

  describe("losa-3p", () => {
    it("retorna volTotal de losa 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        losa: { areaTotal: 120, volTotal: 14.4, byFloor: { "3er-piso": { areaTotal: 120, volTotal: 14.4 } } },
      };
      const result = BUDGET_FORMULAS["losa-3p"](agg);
      expect(result!.value).toBe(14.4);
    });
  });

  describe("cieloraso-3p", () => {
    it("retorna areaTotal de losa 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        losa: { areaTotal: 120, volTotal: 14.4, byFloor: { "3er-piso": { areaTotal: 120, volTotal: 14.4 } } },
      };
      const result = BUDGET_FORMULAS["cieloraso-3p"](agg);
      expect(result!.value).toBe(120);
    });
  });

  // ── Escalera (byFloor) ──

  describe("escalera-3p", () => {
    it("retorna volTotal de escalera 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        escalera: { encTotal: 18.5, volTotal: 2.1, byFloor: { "3er-piso": { encTotal: 18.5, volTotal: 2.1 } } },
      };
      const result = BUDGET_FORMULAS["escalera-3p"](agg);
      expect(result!.value).toBe(2.1);
    });
  });

  describe("revest-escalera", () => {
    it("retorna encTotal de escalera 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        escalera: { encTotal: 18.5, volTotal: 2.1, byFloor: { "3er-piso": { encTotal: 18.5, volTotal: 2.1 } } },
      };
      const result = BUDGET_FORMULAS["revest-escalera"](agg);
      expect(result!.value).toBe(18.5);
    });
  });

  // ── Muros / Tarrajeo ──

  describe("tarrajeo-ie", () => {
    it("retorna areaBruta × 2 del 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        muros: {
          byFloor: {
            "3er-piso": { areaBruta: 85.5, areaNueva: 70, lad: 5000, mort: 2, cem: 10, arena: 3 },
          },
        },
      };
      const result = BUDGET_FORMULAS["tarrajeo-ie"](agg);
      expect(result!.value).toBe(171);
    });

    it("retorna null si no hay 3er-piso en muros", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        muros: {
          byFloor: {
            "azotea": { areaBruta: 30, areaNueva: 25, lad: 1000, mort: 1, cem: 5, arena: 1 },
          },
        },
      };
      expect(BUDGET_FORMULAS["tarrajeo-ie"](agg)).toBeNull();
    });
  });

  describe("tarrajeo-col", () => {
    it("retorna areaTarrajeo de columnas 3er-piso", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        columnas: {
          areaTarrajeo: 30,
          volTotal: 8,
          byFloor: {
            "3er-piso": { areaTarrajeo: 22.5, volTotal: 5 },
          },
        },
      };
      const result = BUDGET_FORMULAS["tarrajeo-col"](agg);
      expect(result!.value).toBe(22.5);
    });
  });

  describe("muros-az", () => {
    it("retorna areaNueva de azotea", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        muros: {
          byFloor: {
            "azotea": { areaBruta: 30, areaNueva: 25.33, lad: 1000, mort: 1, cem: 5, arena: 1 },
          },
        },
      };
      const result = BUDGET_FORMULAS["muros-az"](agg);
      expect(result!.value).toBe(25.33);
    });
  });

  describe("tarrajeo-par-az", () => {
    it("retorna areaNueva × 2 de azotea", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        muros: {
          byFloor: {
            "azotea": { areaBruta: 30, areaNueva: 15, lad: 1000, mort: 1, cem: 5, arena: 1 },
          },
        },
      };
      const result = BUDGET_FORMULAS["tarrajeo-par-az"](agg);
      expect(result!.value).toBe(30);
    });
  });

  // ── Azotea vigas/losa ──

  describe("vigas-az", () => {
    it("retorna volTotal de vigas azotea", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        vigas: { encTotal: 50, volTotal: 10, byFloor: { "azotea": { encTotal: 20, volTotal: 4.5 } } },
      };
      const result = BUDGET_FORMULAS["vigas-az"](agg);
      expect(result!.value).toBe(4.5);
    });
  });

  describe("losa-az", () => {
    it("retorna volTotal de losa azotea", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        losa: { areaTotal: 200, volTotal: 25, byFloor: { "azotea": { areaTotal: 80, volTotal: 10 } } },
      };
      const result = BUDGET_FORMULAS["losa-az"](agg);
      expect(result!.value).toBe(10);
    });
  });

  describe("tarrajeo-vig-az", () => {
    it("retorna encTotal de vigas azotea", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        vigas: { encTotal: 50, volTotal: 10, byFloor: { "azotea": { encTotal: 20, volTotal: 4.5 } } },
      };
      const result = BUDGET_FORMULAS["tarrajeo-vig-az"](agg);
      expect(result!.value).toBe(20);
    });
  });

  describe("cieloraso-az", () => {
    it("retorna areaTotal de losa azotea", () => {
      const agg: SectionAggregates = {
        ...emptyAgg(),
        losa: { areaTotal: 200, volTotal: 25, byFloor: { "azotea": { areaTotal: 80, volTotal: 10 } } },
      };
      const result = BUDGET_FORMULAS["cieloraso-az"](agg);
      expect(result!.value).toBe(80);
    });
  });

  // ── Consistencia general ──

  describe("todas las formulas tienen estructura valida", () => {
    const formulaIds = Object.keys(BUDGET_FORMULAS);

    it("hay al menos 10 formulas registradas", () => {
      expect(formulaIds.length).toBeGreaterThanOrEqual(10);
    });

    it("cada formula es una funcion", () => {
      for (const id of formulaIds) {
        expect(typeof BUDGET_FORMULAS[id]).toBe("function");
      }
    });

    it("cada formula retorna null con aggregates vacios", () => {
      const agg = emptyAgg();
      for (const id of formulaIds) {
        const result = BUDGET_FORMULAS[id](agg);
        expect(result).toBeNull();
      }
    });
  });
});

describe("resolveFormula", () => {
  it("resuelve formulas estaticas", () => {
    const agg: SectionAggregates = {
      ...emptyAgg(),
      vigas: { encTotal: 45.3, volTotal: 6.8, byFloor: { "3er-piso": { encTotal: 45.3, volTotal: 6.8 } } },
    };
    const result = resolveFormula("vigas-3p", agg);
    expect(result!.value).toBe(6.8);
  });

  it("resuelve vigas por piso dinámico", () => {
    const agg: SectionAggregates = {
      ...emptyAgg(),
      vigas: { encTotal: 50, volTotal: 10, byFloor: { "azotea": { encTotal: 20, volTotal: 4.5 } } },
    };
    const result = resolveFormula("vigas-azotea", agg);
    expect(result!.value).toBe(4.5);
  });

  it("resuelve tarrajeo-vigas por piso dinámico", () => {
    const agg: SectionAggregates = {
      ...emptyAgg(),
      vigas: { encTotal: 50, volTotal: 10, byFloor: { "azotea": { encTotal: 20, volTotal: 4.5 } } },
    };
    const result = resolveFormula("tarrajeo-vigas-azotea", agg);
    expect(result!.value).toBe(20);
  });

  it("resuelve losa por piso dinámico", () => {
    const agg: SectionAggregates = {
      ...emptyAgg(),
      losa: { areaTotal: 200, volTotal: 25, byFloor: { "4to-piso": { areaTotal: 80, volTotal: 10 } } },
    };
    const result = resolveFormula("losa-4to-piso", agg);
    expect(result!.value).toBe(10);
  });

  it("resuelve cieloraso por piso dinámico", () => {
    const agg: SectionAggregates = {
      ...emptyAgg(),
      losa: { areaTotal: 200, volTotal: 25, byFloor: { "4to-piso": { areaTotal: 80, volTotal: 10 } } },
    };
    const result = resolveFormula("cieloraso-4to-piso", agg);
    expect(result!.value).toBe(80);
  });

  it("resuelve escalera por piso dinámico", () => {
    const agg: SectionAggregates = {
      ...emptyAgg(),
      escalera: { encTotal: 30, volTotal: 5, byFloor: { "azotea": { encTotal: 12, volTotal: 2.3 } } },
    };
    const result = resolveFormula("escalera-azotea", agg);
    expect(result!.value).toBe(2.3);
  });

  it("resuelve revest-escalera por piso dinámico", () => {
    const agg: SectionAggregates = {
      ...emptyAgg(),
      escalera: { encTotal: 30, volTotal: 5, byFloor: { "azotea": { encTotal: 12, volTotal: 2.3 } } },
    };
    const result = resolveFormula("revest-escalera-azotea", agg);
    expect(result!.value).toBe(12);
  });

  it("retorna null para id desconocido", () => {
    expect(resolveFormula("unknown-id", emptyAgg())).toBeNull();
  });
});
