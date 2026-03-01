import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
import type { EscaleraGeo } from "@/lib/types";
import { usePublishSection } from "@/lib/section-data-context";
import type { EscaleraFloorAgg } from "@/lib/section-data-context";
import { useFloors } from "@/lib/floor-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StaircaseDynamic } from "@/components/diagrams/staircase-dynamic";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { usePersistence } from "@/hooks/use-persistence";
import { FloorPicker } from "@/components/shared/floor-picker";
export { calcEscalera } from "./calc-escalera";
import { calcEscalera } from "./calc-escalera";

const DEFAULT_GEO: EscaleraGeo = {
  nPasos: 18, cp: 0.175, p: 0.250,
  ancho: 1.20, anchoTotal: 2.40,
  descL: 0.90, garganta: 0.20, eDesc: 0.20,
  sep34: 0.20, sep12: 0.20, sep38: 0.20,
};

export function Escalera() {
  const { state: escaleras, setState: setEscaleras, undo, redo } = useUndoRedo<Record<string, EscaleraGeo>>(
    () => ({ "3er-piso": { ...DEFAULT_GEO } })
  );
  usePersistence("escalera", escaleras, setEscaleras, (data) => {
    if (data == null) return null;
    // Migration: if data is a plain EscaleraGeo (no nesting), wrap it
    if (typeof data === "object" && "nPasos" in (data as object)) {
      return { "3er-piso": data as EscaleraGeo };
    }
    return data as Record<string, EscaleraGeo>;
  });

  const { floors } = useFloors();
  const [pisoFilter, setPisoFilter] = createSignal("3er-piso");

  const floorTabs = () => {
    const pisos = new Set(Object.keys(escaleras()));
    const allFloors = floors();
    const tabs: { id: string; label: string }[] = [];
    for (const f of allFloors) {
      if (pisos.has(f.id)) tabs.push({ id: f.id, label: f.label });
    }
    for (const p of pisos) {
      if (!tabs.find((t) => t.id === p)) tabs.push({ id: p, label: p });
    }
    return tabs;
  };

  // Current floor geo
  const geo = createMemo(() => escaleras()[pisoFilter()] ?? null);

  const set = (k: keyof EscaleraGeo, v: number) => {
    const piso = pisoFilter();
    setEscaleras((prev) => ({
      ...prev,
      [piso]: { ...prev[piso], [k]: v },
    }));
  };

  // Computed for current floor
  const calc = createMemo(() => {
    const g = geo();
    if (!g) return null;
    return calcEscalera(g);
  });

  // Publish aggregates for all floors
  const publish = usePublishSection();
  const escaleraAgg = createMemo(() => {
    const byFloor: Record<string, EscaleraFloorAgg> = {};
    let encTotal = 0;
    let volTotal = 0;
    const steel = { v34: 0, v58: 0, v12: 0, v38: 0, v14: 0 };
    for (const [piso, g] of Object.entries(escaleras())) {
      const c = calcEscalera(g);
      byFloor[piso] = {
        encTotal: +c.encTotal.toFixed(2), volTotal: +c.vTotal.toFixed(2),
        steel: { v34: c.v34, v58: 0, v12: c.v12, v38: c.v38, v14: 0 },
      };
      encTotal += c.encTotal;
      volTotal += c.vTotal;
      steel.v34 += c.v34;
      steel.v12 += c.v12;
      steel.v38 += c.v38;
    }
    return { encTotal: +encTotal.toFixed(2), volTotal: +volTotal.toFixed(2), steel, byFloor };
  });
  createEffect(() => publish("escalera", escaleraAgg()));

  const addEscalera = (pisoId: string) => {
    setEscaleras((prev) => ({
      ...prev,
      [pisoId]: { ...DEFAULT_GEO },
    }));
    setPisoFilter(pisoId);
  };

  const removeEscalera = (pisoId: string) => {
    setEscaleras((prev) => {
      const next = { ...prev };
      delete next[pisoId];
      return next;
    });
    const remaining = Object.keys(escaleras());
    if (remaining.length > 0) setPisoFilter(remaining[0]);
  };

  function ParamRow(props: {
    label: string; k: keyof EscaleraGeo; step?: number; min?: number; obs: string;
  }) {
    const step = props.step ?? 0.005;
    const min = props.min ?? 0.01;
    return (
      <TableRow class="border-b border-border">
        <TableCell class="font-semibold">{props.label}</TableCell>
        <TableCell class="text-center w-[90px]">
          <div class="flex items-center gap-1 justify-center">
            <button
              onClick={() => set(props.k, Math.max(min, +(geo()![props.k] - step).toFixed(4)))}
              class="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
            >
              −
            </button>
            <span class="font-bold text-primary min-w-[40px] text-center">{geo()![props.k].toFixed(3)}</span>
            <button
              onClick={() => set(props.k, +(geo()![props.k] + step).toFixed(4))}
              class="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
            >
              +
            </button>
          </div>
        </TableCell>
        <TableCell class="text-[10px] text-text-soft">{props.obs}</TableCell>
      </TableRow>
    );
  }

  return (
    <Card>
      <CardHeader class="bg-[#18181B]">
        <CardTitle class="text-white">Escalera — Metrado Editable</CardTitle>
        <CardDescription class="text-white/50">
          <Show when={geo() && calc()} fallback="Sin escalera en este piso">
            Tipo U · {geo()!.nPasos} pasos · Vol ≈ {calc()!.vTotal.toFixed(2)} m³
          </Show>
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        {/* Floor tabs */}
        <div class="flex items-center gap-2 flex-wrap">
          <div class="inline-flex rounded-lg border border-border overflow-hidden">
            <For each={floorTabs()}>
              {(tab) => (
                <button onClick={() => setPisoFilter(tab.id)}
                  class={`px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${pisoFilter() === tab.id ? "bg-[#18181B] text-white" : "bg-card text-text-mid hover:bg-muted"}`}
                >{tab.label}</button>
              )}
            </For>
          </div>
          <FloorPicker
            existingFloors={Object.keys(escaleras())}
            onAddFloor={(floorId) => addEscalera(floorId)}
          />
          <Show when={geo() && Object.keys(escaleras()).length > 1}>
            <button
              onClick={() => removeEscalera(pisoFilter())}
              class="text-xs text-danger hover:bg-danger/10 rounded px-2 py-1 cursor-pointer"
            >
              Eliminar escalera
            </button>
          </Show>
        </div>

        <Show when={geo() && calc()} fallback={
          <div class="text-center py-8">
            <p class="text-text-soft text-sm mb-3">No hay escalera en este piso</p>
            <button
              onClick={() => addEscalera(pisoFilter())}
              class="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-primary/90"
            >
              Agregar escalera para {pisoFilter()}
            </button>
          </div>
        }>
          {/* Dynamic diagram */}
          <StaircaseDynamic
            nPasos={geo()!.nPasos} cp={geo()!.cp} p={geo()!.p}
            ancho={geo()!.ancho} descL={geo()!.descL} garganta={geo()!.garganta}
          />

          {/* Editable parameters */}
          <div class="text-xs font-bold text-text border-b border-border pb-1.5 uppercase tracking-wider">
            PARÁMETROS — modifica y los cálculos se actualizan
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parámetro</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Observación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow class="bg-muted/50">
                <TableCell class="font-semibold">N° de pasos (total)</TableCell>
                <TableCell class="text-center">
                  <div class="flex items-center gap-1 justify-center">
                    <button
                      onClick={() => set("nPasos", Math.max(4, geo()!.nPasos - 2))}
                      class="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
                    >
                      −
                    </button>
                    <span class="font-bold text-primary min-w-[30px] text-center">{geo()!.nPasos}</span>
                    <button
                      onClick={() => set("nPasos", geo()!.nPasos + 2)}
                      class="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </TableCell>
                <TableCell class="text-[10px] text-text-soft">{calc()!.pasosTramo} pasos/tramo × 2 tramos</TableCell>
              </TableRow>
              <ParamRow label="Contrapaso (cp)" k="cp" step={0.005} obs={`Altura/paso = ${(geo()!.cp * 100).toFixed(1)} cm`} />
              <ParamRow label="Paso (p)" k="p" step={0.010} obs={`Huella horizontal = ${(geo()!.p * 100).toFixed(0)} cm`} />
              <ParamRow label="Ancho de tramo" k="ancho" step={0.050} obs="Ancho libre c/tramo" />
              <ParamRow label="Ancho total" k="anchoTotal" step={0.050} obs="2 tramos + muro central" />
              <ParamRow label="Longitud descanso" k="descL" step={0.050} obs="Largo del descanso intermedio" />
              <ParamRow label="Garganta (t)" k="garganta" step={0.010} obs="Espesor ⊥ a pendiente" />
              <ParamRow label="Espesor descanso" k="eDesc" step={0.010} obs="Espesor losa del descanso" />
              <ParamRow label="Sep. Ø3/4" k="sep34" step={0.050} min={0.10} obs="Separación acero principal" />
              <ParamRow label="Sep. Ø1/2" k="sep12" step={0.050} min={0.10} obs="Separación bastones negativos" />
              <ParamRow label="Sep. Ø3/8" k="sep38" step={0.050} min={0.10} obs="Separación acero distribución" />
            </TableBody>
          </Table>

          {/* Calculated results */}
          <div class="text-xs font-bold text-text border-b border-border pb-1.5 uppercase tracking-wider">RESULTADOS CALCULADOS</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <For each={[
              { l: "Ángulo θ", v: () => `${(calc()!.theta * 180 / Math.PI).toFixed(1)}°`, c: "#2563EB" },
              { l: "L. inclinada", v: () => `${calc()!.lIncl.toFixed(2)} m`, c: "#2563EB" },
              { l: "h por tramo", v: () => `${calc()!.hTramo.toFixed(3)} m`, c: "#2563EB" },
              { l: "Espesor prom.", v: () => `${calc()!.eProm.toFixed(3)} m`, c: "#C62828" },
              { l: "Vol. concreto", v: () => `${calc()!.vTotal.toFixed(2)} m³`, c: "#1565C0" },
              { l: "Encofrado", v: () => `${calc()!.encTotal.toFixed(1)} m²`, c: "#E65100" },
            ]}>
              {(m) => (
                <div class="bg-card rounded-lg px-3 py-2.5 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <div class="text-[10px] text-text-soft">{m.l}</div>
                  <div class="text-base font-extrabold" style={{ color: m.c }}>{m.v()}</div>
                </div>
              )}
            </For>
          </div>

          {/* Formulas */}
          <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
            <b>Espesor promedio:</b> e<sub>prom</sub> = t/cosθ + cp/2 = {geo()!.garganta}/{calc()!.cosT.toFixed(4)} + {geo()!.cp}/2 = <b class="text-steel-58">{calc()!.eProm.toFixed(4)} m</b><br />
            <b>Volumen tramo:</b> {geo()!.ancho} × {calc()!.lHoriz.toFixed(2)} × {calc()!.eProm.toFixed(3)} = {calc()!.vTramo.toFixed(3)} m³ × 2 = <b>{calc()!.vTramos.toFixed(3)} m³</b><br />
            <b>Volumen descanso:</b> {geo()!.anchoTotal} × {geo()!.descL} × {geo()!.eDesc} = <b>{calc()!.vDesc.toFixed(3)} m³</b>
          </div>

          {/* Steel reinforcement */}
          <div class="text-xs font-bold text-text border-b border-border pb-1.5 uppercase tracking-wider">ACERO DE REFUERZO</div>

          <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
            <b class="text-steel-34">Ø3/4" — Principal inferior (longitudinal)</b><br />
            Barras/tramo = {geo()!.ancho}/{geo()!.sep34}+1 = <b>{calc()!.n34}</b> &nbsp;·&nbsp; L/barra = {calc()!.lIncl.toFixed(2)}+2×0.40 = <b>{calc()!.l34.toFixed(2)} m</b><br />
            2 tramos: {calc()!.n34}×{calc()!.l34.toFixed(2)}×2 = {(calc()!.m34tramo * 2).toFixed(1)}m &nbsp;+&nbsp; Descanso: {calc()!.n34desc}×{(geo()!.descL + 0.40).toFixed(2)} = {calc()!.m34desc.toFixed(1)}m<br />
            <b>Total = {calc()!.m34total.toFixed(1)} m → {calc()!.v34} varillas</b>
          </div>

          <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
            <b class="text-steel-12">Ø1/2" — Bastones negativos en apoyos (CORRECCIÓN)</b><br />
            L. bastón = Ln/4 + desarrollo = {calc()!.lHoriz.toFixed(2)}/4 + 0.40 = <b>{calc()!.lnBaston.toFixed(3)} m</b><br />
            Barras/apoyo = {calc()!.n12} &nbsp;·&nbsp; 4 zonas de apoyo (arranque + descanso×2 + llegada)<br />
            <b>Total = {calc()!.n12}×{calc()!.lnBaston.toFixed(3)}×4 = {calc()!.m12total.toFixed(1)} m → {calc()!.v12} varillas</b>
          </div>

          <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
            <b class="text-steel-38">Ø3/8" — Distribución transversal</b><br />
            En tramo: {calc()!.n38tramo} barras × {geo()!.ancho}m = {calc()!.m38tramo.toFixed(1)}m/tramo × 2<br />
            En descanso: {calc()!.n38desc} barras × {geo()!.anchoTotal}m = {calc()!.m38desc.toFixed(1)}m<br />
            <b>Total = {calc()!.m38total.toFixed(1)} m → {calc()!.v38} varillas</b>
          </div>

          {/* Summary table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Elemento</TableHead>
                <TableHead>Concreto m³</TableHead>
                <TableHead>Encofrado m²</TableHead>
                <TableHead class="bg-steel-34">Ø3/4" m</TableHead>
                <TableHead class="bg-steel-12">Ø1/2" m</TableHead>
                <TableHead class="bg-steel-38">Ø3/8" m</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={[
                { e: "Tramo 1", c: () => calc()!.vTramo, enc: () => calc()!.encTramo, s34: () => calc()!.m34tramo, s12: () => calc()!.n12 * calc()!.lnBaston, s38: () => calc()!.m38tramo },
                { e: "Tramo 2", c: () => calc()!.vTramo, enc: () => calc()!.encTramo, s34: () => calc()!.m34tramo, s12: () => calc()!.n12 * calc()!.lnBaston, s38: () => calc()!.m38tramo },
                { e: "Descanso", c: () => calc()!.vDesc, enc: () => calc()!.encDesc, s34: () => calc()!.m34desc, s12: () => calc()!.n12 * calc()!.lnBaston * 2, s38: () => calc()!.m38desc },
              ]}>
                {(r, i) => (
                  <TableRow class={i() % 2 === 0 ? "bg-muted/30" : ""}>
                    <TableCell>{r.e}</TableCell>
                    <TableCell class="text-right font-semibold">{r.c().toFixed(2)}</TableCell>
                    <TableCell class="text-right font-semibold">{r.enc().toFixed(2)}</TableCell>
                    <TableCell class="text-right font-semibold text-steel-34">{r.s34().toFixed(1)}</TableCell>
                    <TableCell class="text-right font-semibold text-steel-12">{r.s12().toFixed(1)}</TableCell>
                    <TableCell class="text-right font-semibold text-steel-38">{r.s38().toFixed(1)}</TableCell>
                  </TableRow>
                )}
              </For>
              <TableRow class="bg-primary-bg font-bold">
                <TableCell class="text-primary">TOTAL</TableCell>
                <TableCell class="text-right text-primary">{calc()!.vTotal.toFixed(2)}</TableCell>
                <TableCell class="text-right text-primary">{calc()!.encTotal.toFixed(1)}</TableCell>
                <TableCell class="text-right text-steel-34">{calc()!.m34total.toFixed(1)}</TableCell>
                <TableCell class="text-right text-steel-12">{calc()!.m12total.toFixed(1)}</TableCell>
                <TableCell class="text-right text-steel-38">{calc()!.m38total.toFixed(1)}</TableCell>
              </TableRow>
              <TableRow class="bg-muted">
                <TableCell class="font-bold text-text-mid">Varillas (÷9m)</TableCell>
                <TableCell class="text-center">—</TableCell>
                <TableCell class="text-center">—</TableCell>
                <TableCell class="text-right text-steel-34 font-extrabold">{calc()!.v34} vll</TableCell>
                <TableCell class="text-right text-steel-12 font-extrabold">{calc()!.v12} vll</TableCell>
                <TableCell class="text-right text-steel-38 font-extrabold">{calc()!.v38} vll</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Verification */}
          <div class="bg-muted/50 rounded-lg border border-border px-3.5 py-2.5 text-xs text-text-mid">
            <b>Verificación 2p+cp:</b> 2×{geo()!.p.toFixed(3)} + {geo()!.cp.toFixed(3)} = {calc()!.verif.toFixed(3)} m
            {calc()!.verif >= 0.60 && calc()!.verif <= 0.64 ? " ✅ Cumple (0.60 ≤ 2p+cp ≤ 0.64)" : " ⚠️ Fuera de rango (0.60–0.64)"}&nbsp;&nbsp;
            <b>Pendiente:</b> cp/p = {(geo()!.cp / geo()!.p).toFixed(2)} {geo()!.cp / geo()!.p <= 0.75 ? " ✅ ≤ 0.75" : " ⚠️"}&nbsp;&nbsp;
            <b>Ángulo:</b> {(calc()!.theta * 180 / Math.PI).toFixed(1)}° {calc()!.theta * 180 / Math.PI < 40 ? " ✅ < 40°" : " ⚠️"}
          </div>
        </Show>
      </CardContent>
    </Card>
  );
}
