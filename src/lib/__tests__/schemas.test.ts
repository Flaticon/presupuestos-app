import { describe, it, expect, vi } from "vitest";
import { z } from "zod/v4";
import {
  ProjectInfoSchema,
  NivelSchema,
  BudgetItemSchema,
  BudgetGroupSchema,
  BudgetSectionSchema,
  safeParse,
} from "../schemas";

const VALID_PROJECT = {
  id: "p1",
  name: "Tienda Miguelitos",
  building: "Edificio A",
  floor: "3er Piso",
  city: "Trujillo",
  engineer: "Roberto González",
  cip: "255614",
  fc: 210,
  fy: 4200,
  norm: "E.060",
  createdAt: "2026-01-15",
  updatedAt: "2026-02-28",
};

const VALID_NIVEL = {
  id: "3er-piso",
  label: "3er Piso",
  shortLabel: "3P",
  orden: 1,
  active: true,
  color: "#3b82f6",
};

const VALID_ITEM = { d: "Concreto", u: "m3", m: 2.5, cu: 350 };

const VALID_GROUP = {
  id: "g1",
  cat: "COLUMNAS f'c=210",
  items: [VALID_ITEM],
};

const VALID_SECTION = {
  id: "sec-concreto",
  title: "CONCRETO ARMADO",
  groups: [VALID_GROUP],
};

describe("ProjectInfoSchema", () => {
  it("acepta datos validos", () => {
    expect(ProjectInfoSchema.safeParse(VALID_PROJECT).success).toBe(true);
  });

  it("rechaza sin campo obligatorio", () => {
    const { name: _, ...incomplete } = VALID_PROJECT;
    expect(ProjectInfoSchema.safeParse(incomplete).success).toBe(false);
  });

  it("rechaza fc como string", () => {
    expect(ProjectInfoSchema.safeParse({ ...VALID_PROJECT, fc: "210" }).success).toBe(false);
  });
});

describe("NivelSchema", () => {
  it("acepta datos validos", () => {
    expect(NivelSchema.safeParse(VALID_NIVEL).success).toBe(true);
  });

  it("rechaza active como string", () => {
    expect(NivelSchema.safeParse({ ...VALID_NIVEL, active: "true" }).success).toBe(false);
  });

  it("rechaza orden como string", () => {
    expect(NivelSchema.safeParse({ ...VALID_NIVEL, orden: "1" }).success).toBe(false);
  });
});

describe("BudgetItemSchema", () => {
  it("acepta item basico", () => {
    expect(BudgetItemSchema.safeParse(VALID_ITEM).success).toBe(true);
  });

  it("acepta item con factor opcional", () => {
    expect(BudgetItemSchema.safeParse({ ...VALID_ITEM, factor: 1.05 }).success).toBe(true);
  });

  it("acepta item con insumoId opcional", () => {
    expect(BudgetItemSchema.safeParse({ ...VALID_ITEM, insumoId: "ins-001" }).success).toBe(true);
  });

  it("rechaza m como string", () => {
    expect(BudgetItemSchema.safeParse({ ...VALID_ITEM, m: "2.5" }).success).toBe(false);
  });
});

describe("BudgetGroupSchema", () => {
  it("acepta grupo valido", () => {
    expect(BudgetGroupSchema.safeParse(VALID_GROUP).success).toBe(true);
  });

  it("acepta grupo con campos opcionales", () => {
    const g = {
      ...VALID_GROUP,
      piso: "3er-piso",
      link: "columnas",
      areaM2: 45.5,
      metradoUnit: "m3",
      areaSource: { type: "auto" as const },
    };
    expect(BudgetGroupSchema.safeParse(g).success).toBe(true);
  });

  it("rechaza areaSource.type invalido", () => {
    const g = { ...VALID_GROUP, areaSource: { type: "invalid" } };
    expect(BudgetGroupSchema.safeParse(g).success).toBe(false);
  });

  it("acepta items vacio", () => {
    expect(BudgetGroupSchema.safeParse({ ...VALID_GROUP, items: [] }).success).toBe(true);
  });
});

describe("BudgetSectionSchema", () => {
  it("acepta seccion valida", () => {
    expect(BudgetSectionSchema.safeParse(VALID_SECTION).success).toBe(true);
  });

  it("rechaza sin groups", () => {
    const { groups: _, ...noGroups } = VALID_SECTION;
    expect(BudgetSectionSchema.safeParse(noGroups).success).toBe(false);
  });
});

describe("safeParse", () => {
  it("retorna datos validos", () => {
    const result = safeParse(z.array(NivelSchema), [VALID_NIVEL], "test");
    expect(result).toEqual([VALID_NIVEL]);
  });

  it("retorna null para datos invalidos", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = safeParse(z.array(NivelSchema), [{ bad: true }], "test");
    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("retorna null para tipo incorrecto", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = safeParse(z.array(ProjectInfoSchema), "not-an-array", "test");
    expect(result).toBeNull();
    spy.mockRestore();
  });

  it("log incluye label en el mensaje", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    safeParse(z.string(), 123, "mi-label");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("mi-label"),
      expect.anything(),
    );
    spy.mockRestore();
  });
});
