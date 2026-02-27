import type { SectionAggregates } from "@/lib/section-data-context";

export interface FormulaResult {
  value: number;
  detail: string;
}

type FormulaFn = (agg: SectionAggregates) => FormulaResult | null;

/**
 * Registry mapping budget group index → formula function.
 * Returns null if the required data is not yet available.
 */
export const BUDGET_FORMULAS: Record<number, FormulaFn> = {
  // 3.1 TARRAJEO INTERIOR Y EXTERIOR — muros 3P area bruta × 2 caras
  7: (agg) => {
    if (!agg.muros) return null;
    const p = agg.muros.byFloor["3er-piso"];
    if (!p) return null;
    const value = +(p.areaBruta * 2).toFixed(2);
    return { value, detail: `3P: ${p.areaBruta.toFixed(1)} m² × 2 caras` };
  },

  // 3.2 TARRAJEO DE VIGAS
  8: (agg) => {
    if (!agg.vigas) return null;
    const value = agg.vigas.encTotal;
    return { value, detail: `Vigas: Σ(2h+b)×Lt = ${value.toFixed(1)} m²` };
  },

  // 3.3 TARRAJEO DE COLUMNAS
  9: (agg) => {
    if (!agg.columnas) return null;
    const value = agg.columnas.areaTarrajeo;
    return { value, detail: `Columnas: Σ 2(b+h)×H×n = ${value.toFixed(1)} m²` };
  },

  // 3.5 REVESTIMIENTO ESCALERA
  11: (agg) => {
    if (!agg.escalera) return null;
    const value = agg.escalera.encTotal;
    return { value, detail: `Escalera: encofrado = ${value.toFixed(1)} m²` };
  },

  // 3.6 CIELORASO
  12: (agg) => {
    if (!agg.losa) return null;
    const value = agg.losa.areaTotal;
    return { value, detail: `Losa: aligerada+maciza = ${value.toFixed(1)} m²` };
  },

  // 15.05 MUROS PARAPETO AZOTEA — muros azotea area nueva (index 29)
  29: (agg) => {
    if (!agg.muros) return null;
    const az = agg.muros.byFloor["azotea"];
    if (!az) return null;
    const value = +az.areaNueva.toFixed(2);
    return { value, detail: `AZ: ${az.areaNueva.toFixed(1)} m² nueva` };
  },

  // 15.06 TARRAJEO PARAPETOS AZOTEA — azotea area nueva × 2 caras (index 30)
  30: (agg) => {
    if (!agg.muros) return null;
    const az = agg.muros.byFloor["azotea"];
    if (!az) return null;
    const value = +(az.areaNueva * 2).toFixed(2);
    return { value, detail: `AZ: ${az.areaNueva.toFixed(1)} m² × 2 caras` };
  },
};
