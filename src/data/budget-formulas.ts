import type { SectionAggregates } from "@/lib/section-data-context";

export interface FormulaResult {
  value: number;
  detail: string;
}

type FormulaFn = (agg: SectionAggregates) => FormulaResult | null;

/**
 * Registry mapping budget group id → formula function.
 * Returns null if the required data is not yet available.
 */
export const BUDGET_FORMULAS: Record<string, FormulaFn> = {
  // ── Structural groups ──

  // 2.2 COLUMNAS 3P — volumen de concreto
  "columnas-3p": (agg) => {
    if (!agg.columnas) return null;
    const p = agg.columnas.byFloor["3er-piso"];
    if (!p) return null;
    const value = p.volTotal;
    return { value, detail: `Columnas 3P: Σ(b×h×H×n) = ${value.toFixed(2)} m³` };
  },

  // 2.3 VIGAS — volumen de concreto
  "vigas-3p": (agg) => {
    if (!agg.vigas) return null;
    const value = agg.vigas.volTotal;
    return { value, detail: `Vigas: Σ(b×h×Lt) = ${value.toFixed(2)} m³` };
  },

  // 2.4 LOSA — volumen de concreto
  "losa-3p": (agg) => {
    if (!agg.losa) return null;
    const value = agg.losa.volTotal;
    return { value, detail: `Losa: Σ vol paños = ${value.toFixed(2)} m³` };
  },

  // 2.5 ESCALERA — volumen de concreto
  "escalera-3p": (agg) => {
    if (!agg.escalera) return null;
    const value = agg.escalera.volTotal;
    return { value, detail: `Escalera: tramos+descanso = ${value.toFixed(2)} m³` };
  },

  // 15.02 COLUMNAS AZOTEA — volumen de concreto
  "columnas-az": (agg) => {
    if (!agg.columnas) return null;
    const p = agg.columnas.byFloor["azotea"];
    if (!p) return null;
    const value = p.volTotal;
    return { value, detail: `Columnas AZ: Σ(b×h×1.5×n) = ${value.toFixed(2)} m³` };
  },

  // ── Finish groups ──

  // 3.1 TARRAJEO INTERIOR Y EXTERIOR — muros 3P area bruta × 2 caras
  "tarrajeo-ie": (agg) => {
    if (!agg.muros) return null;
    const p = agg.muros.byFloor["3er-piso"];
    if (!p) return null;
    const value = +(p.areaBruta * 2).toFixed(2);
    return { value, detail: `3P: ${p.areaBruta.toFixed(1)} m² × 2 caras` };
  },

  // 3.2 TARRAJEO DE VIGAS
  "tarrajeo-vigas": (agg) => {
    if (!agg.vigas) return null;
    const value = agg.vigas.encTotal;
    return { value, detail: `Vigas: Σ(2h+b)×Lt = ${value.toFixed(1)} m²` };
  },

  // 3.3 TARRAJEO DE COLUMNAS 3P
  "tarrajeo-col": (agg) => {
    if (!agg.columnas) return null;
    const p = agg.columnas.byFloor["3er-piso"];
    if (!p) return null;
    const value = p.areaTarrajeo;
    return { value, detail: `Columnas 3P: Σ 2(b+h)×H×n = ${value.toFixed(1)} m²` };
  },

  // 15.08 TARRAJEO COLUMNAS AZOTEA
  "tarrajeo-col-az": (agg) => {
    if (!agg.columnas) return null;
    const p = agg.columnas.byFloor["azotea"];
    if (!p) return null;
    const value = p.areaTarrajeo;
    return { value, detail: `Columnas AZ: Σ 2(b+h)×1.5×n = ${value.toFixed(1)} m²` };
  },

  // 3.5 REVESTIMIENTO ESCALERA
  "revest-escalera": (agg) => {
    if (!agg.escalera) return null;
    const value = agg.escalera.encTotal;
    return { value, detail: `Escalera: encofrado = ${value.toFixed(1)} m²` };
  },

  // 3.6 CIELORASO
  "cieloraso-3p": (agg) => {
    if (!agg.losa) return null;
    const value = agg.losa.areaTotal;
    return { value, detail: `Losa: aligerada+maciza = ${value.toFixed(1)} m²` };
  },

  // 15.05 MUROS PARAPETO AZOTEA — muros azotea area nueva
  "muros-az": (agg) => {
    if (!agg.muros) return null;
    const az = agg.muros.byFloor["azotea"];
    if (!az) return null;
    const value = +az.areaNueva.toFixed(2);
    return { value, detail: `AZ: ${az.areaNueva.toFixed(1)} m² nueva` };
  },

  // 15.06 TARRAJEO PARAPETOS AZOTEA — azotea area nueva × 2 caras
  "tarrajeo-par-az": (agg) => {
    if (!agg.muros) return null;
    const az = agg.muros.byFloor["azotea"];
    if (!az) return null;
    const value = +(az.areaNueva * 2).toFixed(2);
    return { value, detail: `AZ: ${az.areaNueva.toFixed(1)} m² × 2 caras` };
  },
};
