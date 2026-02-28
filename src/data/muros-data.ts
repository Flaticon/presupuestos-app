import type { Muro } from "@/lib/types";

/**
 * Ladrillo King Kong 18 huecos (23×12.5×9 cm) — asentado de soga e=14 cm
 * Rendimientos por m² de muro:
 *   Ladrillos : 39 und/m²
 *   Mortero   : 0.023 m³/m²
 *   Cemento   : 0.170 bolsas/m²  (mezcla 1:5 → 7.40 bls/m³)
 *   Arena     : 0.0246 m³/m²     (1.07 m³/m³ mortero)
 */

export const REND = {
  lad: 39,
  mort: 0.023,
  cemPorM3: 7.40,
  arenaPorM3: 1.07,
} as const;

export function calcMuro(largo: number, alto: number, hViga: number, vanos: number, existe: number) {
  const altoMuro = alto - hViga;
  const areaB = largo * altoMuro;
  const area = +(areaB - vanos).toFixed(2);
  const areaSafe = Math.max(area, 0);
  const areaNueva = +Math.max(areaSafe - existe, 0).toFixed(2);
  const mort = +(areaNueva * REND.mort).toFixed(4);
  return {
    area: areaSafe,
    areaNueva,
    lad: Math.ceil(areaNueva * REND.lad),
    mort,
    cem: +(mort * REND.cemPorM3).toFixed(2),
    arena: +(mort * REND.arenaPorM3).toFixed(4),
  };
}

// Vigas 30×50 → peralte 0.50 m | Altura piso-techo 3.50 m
// Ventana Eje 1: ~7.50×1.20 = 9.00 m² (alféizar 1.50m, dintel 2.70m)

function m(id: string, eje: string, largo: number, alto: number, hViga: number, vanos: number, existe: number, piso = "3er-piso"): Muro {
  return { id, piso, eje, largo, alto, hViga, vanos, existe, ...calcMuro(largo, alto, hViga, vanos, existe) };
}

const E = (largo: number, h: number) => +(largo * h).toFixed(2);

