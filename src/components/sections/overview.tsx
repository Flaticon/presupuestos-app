import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { Bar, Doughnut } from "solid-chartjs";
import { Chart, registerables } from "chart.js";
import { BUDGET_INIT } from "@/data/budget-data";
import { VIGAS_INIT } from "@/data/vigas-data";
import { COLUMNAS_INIT } from "@/data/columnas-data";
import { LOSA_PANOS_INIT } from "@/data/losa-data";
import type { BudgetSection } from "@/lib/types";
import type { SteelAgg } from "@/lib/section-data-context";
import { flatGroups, classifyItem } from "@/lib/budget-helpers";
import { useSectionData } from "@/lib/section-data-context";
import { useInsumos } from "@/lib/insumo-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useProject } from "@/lib/project-context";
import { useFloors } from "@/lib/floor-context";
import { getProjectLabel } from "@/lib/project-types";
import { fmtS } from "@/lib/utils";
import { Box, CircleDot, LayoutGrid, Ruler } from "lucide-solid";

interface ResumenRow {
  e: string;
  vol: number;
  v34: number; v58: number; v12: number; v38: number; v14: number;
  lad: number;
  color: string;
}

const KPI_CONFIG = [
  { key: "concreto", label: "m³ Concreto", color: "#3B82F6" },
  { key: "acero", label: "Varillas acero", color: "#EF4444" },
  { key: "ladrillos", label: "Ladrillos", color: "#F59E0B" },
  { key: "encofrado", label: "m² Encofrado vigas", color: "#10B981" },
] as const;

const KPI_ICONS = [Box, CircleDot, LayoutGrid, Ruler];

// Pre-compute initial aggregates from *_INIT data (fallback when sections not mounted)
function computeInitialAgg() {
  // Vigas
  const vigSteel: SteelAgg = { v34: 0, v58: 0, v12: 0, v38: 0, v14: 0 };
  let vigVol = 0, vigEnc = 0;
  for (const v of VIGAS_INIT) {
    vigVol += v.b * v.h * v.lt;
    vigEnc += (2 * v.h + v.b) * v.lt;
    vigSteel.v34 += Math.ceil((v.barras34 * v.lt * 1.05) / 9);
    vigSteel.v58 += Math.ceil((v.barras58 * v.lt * 1.05) / 9);
    vigSteel.v12 += Math.ceil((v.barras12 * v.lt * 1.05) / 9);
    vigSteel.v38 += Math.ceil((v.nEstr * v.lEstr) / 9);
  }
  // Columnas
  const colSteel: SteelAgg = { v34: 0, v58: 0, v12: 0, v38: 0, v14: 0 };
  let colVol = 0;
  const addColSteel = (dia: string, metros: number) => {
    const vll = Math.ceil(metros / 9);
    if (dia.includes("3/4")) colSteel.v34 += vll;
    else if (dia.includes("5/8")) colSteel.v58 += vll;
    else if (dia.includes("1/2")) colSteel.v12 += vll;
  };
  for (const c of COLUMNAS_INIT) {
    colVol += c.vol;
    if (c.dia1 !== "-") addColSteel(c.dia1, c.md1);
    if (c.dia2 !== "-") addColSteel(c.dia2, c.md2);
    colSteel.v38 += Math.ceil(c.mestr / 9);
  }
  // Losa
  let losaVol = 0, losaLad = 0;
  for (const p of LOSA_PANOS_INIT) {
    losaVol += p.vol;
    losaLad += p.lad;
  }
  return {
    vigas: { volTotal: +vigVol.toFixed(2), encTotal: +vigEnc.toFixed(2), steel: vigSteel },
    columnas: { volTotal: +colVol.toFixed(2), steel: colSteel },
    losa: { volTotal: +losaVol.toFixed(2), ladrillos: losaLad },
    // Escalera uses DEFAULT_GEO — hardcode the known initial values
    escalera: { volTotal: 2.30, steel: { v34: 12, v58: 0, v12: 8, v38: 18, v14: 0 } as SteelAgg },
  };
}
const INIT_AGG = computeInitialAgg();

