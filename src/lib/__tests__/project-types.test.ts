import { describe, it, expect } from "vitest";
import {
  getProjectLabel,
  getProjectSubtitle,
  getExportFilename,
  getPageTitle,
} from "../project-types";
import type { ProjectInfo } from "../project-types";

const PROJECT: ProjectInfo = {
  id: "p1",
  name: "Tienda Miguelitos",
  building: "Edificio Comercial",
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

describe("getProjectLabel", () => {
  it("combina floor y name con guion", () => {
    expect(getProjectLabel(PROJECT)).toBe("3er Piso — Tienda Miguelitos");
  });
});

describe("getProjectSubtitle", () => {
  it("incluye building, city, fc, fy y norm", () => {
    const result = getProjectSubtitle(PROJECT);
    expect(result).toBe("Edificio Comercial · Trujillo · f'c=210 · fy=4200 · E.060");
  });
});

describe("getExportFilename", () => {
  it("genera nombre con slug y extension", () => {
    expect(getExportFilename(PROJECT, "csv")).toBe("presupuesto-tienda-miguelitos-3erPiso.csv");
  });

  it("genera con extension xlsx", () => {
    expect(getExportFilename(PROJECT, "xlsx")).toBe("presupuesto-tienda-miguelitos-3erPiso.xlsx");
  });

  it("genera con extension pdf", () => {
    expect(getExportFilename(PROJECT, "pdf")).toBe("presupuesto-tienda-miguelitos-3erPiso.pdf");
  });

  it("maneja caracteres especiales en name", () => {
    const p = { ...PROJECT, name: "Tienda #1 (Centro)" };
    const result = getExportFilename(p, "csv");
    expect(result).toBe("presupuesto-tienda-1-centro-3erPiso.csv");
  });

  it("elimina trailing dash del slug", () => {
    const p = { ...PROJECT, name: "Test ---" };
    const result = getExportFilename(p, "csv");
    expect(result).toBe("presupuesto-test-3erPiso.csv");
  });

  it("elimina espacios del floor", () => {
    const p = { ...PROJECT, floor: "3er  Piso  Alto" };
    const result = getExportFilename(p, "csv");
    expect(result).toBe("presupuesto-tienda-miguelitos-3erPisoAlto.csv");
  });
});

describe("getPageTitle", () => {
  it("genera titulo con floor y name", () => {
    expect(getPageTitle(PROJECT)).toBe("Metrados — 3er Piso Tienda Miguelitos");
  });
});
