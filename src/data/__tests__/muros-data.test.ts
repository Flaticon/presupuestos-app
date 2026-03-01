import { describe, it, expect } from "vitest";
import { calcMuro, REND } from "../muros-data";

describe("calcMuro", () => {
  describe("muro normal — perimetral tipico", () => {
    // M-02: largo=3.90, alto=3.50, hViga=0.50, vanos=0, existe=5.85
    const r = calcMuro(3.90, 3.50, 0.50, 0, 5.85);

    it("calcula area bruta descontando viga", () => {
      // altoMuro = 3.50 - 0.50 = 3.00, areaB = 3.90 * 3.00 = 11.70
      expect(r.area).toBe(11.70);
    });

    it("descuenta area existente", () => {
      // areaNueva = 11.70 - 5.85 = 5.85
      expect(r.areaNueva).toBe(5.85);
    });

    it("calcula ladrillos con rendimiento 39 und/m2", () => {
      expect(r.lad).toBe(Math.ceil(5.85 * REND.lad));
    });

    it("calcula mortero", () => {
      expect(r.mort).toBe(+(5.85 * REND.mort).toFixed(4));
    });

    it("calcula cemento desde mortero", () => {
      expect(r.cem).toBe(+(r.mort * REND.cemPorM3).toFixed(2));
    });

    it("calcula arena desde mortero", () => {
      expect(r.arena).toBe(+(r.mort * REND.arenaPorM3).toFixed(4));
    });
  });

  describe("muro con ventana (vanos)", () => {
    // M-01: largo=9.10, alto=3.50, hViga=0.50, vanos=9.00, existe=13.65
    const r = calcMuro(9.10, 3.50, 0.50, 9.00, 13.65);

    it("descuenta vanos del area", () => {
      // altoMuro=3.00, areaB=27.30, area=27.30-9.00=18.30
      expect(r.area).toBe(18.30);
    });

    it("descuenta area existente", () => {
      // areaNueva = 18.30 - 13.65 = 4.65
      expect(r.areaNueva).toBe(4.65);
    });
  });

  describe("parapeto azotea — sin viga ni existente", () => {
    // AZ-01: largo=9.10, alto=1.50, hViga=0, vanos=0, existe=0
    const r = calcMuro(9.10, 1.50, 0, 0, 0);

    it("area = largo * alto (sin viga)", () => {
      expect(r.area).toBe(13.65);
    });

    it("areaNueva = area completa (sin existente)", () => {
      expect(r.areaNueva).toBe(13.65);
    });

    it("ladrillos > 0", () => {
      expect(r.lad).toBe(Math.ceil(13.65 * REND.lad));
      expect(r.lad).toBeGreaterThan(0);
    });
  });

  describe("tabique sin viga (hViga=0)", () => {
    // T-07: largo=1.39, alto=3.50, hViga=0, vanos=0, existe=0
    const r = calcMuro(1.39, 3.50, 0, 0, 0);

    it("usa altura completa", () => {
      expect(r.area).toBe(+(1.39 * 3.50).toFixed(2));
    });

    it("areaNueva = area (todo nuevo)", () => {
      expect(r.areaNueva).toBe(r.area);
    });
  });

  describe("edge cases", () => {
    it("area negativa se clampea a 0", () => {
      // vanos > area bruta
      const r = calcMuro(1, 2, 0, 100, 0);
      expect(r.area).toBe(0);
      expect(r.areaNueva).toBe(0);
      expect(r.lad).toBe(0);
      expect(r.mort).toBe(0);
    });

    it("existe > area → areaNueva = 0", () => {
      const r = calcMuro(2, 3, 0, 0, 999);
      expect(r.areaNueva).toBe(0);
      expect(r.lad).toBe(0);
    });

    it("largo = 0 → todo cero", () => {
      const r = calcMuro(0, 3.50, 0.50, 0, 0);
      expect(r.area).toBe(0);
      expect(r.areaNueva).toBe(0);
      expect(r.lad).toBe(0);
    });
  });

  describe("rendimientos constantes", () => {
    it("REND.lad = 39 und/m2", () => {
      expect(REND.lad).toBe(39);
    });

    it("REND.mort = 0.023 m3/m2", () => {
      expect(REND.mort).toBe(0.023);
    });

    it("REND.cemPorM3 = 7.40 bls/m3", () => {
      expect(REND.cemPorM3).toBe(7.40);
    });

    it("REND.arenaPorM3 = 1.07 m3/m3", () => {
      expect(REND.arenaPorM3).toBe(1.07);
    });
  });
});