export function Overview() {
  onMount(() => Chart.register(...registerables));

  const { activeProject } = useProject();
  const { floors } = useFloors();
  const sectionData = useSectionData();
  const { insumos } = useInsumos();

  // Load budget from API for cost breakdown (read-only snapshot)
  const [budgetSnapshot, setBudgetSnapshot] = createSignal<BudgetSection[]>(BUDGET_INIT);
  onMount(async () => {
    try {
      const resp = await fetch("/api/state/budget");
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0 && data[0].groups) {
        setBudgetSnapshot(data as BudgetSection[]);
      }
    } catch { /* fallback to BUDGET_INIT */ }
  });

  // Live resumen data from section aggregates (reactive, falls back to INIT data)
  const zeroSteel: SteelAgg = { v34: 0, v58: 0, v12: 0, v38: 0, v14: 0 };
  const resumenData = createMemo<ResumenRow[]>(() => {
    const agg = sectionData();
    const vigSteel = agg.vigas?.steel ?? INIT_AGG.vigas.steel;
    const colSteel = agg.columnas?.steel ?? INIT_AGG.columnas.steel;
    const escSteel = agg.escalera?.steel ?? INIT_AGG.escalera.steel;
    const losaLad = agg.losa?.ladrillos ?? INIT_AGG.losa.ladrillos;
    return [
      { e: "Vigas", vol: +(agg.vigas?.volTotal ?? INIT_AGG.vigas.volTotal), ...vigSteel, lad: 0, color: "#3B82F6" },
      { e: "Losa alig.", vol: +(agg.losa?.volTotal ?? INIT_AGG.losa.volTotal), ...zeroSteel, lad: losaLad, color: "#F59E0B" },
      { e: "Columnas", vol: +(agg.columnas?.volTotal ?? INIT_AGG.columnas.volTotal), ...colSteel, lad: 0, color: "#EF4444" },
      { e: "Losa maciza", vol: 3.38, ...zeroSteel, lad: 0, color: "#8B5CF6" },
      { e: "Escalera", vol: +(agg.escalera?.volTotal ?? INIT_AGG.escalera.volTotal), ...escSteel, lad: 0, color: "#10B981" },
    ];
  });

  // Reactive steel totals (replaces static STEEL_PIE)
  const steelPie = createMemo(() => {
    const rows = resumenData();
    return [
      { name: 'Ø3/4"', value: rows.reduce((s, r) => s + r.v34, 0), color: "#3B82F6" },
      { name: 'Ø5/8"', value: rows.reduce((s, r) => s + r.v58, 0), color: "#EF4444" },
      { name: 'Ø1/2"', value: rows.reduce((s, r) => s + r.v12, 0), color: "#10B981" },
      { name: 'Ø3/8"', value: rows.reduce((s, r) => s + r.v38, 0), color: "#F59E0B" },
      { name: 'Ø1/4"', value: rows.reduce((s, r) => s + r.v14, 0), color: "#8B5CF6" },
    ];
  });

  const totVol = createMemo(() => resumenData().reduce((s, r) => s + r.vol, 0));
  const totLad = createMemo(() => resumenData().reduce((s, r) => s + r.lad, 0));
  const totVll = createMemo(() => steelPie().reduce((s, r) => s + r.value, 0));

  const kpiValues = createMemo(() => {
    const agg = sectionData();
    const encVig = agg.vigas?.encTotal ?? INIT_AGG.vigas.encTotal;
    return [
      totVol().toFixed(1),
      totVll().toLocaleString(),
      totLad().toLocaleString(),
      `${encVig.toFixed(1)} m²`,
    ];
  });

  const insumoMap = createMemo(() => new Map(insumos().map((i) => [i.id, i])));

  const costByPiso = createMemo(() => {
    const floorMap = new Map(floors().map((f) => [f.id, f]));
    const pisoTotals = new Map<string, { mat: number; mo: number; eq: number }>();
    const iMap = insumoMap();

    for (const g of flatGroups(budgetSnapshot())) {
      const pisoId = g.piso ?? "sin-piso";
      if (!pisoTotals.has(pisoId)) pisoTotals.set(pisoId, { mat: 0, mo: 0, eq: 0 });
      const totals = pisoTotals.get(pisoId)!;

      for (const it of g.items) {
        const cost = it.m * it.cu;
        if (it.insumoId) {
          const ins = iMap.get(it.insumoId);
          if (ins) {
            if (ins.grupo === "mano-de-obra") totals.mo += cost;
            else if (ins.grupo === "equipo") totals.eq += cost;
            else totals.mat += cost;
          } else {
            totals.mat += cost;
          }
        } else {
          if (classifyItem(it.d) === "mano-de-obra") totals.mo += cost;
          else totals.mat += cost;
        }
      }
    }

    return Array.from(pisoTotals.entries()).map(([pisoId, t]) => ({
      pisoId,
      label: floorMap.get(pisoId)?.label ?? pisoId,
      color: floorMap.get(pisoId)?.color ?? "#6B7280",
      mat: t.mat,
      mo: t.mo,
      eq: t.eq,
      total: t.mat + t.mo + t.eq,
    }));
  });

  const costTotals = createMemo(() =>
    costByPiso().reduce(
      (acc, r) => ({ mat: acc.mat + r.mat, mo: acc.mo + r.mo, eq: acc.eq + r.eq, total: acc.total + r.total }),
      { mat: 0, mo: 0, eq: 0, total: 0 },
    )
  );

  // Chart.js data for concrete distribution (horizontal bar)
  const concreteChartData = createMemo(() => ({
    labels: resumenData().map((r) => r.e),
    datasets: [
      {
        label: "Volumen m³",
        data: resumenData().map((r) => +r.vol.toFixed(2)),
        backgroundColor: resumenData().map((r) => r.color),
        borderRadius: 4,
        barThickness: 24,
      },
    ],
  }));

  const concreteChartOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#18181B",
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        callbacks: {
          label: (ctx: any) => `${ctx.raw} m³`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 10 }, color: "#A3A3A3" }, grid: { display: true, color: "#F5F5F5" }, border: { display: false } },
      y: { ticks: { font: { size: 11, weight: "bold" as const }, color: "#525252" }, grid: { display: false }, border: { display: false } },
    },
  };

  // Chart.js data for steel doughnut (reactive from section data)
  const steelDoughnutData = createMemo(() => ({
    labels: steelPie().map((d) => d.name),
    datasets: [
      {
        data: steelPie().map((d) => d.value),
        backgroundColor: steelPie().map((d) => d.color),
        borderColor: "#FAFAFA",
        borderWidth: 3,
      },
    ],
  }));

  const steelDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: { display: true, position: "bottom" as const, labels: { font: { size: 10 }, padding: 14, usePointStyle: true, pointStyle: "circle" } },
      tooltip: { backgroundColor: "#18181B", titleFont: { size: 11 }, bodyFont: { size: 11 } },
    },
  };

  // Chart.js data for steel by element (stacked bar)
  const steelBarData = createMemo(() => {
    const filtered = resumenData().filter((r) => r.v34 + r.v58 + r.v12 + r.v38 + r.v14 > 0);
    return {
      labels: filtered.map((r) => r.e),
      datasets: [
        { label: 'Ø3/4"', data: filtered.map((r) => r.v34), backgroundColor: "#3B82F6" },
        { label: 'Ø5/8"', data: filtered.map((r) => r.v58), backgroundColor: "#EF4444" },
        { label: 'Ø1/2"', data: filtered.map((r) => r.v12), backgroundColor: "#10B981" },
        { label: 'Ø3/8"', data: filtered.map((r) => r.v38), backgroundColor: "#F59E0B" },
      ],
    };
  });

  const steelBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { font: { size: 10 }, padding: 14, usePointStyle: true, pointStyle: "circle" } },
      tooltip: { backgroundColor: "#18181B", titleFont: { size: 11 }, bodyFont: { size: 11 } },
    },
    scales: {
      x: { stacked: true, ticks: { font: { size: 9 }, color: "#737373", maxRotation: 25 }, grid: { display: false }, border: { display: false } },
      y: { stacked: true, barPercentage: 0.7, ticks: { font: { size: 9 }, color: "#A3A3A3" }, grid: { display: true, color: "#F5F5F5" }, border: { display: false } },
    },
  };

  const globalMatPct = () => costTotals().total > 0 ? ((costTotals().mat / costTotals().total) * 100).toFixed(0) : "0";
  const globalMoPct = () => costTotals().total > 0 ? ((costTotals().mo / costTotals().total) * 100).toFixed(0) : "0";
  const globalEqPct = () => costTotals().total > 0 ? ((costTotals().eq / costTotals().total) * 100).toFixed(0) : "0";

  return (
    <div class="space-y-6">
      {/* Project Info Banner */}
      <Show when={activeProject()}>
        {(project) => (
          <div class="bg-card border border-border rounded-xl px-5 py-4">
            <div class="flex items-center gap-1.5 mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span class="text-[10px] uppercase tracking-wider text-text-soft font-medium">Proyecto Activo</span>
            </div>
            <div class="text-sm font-semibold text-text">{project().name}</div>
            <div class="text-xs text-text-mid mt-1">
              {project().floor}
              <Show when={project().building}>{` · ${project().building}`}</Show>
              <Show when={project().city}>{` · ${project().city}`}</Show>
            </div>
            <div class="text-[11px] text-text-soft mt-1">
              <Show when={project().engineer}>{`Ing. ${project().engineer}`}</Show>
              <Show when={project().cip}>{` · CIP ${project().cip}`}</Show>
              {` · f'c=${project().fc} kg/cm²`}
              {` · fy=${project().fy} kg/cm²`}
              <Show when={project().norm}>{` · ${project().norm}`}</Show>
            </div>
          </div>
        )}
      </Show>

      {/* KPIs */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <For each={KPI_CONFIG as unknown as typeof KPI_CONFIG[number][]}>
          {(k, idx) => {
            const Icon = KPI_ICONS[idx()];
            return (
              <div class="rounded-xl bg-card border border-border p-4 flex items-start gap-3">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ "background-color": `${k.color}15` }}
                >
                  <Icon size={18} color={k.color} />
                </div>
                <div>
                  <div class="text-xl font-bold text-text leading-none tracking-tight">
                    {kpiValues()[idx()]}
                  </div>
                  <div class="text-[10px] uppercase tracking-wider text-text-soft mt-1.5 font-medium">
                    {k.label}
                  </div>
                </div>
              </div>
            );
          }}
        </For>
      </div>

      {/* Section: Volúmenes */}
      <div>
        <span class="text-[11px] uppercase tracking-widest text-text-soft font-medium">Volúmenes</span>
      </div>

      {/* Concrete distribution chart */}
      <Card>
        <CardHeader class="border-b border-border/50">
          <div class="flex items-center gap-2">
            <div class="w-0.5 h-4 rounded-full bg-[#3B82F6]" />
            <CardTitle class="text-text">Distribución de Concreto por Elemento (m³)</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="p-5">
          <div class="h-[200px]">
            <Bar data={concreteChartData()} options={concreteChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Section: Acero */}
      <div>
        <span class="text-[11px] uppercase tracking-widest text-text-soft font-medium">Acero de Refuerzo</span>
      </div>

      {/* Steel charts row */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader class="border-b border-border/50">
            <div class="flex items-center gap-2">
              <div class="w-0.5 h-4 rounded-full bg-[#EF4444]" />
              <CardTitle class="text-text">Varillas por Diámetro</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-5">
            <div class="h-[220px]">
              <Doughnut data={steelDoughnutData()} options={steelDoughnutOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="border-b border-border/50">
            <div class="flex items-center gap-2">
              <div class="w-0.5 h-4 rounded-full bg-[#F59E0B]" />
              <CardTitle class="text-text">Acero por Elemento (varillas)</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-5">
            <div class="h-[220px]">
              <Bar data={steelBarData()} options={steelBarOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section: Resúmenes */}
      <div>
        <span class="text-[11px] uppercase tracking-widest text-text-soft font-medium">Resúmenes</span>
      </div>

      {/* Summary table */}
      <Card>
        <CardHeader class="bg-[#18181B]">
          <div class="flex items-center gap-2">
            <CardTitle class="text-white">Resumen General de Metrados</CardTitle>
            <span class="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-medium text-white/60">{resumenData().length} partidas</span>
          </div>
          <CardDescription class="text-white/50">{activeProject() ? getProjectLabel(activeProject()!) : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table class="spreadsheet-table">
            <TableHeader>
              <TableRow>
                <TableHead class="text-left">Partida</TableHead>
                <TableHead>Concreto m³</TableHead>
                <TableHead>Ladrillos</TableHead>
                <TableHead class="bg-[#3B82F6]/10 text-[#3B82F6] font-semibold">Ø3/4"</TableHead>
                <TableHead class="bg-[#EF4444]/10 text-[#EF4444] font-semibold">Ø5/8"</TableHead>
                <TableHead class="bg-[#10B981]/10 text-[#10B981] font-semibold">Ø1/2"</TableHead>
                <TableHead class="bg-[#F59E0B]/10 text-[#F59E0B] font-semibold">Ø3/8"</TableHead>
                <TableHead class="bg-[#8B5CF6]/10 text-[#8B5CF6] font-semibold">Ø1/4"</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={resumenData()}>
                {(r, i) => (
                  <TableRow class={i() % 2 === 0 ? "bg-muted/30" : ""}>
                    <TableCell class="font-semibold">
                      <span class="inline-block w-2.5 h-2.5 rounded-[3px] mr-1.5 align-middle" style={{ "background-color": r.color }} />
                      {r.e}
                    </TableCell>
                    <TableCell class="text-center font-bold text-[#3B82F6]">{r.vol.toFixed(2)}</TableCell>
                    <TableCell class="text-center">{r.lad || "-"}</TableCell>
                    <TableCell class="text-center font-semibold text-[#3B82F6]">{r.v34 || "-"}</TableCell>
                    <TableCell class="text-center font-semibold text-[#EF4444]">{r.v58 || "-"}</TableCell>
                    <TableCell class="text-center font-semibold text-[#10B981]">{r.v12 || "-"}</TableCell>
                    <TableCell class="text-center font-semibold text-[#F59E0B]">{r.v38 || "-"}</TableCell>
                    <TableCell class="text-center font-semibold text-[#8B5CF6]">{r.v14 || "-"}</TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
            <TableFooter>
              <TableRow class="bg-muted/50 font-extrabold border-t-2 border-border">
                <TableCell class="text-text">Total</TableCell>
                <TableCell class="text-center text-[#3B82F6]">{totVol().toFixed(2)}</TableCell>
                <TableCell class="text-center text-text">{totLad().toLocaleString()}</TableCell>
                <For each={steelPie()}>
                  {(d) => (
                    <TableCell class="text-center" style={{ color: d.color }}>{d.value}</TableCell>
                  )}
                </For>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Cost breakdown by floor */}
      <Card>
        <CardHeader class="bg-[#18181B]">
          <CardTitle class="text-white">Resumen de Costos por Piso</CardTitle>
          <CardDescription class="text-white/50">Materiales, Mano de Obra y Equipos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table class="spreadsheet-table">
            <TableHeader>
              <TableRow>
                <TableHead class="text-left">Piso</TableHead>
                <TableHead class="text-right">Materiales</TableHead>
                <TableHead class="text-right">Mano de Obra</TableHead>
                <TableHead class="text-right">Equipos</TableHead>
                <TableHead class="text-right">Total</TableHead>
                <TableHead class="w-[200px]">Distribución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={costByPiso()}>
                {(row, i) => {
                  const matPct = row.total > 0 ? (row.mat / row.total) * 100 : 0;
                  const moPct = row.total > 0 ? (row.mo / row.total) * 100 : 0;
                  const eqPct = row.total > 0 ? (row.eq / row.total) * 100 : 0;
                  return (
                    <TableRow class={i() % 2 === 0 ? "bg-muted/30" : ""}>
                      <TableCell class="font-semibold">
                        <span class="inline-block w-2.5 h-2.5 rounded-[3px] mr-1.5 align-middle" style={{ "background-color": row.color }} />
                        {row.label}
                      </TableCell>
                      <TableCell class="text-right text-xs font-semibold tabular-nums">{fmtS(row.mat)}</TableCell>
                      <TableCell class="text-right text-xs font-semibold tabular-nums">{fmtS(row.mo)}</TableCell>
                      <TableCell class="text-right text-xs font-semibold tabular-nums">{fmtS(row.eq)}</TableCell>
                      <TableCell class="text-right text-xs font-bold tabular-nums">{fmtS(row.total)}</TableCell>
                      <TableCell>
                        <div class="flex h-2.5 w-full rounded-full overflow-hidden" title={`Mat: ${matPct.toFixed(1)}% | MO: ${moPct.toFixed(1)}% | Eq: ${eqPct.toFixed(1)}%`}>
                          {matPct > 0 && <div class="bg-[#3B82F6]" style={{ width: `${matPct}%` }} />}
                          {moPct > 0 && <div class="bg-[#F59E0B]" style={{ width: `${moPct}%` }} />}
                          {eqPct > 0 && <div class="bg-[#10B981]" style={{ width: `${eqPct}%` }} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }}
              </For>
            </TableBody>
            <TableFooter>
              <TableRow class="bg-muted/50 font-extrabold border-t-2 border-border">
                <TableCell class="text-text">Total</TableCell>
                <TableCell class="text-right text-xs tabular-nums">{fmtS(costTotals().mat)}</TableCell>
                <TableCell class="text-right text-xs tabular-nums">{fmtS(costTotals().mo)}</TableCell>
                <TableCell class="text-right text-xs tabular-nums">{fmtS(costTotals().eq)}</TableCell>
                <TableCell class="text-right text-xs tabular-nums">{fmtS(costTotals().total)}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-3 text-[10px]">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-[#3B82F6]" />Mat. {globalMatPct()}%</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-[#F59E0B]" />MO {globalMoPct()}%</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-[#10B981]" />Eq. {globalEqPct()}%</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
