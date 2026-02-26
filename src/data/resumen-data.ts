import type { ResumenRow, SteelPieEntry } from "@/lib/types";

export const RESUMEN_DATA: ResumenRow[] = [
  { e: "Vigas", vol: 25.24, v34: 75, v58: 40, v12: 7, v38: 228, v14: 7, lad: 0, color: "#3B82F6" },
  { e: "Losa alig.", vol: 17.56, v34: 0, v58: 0, v12: 98, v38: 25, v14: 92, lad: 1672, color: "#F59E0B" },
  { e: "Columnas", vol: 11.23, v34: 25, v58: 50, v12: 1, v38: 228, v14: 0, lad: 0, color: "#EF4444" },
  { e: "Losa maciza", vol: 3.38, v34: 0, v58: 0, v12: 0, v38: 21, v14: 0, lad: 0, color: "#8B5CF6" },
  { e: "Escalera", vol: 2.30, v34: 12, v58: 0, v12: 8, v38: 18, v14: 0, lad: 0, color: "#10B981" },
];

export const STEEL_PIE: SteelPieEntry[] = [
  { name: 'Ø3/4"', value: 112, color: "#3B82F6" },
  { name: 'Ø5/8"', value: 90, color: "#EF4444" },
  { name: 'Ø1/2"', value: 114, color: "#10B981" },
  { name: 'Ø3/8"', value: 520, color: "#F59E0B" },
  { name: 'Ø1/4"', value: 99, color: "#8B5CF6" },
];
