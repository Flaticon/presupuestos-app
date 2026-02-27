// Design tokens - steel colors
export const STEEL_COLORS = {
  "3/4": "#1565C0",
  "5/8": "#B71C1C",
  "1/2": "#1B5E20",
  "3/8": "#E65100",
  "1/4": "#4A148C",
} as const;

// Section tab identifiers
export const SECTION_IDS = [
  "resumen",
  "columnas",
  "vigas",
  "losa",
  "muros",
  "escalera",
  "presupuesto",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
