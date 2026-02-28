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

  // 2.3 VIGAS 3P — volumen de concreto
  "vigas-3p": (agg) => {
    if (!agg.vigas) return null;
    const f = agg.vigas.byFloor["3er-piso"];
    if (!f) return null;
    const value = f.volTotal;
    return { value, detail: `Vigas 3P: Σ(b×h×Lt) = ${value.toFixed(2)} m³` };
  },

  // 2.4 LOSA 3P — volumen de concreto
  "losa-3p": (agg) => {
    if (!agg.losa) return null;
    const f = agg.losa.byFloor["3er-piso"];
    if (!f) return null;
    const value = f.volTotal;
    return { value, detail: `Losa 3P: Σ vol paños = ${value.toFixed(2)} m³` };
  },

  // 2.5 ESCALERA 3P — volumen de concreto
  "escalera-3p": (agg) => {
    if (!agg.escalera) return null;
    const f = agg.escalera.byFloor["3er-piso"];
    if (!f) return null;
    const value = f.volTotal;
    return { value, detail: `Escalera 3P: tramos+descanso = ${value.toFixed(2)} m³` };
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

  // 3.2 TARRAJEO DE VIGAS 3P
  "tarrajeo-vigas": (agg) => {
    if (!agg.vigas) return null;
    const f = agg.vigas.byFloor["3er-piso"];
    if (!f) return null;
    const value = f.encTotal;
    return { value, detail: `Vigas 3P: Σ(2h+b)×Lt = ${value.toFixed(1)} m²` };
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

  // 3.5 REVESTIMIENTO ESCALERA 3P
  "revest-escalera": (agg) => {
    if (!agg.escalera) return null;
    const f = agg.escalera.byFloor["3er-piso"];
    if (!f) return null;
    const value = f.encTotal;
    return { value, detail: `Escalera 3P: encofrado = ${value.toFixed(1)} m²` };
  },

  // 3.6 CIELORASO 3P
  "cieloraso-3p": (agg) => {
    if (!agg.losa) return null;
    const f = agg.losa.byFloor["3er-piso"];
    if (!f) return null;
    const value = f.areaTotal;
    return { value, detail: `Losa 3P: aligerada+maciza = ${value.toFixed(1)} m²` };
  },

  // 15.03 VIGAS AZOTEA — volumen de concreto
  "vigas-az": (agg) => {
    if (!agg.vigas) return null;
    const f = agg.vigas.byFloor["azotea"];
    if (!f) return null;
    const value = f.volTotal;
    return { value, detail: `Vigas AZ: Σ(b×h×Lt) = ${value.toFixed(2)} m³` };
  },

  // 15.04 LOSA AZOTEA — volumen de concreto
  "losa-az": (agg) => {
    if (!agg.losa) return null;
    const f = agg.losa.byFloor["azotea"];
    if (!f) return null;
    const value = f.volTotal;
    return { value, detail: `Losa AZ: Σ vol paños = ${value.toFixed(2)} m³` };
  },

  // 15.07 TARRAJEO VIGAS AZOTEA
  "tarrajeo-vig-az": (agg) => {
    if (!agg.vigas) return null;
    const f = agg.vigas.byFloor["azotea"];
    if (!f) return null;
    const value = f.encTotal;
    return { value, detail: `Vigas AZ: Σ(2h+b)×Lt = ${value.toFixed(1)} m²` };
  },

  // 15.09 CIELORASO AZOTEA
  "cieloraso-az": (agg) => {
    if (!agg.losa) return null;
    const f = agg.losa.byFloor["azotea"];
    if (!f) return null;
    const value = f.areaTotal;
    return { value, detail: `Losa AZ: aligerada+maciza = ${value.toFixed(1)} m²` };
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

/**
 * Dynamic formula patterns — resolves floor-parameterized budget group IDs.
 * Pattern format: "vigas-{floor}" matches "vigas-azotea", "vigas-4to-piso", etc.
 */
const DYNAMIC_PATTERNS: { pattern: RegExp; section: keyof SectionAggregates; resolve: (floorId: string, agg: SectionAggregates) => FormulaResult | null }[] = [
  {
    pattern: /^vigas-(.+)$/,
    section: "vigas",
    resolve: (floorId, agg) => {
      if (!agg.vigas) return null;
      const f = agg.vigas.byFloor[floorId];
      if (!f) return null;
      return { value: f.volTotal, detail: `Vigas ${floorId}: Σ(b×h×Lt) = ${f.volTotal.toFixed(2)} m³` };
    },
  },
  {
    pattern: /^tarrajeo-vigas-(.+)$/,
    section: "vigas",
    resolve: (floorId, agg) => {
      if (!agg.vigas) return null;
      const f = agg.vigas.byFloor[floorId];
      if (!f) return null;
      return { value: f.encTotal, detail: `Vigas ${floorId}: Σ(2h+b)×Lt = ${f.encTotal.toFixed(1)} m²` };
    },
  },
  {
    pattern: /^losa-(.+)$/,
    section: "losa",
    resolve: (floorId, agg) => {
      if (!agg.losa) return null;
      const f = agg.losa.byFloor[floorId];
      if (!f) return null;
      return { value: f.volTotal, detail: `Losa ${floorId}: Σ vol paños = ${f.volTotal.toFixed(2)} m³` };
    },
  },
  {
    pattern: /^cieloraso-(.+)$/,
    section: "losa",
    resolve: (floorId, agg) => {
      if (!agg.losa) return null;
      const f = agg.losa.byFloor[floorId];
      if (!f) return null;
      return { value: f.areaTotal, detail: `Losa ${floorId}: aligerada+maciza = ${f.areaTotal.toFixed(1)} m²` };
    },
  },
  {
    pattern: /^escalera-(.+)$/,
    section: "escalera",
    resolve: (floorId, agg) => {
      if (!agg.escalera) return null;
      const f = agg.escalera.byFloor[floorId];
      if (!f) return null;
      return { value: f.volTotal, detail: `Escalera ${floorId}: tramos+descanso = ${f.volTotal.toFixed(2)} m³` };
    },
  },
  {
    pattern: /^revest-escalera-(.+)$/,
    section: "escalera",
    resolve: (floorId, agg) => {
      if (!agg.escalera) return null;
      const f = agg.escalera.byFloor[floorId];
      if (!f) return null;
      return { value: f.encTotal, detail: `Escalera ${floorId}: encofrado = ${f.encTotal.toFixed(1)} m²` };
    },
  },
];

/**
 * Resolve a formula for a budget group.
 * First checks static BUDGET_FORMULAS, then tries dynamic floor patterns.
 */
export function resolveFormula(groupId: string, agg: SectionAggregates): FormulaResult | null {
  const staticFn = BUDGET_FORMULAS[groupId];
  if (staticFn) return staticFn(agg);

  for (const dp of DYNAMIC_PATTERNS) {
    const match = groupId.match(dp.pattern);
    if (match) {
      const floorId = match[1];
      return dp.resolve(floorId, agg);
    }
  }

  return null;
}
