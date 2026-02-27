export interface Columna {
  id: string;
  tipo: string;
  cant: number;
  alt: number;
  b: number;
  h: number;
  area: number;
  vol: number;
  dia1: string;
  c1: number;
  dia2: string;
  c2: number;
  npos: number;
  lpos: number;
  mestr: number;
  md1: number;
  md2: number;
}

export interface Viga {
  id: string;
  s: string;
  b: number;
  h: number;
  t: number;
  lt: number;
  v: number;
  barras34: number;
  barras58: number;
  barras12: number;
  barras38: number;
  lEstr: number;
  nEstr: number;
  eje: string;
}

export interface PanoLosa {
  p: string;
  ej: string;
  a: number;
  l: number;
  area: number;
  nv: number;
  dv: number;
  vol: number;
  lad: number;
}

export interface BudgetItem {
  d: string;
  u: string;
  m: number;
  cu: number;
}

export interface BudgetGroup {
  cat: string;
  link?: string;
  areaM2?: number;
  areaSource?: { type: "auto" | "manual" | "hybrid"; nota?: string };
  items: BudgetItem[];
}

export interface ResumenRow {
  e: string;
  vol: number;
  v34: number;
  v58: number;
  v12: number;
  v38: number;
  v14: number;
  lad: number;
  color: string;
}

export interface SteelPieEntry {
  name: string;
  value: number;
  color: string;
}

export interface Nivel {
  id: string;
  label: string;
  shortLabel: string;
  orden: number;
  active: boolean;
  color: string;
}

export interface Muro {
  id: string;
  nivel: string;
  eje: string;
  largo: number;
  alto: number;
  hViga: number;
  vanos: number;
  area: number;
  existe: number;
  areaNueva: number;
  lad: number;
  mort: number;
  cem: number;
  arena: number;
}

export interface EscaleraGeo {
  nPasos: number;
  cp: number;
  p: number;
  ancho: number;
  anchoTotal: number;
  descL: number;
  garganta: number;
  eDesc: number;
  sep34: number;
  sep12: number;
  sep38: number;
}
