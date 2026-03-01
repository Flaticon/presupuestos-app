import { describe, it, expect } from "vitest";
import { calcEscalera } from "../calc-escalera";
import type { EscaleraGeo } from "@/lib/types";

const DEFAULT_GEO: EscaleraGeo = {
  nPasos: 18, cp: 0.175, p: 0.250,
  ancho: 1.20, anchoTotal: 2.40,
  descL: 0.90, garganta: 0.20, eDesc: 0.20,
  sep34: 0.20, sep12: 0.20, sep38: 0.20,
};

describe("calcEscalera", () => {
  const r = calcEscalera(DEFAULT_GEO);

  it("resultado normal tiene valid: true", () => {
    expect(r.valid).toBe(true);
  });

  describe("geometria basica", () => {
    it("pasos por tramo = nPasos / 2", () => {
      expect(r.pasosTramo).toBe(9);
    });

    it("altura de tramo = pasos * contrapaso", () => {
      expect(r.hTramo).toBeCloseTo(9 * 0.175, 6);
    });

    it("longitud horizontal = pasos * paso", () => {
      expect(r.lHoriz).toBeCloseTo(9 * 0.250, 6);
    });

    it("angulo theta > 0 y < PI/2", () => {
      expect(r.theta).toBeGreaterThan(0);
      expect(r.theta).toBeLessThan(Math.PI / 2);
    });

    it("longitud inclinada = sqrt(lHoriz^2 + hTramo^2)", () => {
      const expected = Math.sqrt(r.lHoriz ** 2 + r.hTramo ** 2);
      expect(r.lIncl).toBeCloseTo(expected, 6);
    });

    it("verificacion 2p + cp", () => {
      expect(r.verif).toBeCloseTo(2 * 0.250 + 0.175, 6);
    });
  });

  describe("volumen de concreto", () => {
    it("espesor promedio > garganta", () => {
      expect(r.eProm).toBeGreaterThan(DEFAULT_GEO.garganta);
    });

    it("volumen tramo > 0", () => {
      expect(r.vTramo).toBeGreaterThan(0);
    });

    it("volumen total tramos = 2 * volumen tramo", () => {
      expect(r.vTramos).toBeCloseTo(r.vTramo * 2, 6);
    });

    it("volumen descanso = anchoTotal * descL * eDesc", () => {
      expect(r.vDesc).toBeCloseTo(2.40 * 0.90 * 0.20, 6);
    });

    it("volumen total = tramos + descanso", () => {
      expect(r.vTotal).toBeCloseTo(r.vTramos + r.vDesc, 6);
    });

    it("volumen total es razonable (1-5 m3)", () => {
      expect(r.vTotal).toBeGreaterThan(1);
      expect(r.vTotal).toBeLessThan(5);
    });
  });

  describe("encofrado", () => {
    it("encofrado tramo = ancho * lIncl", () => {
      expect(r.encTramo).toBeCloseTo(1.20 * r.lIncl, 6);
    });

    it("encofrado total tramos = 2 * encTramo", () => {
      expect(r.encTramos).toBeCloseTo(r.encTramo * 2, 6);
    });

    it("encofrado descanso = anchoTotal * descL", () => {
      expect(r.encDesc).toBeCloseTo(2.40 * 0.90, 6);
    });

    it("encofrado total = tramos + descanso", () => {
      expect(r.encTotal).toBeCloseTo(r.encTramos + r.encDesc, 6);
    });
  });

  describe("acero 3/4 (longitudinal principal)", () => {
    it("numero de barras = floor(ancho / sep) + 1", () => {
      expect(r.n34).toBe(Math.floor(1.20 / 0.20) + 1);
    });

    it("longitud por barra incluye empalme +0.80m", () => {
      expect(r.l34).toBeCloseTo(r.lIncl + 0.80, 6);
    });

    it("varillas = ceil(metros_totales / 9)", () => {
      expect(r.v34).toBe(Math.ceil(r.m34total / 9));
    });

    it("varillas > 0", () => {
      expect(r.v34).toBeGreaterThan(0);
    });
  });

  describe("acero 1/2 (bastones)", () => {
    it("longitud baston = lHoriz * 0.25 + 0.40", () => {
      expect(r.lnBaston).toBeCloseTo(r.lHoriz * 0.25 + 0.40, 6);
    });

    it("metros totales incluye 4 bastones por barra", () => {
      expect(r.m12total).toBeCloseTo(r.n12 * r.lnBaston * 4, 6);
    });

    it("varillas = ceil(metros / 9)", () => {
      expect(r.v12).toBe(Math.ceil(r.m12total / 9));
    });
  });

  describe("acero 3/8 (estribos/temperatura)", () => {
    it("barras por tramo = floor(lIncl / sep) + 1", () => {
      expect(r.n38tramo).toBe(Math.floor(r.lIncl / 0.20) + 1);
    });

    it("metros tramo = n38 * ancho", () => {
      expect(r.m38tramo).toBeCloseTo(r.n38tramo * 1.20, 6);
    });

    it("metros totales = 2 tramos + descanso", () => {
      expect(r.m38total).toBeCloseTo(r.m38tramo * 2 + r.m38desc, 6);
    });

    it("varillas = ceil(metros / 9)", () => {
      expect(r.v38).toBe(Math.ceil(r.m38total / 9));
    });
  });

  describe("con nPasos impar", () => {
    const geo: EscaleraGeo = { ...DEFAULT_GEO, nPasos: 17 };
    const r2 = calcEscalera(geo);

    it("redondea pasos por tramo hacia abajo", () => {
      expect(r2.pasosTramo).toBe(8);
    });

    it("sigue calculando correctamente", () => {
      expect(r2.vTotal).toBeGreaterThan(0);
    });
  });

  describe("escalera angosta", () => {
    const geo: EscaleraGeo = { ...DEFAULT_GEO, ancho: 0.80, anchoTotal: 1.60 };
    const r2 = calcEscalera(geo);

    it("volumen menor que escalera normal", () => {
      expect(r2.vTotal).toBeLessThan(r.vTotal);
    });

    it("menos barras de acero", () => {
      expect(r2.v34).toBeLessThanOrEqual(r.v34);
    });
  });

  describe("guards division por cero", () => {
    it("nPasos=0 retorna valid:false con ceros", () => {
      const r2 = calcEscalera({ ...DEFAULT_GEO, nPasos: 0 });
      expect(r2.valid).toBe(false);
      expect(r2.vTotal).toBe(0);
      expect(r2.v34).toBe(0);
      expect(r2.encTotal).toBe(0);
    });

    it("nPasos=1 retorna valid:false (pasosTramo=0)", () => {
      const r2 = calcEscalera({ ...DEFAULT_GEO, nPasos: 1 });
      expect(r2.valid).toBe(false);
      expect(r2.vTotal).toBe(0);
    });

    it("p=0 retorna valid:false (lHoriz=0)", () => {
      const r2 = calcEscalera({ ...DEFAULT_GEO, p: 0 });
      expect(r2.valid).toBe(false);
      expect(r2.vTotal).toBe(0);
    });

    it("resultado invalido preserva verif = 2p+cp", () => {
      const r2 = calcEscalera({ ...DEFAULT_GEO, nPasos: 0 });
      expect(r2.verif).toBeCloseTo(2 * 0.250 + 0.175, 6);
    });

    it("ningun campo es NaN en resultado invalido", () => {
      const r2 = calcEscalera({ ...DEFAULT_GEO, nPasos: 0 });
      for (const [key, val] of Object.entries(r2)) {
        if (key === "valid") continue;
        expect(val, `${key} should not be NaN`).not.toBeNaN();
      }
    });
  });
});
