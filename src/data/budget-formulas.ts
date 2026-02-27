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

  // 3.2 TARRAJEO DE VIGAS — future auto-calc from vigas section
  // 8: manual for now

  // 3.3 TARRAJEO DE COLUMNAS — future auto-calc from columnas section
  // 9: manual for now

  // 15.1 MUROS PARAPETO AZOTEA — muros azotea area nueva
  19: (agg) => {
    if (!agg.muros) return null;
    const az = agg.muros.byFloor["azotea"];
    if (!az) return null;
    const value = +az.areaNueva.toFixed(2);
    return { value, detail: `AZ: ${az.areaNueva.toFixed(1)} m² nueva` };
  },

  // 15.2 TARRAJEO PARAPETOS AZOTEA — azotea area nueva × 2 caras
  20: (agg) => {
    if (!agg.muros) return null;
    const az = agg.muros.byFloor["azotea"];
    if (!az) return null;
    const value = +(az.areaNueva * 2).toFixed(2);
    return { value, detail: `AZ: ${az.areaNueva.toFixed(1)} m² × 2 caras` };
  },
};