export const MUROS_INIT: Muro[] = [
  // ═══════════════════════════════════════════════
  // PERIMETRALES EJES 1→5 — existe h=1.50 m
  // ═══════════════════════════════════════════════
  m("M-01", "Eje 1 horiz. c/ventana",     9.10, 3.50, 0.50, 9.00, E(9.10, 1.50)),
  m("M-02", "Eje A · 1→2",                3.90, 3.50, 0.50, 0,    E(3.90, 1.50)),
  m("M-03", "Eje A · 2→3",                3.90, 3.50, 0.50, 0,    E(3.90, 1.50)),
  m("M-04", "Eje A · 3→4",                3.75, 3.50, 0.50, 0,    E(3.75, 1.50)),
  m("M-05", "Eje A · 4→5",                4.32, 3.50, 0.50, 0,    E(4.32, 1.50)),
  m("M-06", "Eje B · 1→2",                4.77, 3.50, 0.50, 0,    E(4.77, 1.50)),
  m("M-07", "Eje B · 2→3",                3.90, 3.50, 0.50, 0,    E(3.90, 1.50)),
  m("M-08", "Eje B · 3→4",                4.32, 3.50, 0.50, 0,    E(4.32, 1.50)),
  m("M-09", "Eje B · 4→5",                4.17, 3.50, 0.50, 0,    E(4.17, 1.50)),
  m("M-10", "Eje A · remate Eje 4",       0.57, 3.50, 0.50, 0,    E(0.57, 1.50)),
  m("M-11", "Eje A · remate Eje 4-5",     0.57, 3.50, 0.50, 0,    E(0.57, 1.50)),

  // ═══════════════════════════════════════════════
  // PERIMETRALES EJES 5→9 — Izquierdo existe h=2.50 m
  // ═══════════════════════════════════════════════
  m("M-12", "Izq · 5→6",                  4.57, 3.50, 0.50, 0,    E(4.57, 2.50)),
  m("M-13", "Izq · 7→8",                  2.90, 3.50, 0.50, 0,    E(2.90, 2.50)),
  m("M-14", "Izq · 8→9",                  2.52, 3.50, 0.50, 0,    E(2.52, 2.50)),
  m("M-15", "Izq · remate Eje 7",         0.63, 3.50, 0.50, 0,    E(0.63, 2.50)),

  // ── Derecho Eje 5→7 — existe h=2.50 m ──
  m("M-16", "Der · 5→6",                  4.45, 3.50, 0.50, 0,    E(4.45, 2.50)),
  m("M-17", "Der · 6→7",                  2.55, 3.50, 0.50, 0,    E(2.55, 2.50)),

  // ── Derecho Eje 7→9 — existe h=2.50 m ──
  m("M-18", "Der · 7→8",                  3.45, 3.50, 0.50, 0,    E(3.45, 2.50)),
  m("M-19", "Der · 8→9",                  3.22, 3.50, 0.50, 0,    E(3.22, 2.50)),

  // ── Eje 9 horizontal — existe h=2.50 m ──
  m("M-20", "Eje 9 horiz. izq",           3.70, 3.50, 0.50, 0,    E(3.70, 2.50)),
  m("M-21", "Eje 9 horiz. der",           4.48, 3.50, 0.50, 0,    E(4.48, 2.50)),

  // ── Horizontales intermedios ──
  m("M-22", "Eje 5 horiz. (escalera)",    2.86, 3.50, 0.50, 0,    E(2.86, 2.50)),
  m("M-23", "Eje 6 horiz.",               2.86, 3.50, 0.50, 0,    0),
  m("M-24", "Eje 7 horiz. izq",           0.70, 3.50, 0.50, 0,    0),
  m("M-25", "Eje 7 horiz. der",           2.97, 3.50, 0.50, 0,    0),
  m("M-26", "Eje 5 horiz. der (ew3)",     2.97, 3.50, 0.50, 0,    0),

  // ═══════════════════════════════════════════════
  // TABIQUES INTERIORES — ESCALERA
  // ═══════════════════════════════════════════════
  m("T-01", "Escalera vert. interior",     3.60, 3.50, 0.50, 0,   E(3.60, 2.50)),
  m("T-02", "Tab. vertical P-2 (NUEVO)",   1.80, 3.50, 0.50, 0,   0),
  m("T-03", "Tab. escalera horiz. sup.",   2.40, 3.50, 0.50, 0,   E(2.40, 1.50)),
  m("T-04", "Tab. escalera horiz. inf.",   1.20, 3.50, 0.50, 0,   E(1.20, 1.50)),
  m("T-05", "Tab. lateral montacarga",     1.05, 3.50, 0.50, 0,   E(1.05, 1.50)),
  m("T-06", "Tab. retorno P-2",            0.15, 3.50, 0.00, 0,   E(0.15, 1.50)),

  // ═══════════════════════════════════════════════
  // TABIQUES INTERIORES — BAÑOS (nuevos)
  // ═══════════════════════════════════════════════
  m("T-07", "Tab. baño vert. 1 (1.39)",   1.39, 3.50, 0.00, 0,   0),
  m("T-08", "Tab. baño vert. 2 (1.33)",   1.33, 3.50, 0.00, 0,   0),
  m("T-09", "Tab. baño vert. 3 (1.18)",   1.18, 3.50, 0.00, 0,   0),
  m("T-10", "Tab. baño horiz. 1 (0.70)",  0.70, 3.50, 0.00, 0,   0),
  m("T-11", "Tab. baño horiz. 2 (0.70)",  0.70, 3.50, 0.00, 0,   0),
  m("T-12", "Tab. baño horiz. 3 (1.45)",  1.45, 3.50, 0.00, 0,   0),
  m("T-13", "Tab. baño retorno (0.73)",   0.73, 3.50, 0.00, 0,   0),
  m("T-14", "Tab. baño retorno (0.63)",   0.63, 3.50, 0.00, 0,   0),

  // ═══════════════════════════════════════════════
  // AZOTEA — PARAPETOS PERIMETRALES h=1.50 m
  // ═══════════════════════════════════════════════

  // ── Ejes 1→5 ──
  m("AZ-01", "Eje 1 horiz.",               9.10, 1.50, 0, 0, 0, "azotea"),
  m("AZ-02", "Eje A · 1→2",                3.90, 1.50, 0, 0, 0, "azotea"),
  m("AZ-03", "Eje A · 2→3",                3.90, 1.50, 0, 0, 0, "azotea"),
  m("AZ-04", "Eje A · 3→4",                3.75, 1.50, 0, 0, 0, "azotea"),
  m("AZ-05", "Eje A · 4→5",                4.32, 1.50, 0, 0, 0, "azotea"),
  m("AZ-06", "Eje B · 1→2",                4.77, 1.50, 0, 0, 0, "azotea"),
  m("AZ-07", "Eje B · 2→3",                3.90, 1.50, 0, 0, 0, "azotea"),
  m("AZ-08", "Eje B · 3→4",                4.32, 1.50, 0, 0, 0, "azotea"),
  m("AZ-09", "Eje B · 4→5",                4.17, 1.50, 0, 0, 0, "azotea"),
  m("AZ-10", "Eje A · remate Eje 4",       0.57, 1.50, 0, 0, 0, "azotea"),
  m("AZ-11", "Eje A · remate Eje 4-5",     0.57, 1.50, 0, 0, 0, "azotea"),

  // ── Ejes 5→9 ──
  m("AZ-12", "Izq · 5→6",                  4.57, 1.50, 0, 0, 0, "azotea"),
  m("AZ-13", "Izq · 7→8",                  2.90, 1.50, 0, 0, 0, "azotea"),
  m("AZ-14", "Izq · 8→9",                  2.52, 1.50, 0, 0, 0, "azotea"),
  m("AZ-15", "Izq · remate Eje 7",         0.63, 1.50, 0, 0, 0, "azotea"),
  m("AZ-16", "Der · 5→6",                  4.45, 1.50, 0, 0, 0, "azotea"),
  m("AZ-17", "Der · 6→7",                  2.55, 1.50, 0, 0, 0, "azotea"),
  m("AZ-18", "Der · 7→8",                  3.45, 1.50, 0, 0, 0, "azotea"),
  m("AZ-19", "Der · 8→9",                  3.22, 1.50, 0, 0, 0, "azotea"),
  m("AZ-20", "Eje 9 horiz. izq",           3.70, 1.50, 0, 0, 0, "azotea"),
  m("AZ-21", "Eje 9 horiz. der",           4.48, 1.50, 0, 0, 0, "azotea"),
];
