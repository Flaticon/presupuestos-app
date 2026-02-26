import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmtS = (n: number | undefined) =>
  typeof n === "number"
    ? "S/. " + n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "-";

export const fmtN = (n: number | undefined, d = 2) =>
  typeof n === "number" ? n.toFixed(d) : "-";
