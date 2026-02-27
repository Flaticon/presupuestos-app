import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { RESUMEN_DATA, STEEL_PIE } from "@/data/resumen-data";
import { BUDGET_INIT } from "@/data/budget-data";
import { INSUMOS_INIT } from "@/data/insumos-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useProject } from "@/lib/project-context";
import { useFloors } from "@/lib/floor-context";
import { getProjectLabel } from "@/lib/project-types";
import { fmtS } from "@/lib/utils";

const KPI_CONFIG = [
  { key: "concreto", label: "m³ Concreto", icon: "◼", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  { key: "acero", label: "Varillas acero", icon: "⦿", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  { key: "ladrillos", label: "Ladrillos", icon: "▦", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  { key: "encofrado", label: "Encofrado vigas", icon: "▭", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
] as const;

const TOOLTIP_STYLE = {
  fontSize: 11,
  borderRadius: 12,
  border: "none",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  padding: "8px 12px",
};

function classifyItem(d: string): "mano-de-obra" | "material" {
  const dl = d.toLowerCase();
  if (dl.startsWith("mo ") || dl.startsWith("mano de obra") || dl === "mano de obra") return "mano-de-obra";
  return "material";
}

export function Overview() {
  const { activeProject } = useProject();
  const { floors } = useFloors();
  const totVol = RESUMEN_DATA.reduce((s, r) => s + r.vol, 0);
  const totLad = RESUMEN_DATA.reduce((s, r) => s + r.lad, 0);
  const totVll = STEEL_PIE.reduce((s, r) => s + r.value, 0);

  const kpiValues = [
    totVol.toFixed(1),
    totVll.toLocaleString(),
    totLad.toLocaleString(),
    "220.8 m²",
  ];

  // Compute cost breakdown by piso from static data
  const floorMap = new Map(floors.map((f) => [f.id, f]));
  const insumoMap = new Map(INSUMOS_INIT.map((i) => [i.id, i]));

  const costByPiso = useMemo(() => {
    const pisoTotals = new Map<string, { mat: number; mo: number; eq: number }>();

    for (const g of BUDGET_INIT) {
      const pisoId = g.piso ?? "sin-piso";
      if (!pisoTotals.has(pisoId)) pisoTotals.set(pisoId, { mat: 0, mo: 0, eq: 0 });
      const totals = pisoTotals.get(pisoId)!;

      for (const it of g.items) {
        const cost = it.m * it.cu;
        if (it.insumoId) {
          const ins = insumoMap.get(it.insumoId);
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
  }, [floorMap, insumoMap]);

  const costTotals = costByPiso.reduce(
    (acc, r) => ({ mat: acc.mat + r.mat, mo: acc.mo + r.mo, eq: acc.eq + r.eq, total: acc.total + r.total }),
    { mat: 0, mo: 0, eq: 0, total: 0 },
  );

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPI_CONFIG.map((k, i) => (
          <div
            key={k.key}
            className="rounded-2xl p-4 border transition-shadow hover:shadow-md"
            style={{ backgroundColor: k.bg, borderColor: k.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base leading-none" style={{ color: k.color }}>{k.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: k.color, opacity: 0.7 }}>
                {k.label}
              </span>
            </div>
            <div className="text-2xl font-extrabold leading-none tracking-tight" style={{ color: k.color }}>
              {kpiValues[i]}
            </div>
          </div>
        ))}
      </div>

      {/* Concrete distribution chart */}
      <Card>
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-[#3B82F6]" />
            <CardTitle className="text-text">Distribución de Concreto por Elemento (m³)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RESUMEN_DATA} layout="vertical" margin={{ left: 60, right: 20, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="e" tick={{ fontSize: 11, fill: "#52525B", fontWeight: 500 }} tickLine={false} axisLine={false} width={55} />
                <Tooltip formatter={(v: number) => [`${v} m³`, "Volumen"]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="vol" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 10, fill: "#52525B", fontWeight: 600, formatter: (v: number) => `${v}` }}>
                  {RESUMEN_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Steel charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#EF4444]" />
              <CardTitle className="text-text">Varillas por Diámetro</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STEEL_PIE}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={75}
                    paddingAngle={2}
                    label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                    labelLine={{ stroke: "#d4d4d8", strokeWidth: 0.5 }}
                    fontSize={9}
                  >
                    {STEEL_PIE.map((d, i) => <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#F59E0B]" />
              <CardTitle className="text-text">Acero por Elemento (varillas)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={RESUMEN_DATA.filter((r) => r.v34 + r.v58 + r.v12 + r.v38 + r.v14 > 0)}
                  margin={{ left: 4, right: 8, top: 4, bottom: 30 }}
                >
                  <XAxis dataKey="e" tick={{ fontSize: 9, fill: "#71717A" }} angle={-25} textAnchor="end" tickLine={false} height={40} />
                  <YAxis tick={{ fontSize: 9, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="v34" name={'Ø3/4"'} stackId="a" fill="#3B82F6" />
                  <Bar dataKey="v58" name={'Ø5/8"'} stackId="a" fill="#EF4444" />
                  <Bar dataKey="v12" name={'Ø1/2"'} stackId="a" fill="#10B981" />
                  <Bar dataKey="v38" name={'Ø3/8"'} stackId="a" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#0F172A] to-[#1E293B]">
          <CardTitle className="text-white">RESUMEN GENERAL DE METRADOS</CardTitle>
          <CardDescription className="text-white/50">{activeProject ? getProjectLabel(activeProject) : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="spreadsheet-table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Partida</TableHead>
                <TableHead>Concreto m³</TableHead>
                <TableHead>Ladrillos</TableHead>
                <TableHead className="bg-[#3B82F6] text-white">Ø3/4"</TableHead>
                <TableHead className="bg-[#EF4444] text-white">Ø5/8"</TableHead>
                <TableHead className="bg-[#10B981] text-white">Ø1/2"</TableHead>
                <TableHead className="bg-[#F59E0B] text-white">Ø3/8"</TableHead>
                <TableHead className="bg-[#8B5CF6] text-white">Ø1/4"</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESUMEN_DATA.map((r, i) => (
                <TableRow key={i} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                  <TableCell className="font-semibold">
                    <span className="inline-block w-2.5 h-2.5 rounded-[3px] mr-1.5 align-middle" style={{ backgroundColor: r.color }} />
                    {r.e}
                  </TableCell>
                  <TableCell className="text-center font-bold text-[#3B82F6]">{r.vol.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{r.lad || "-"}</TableCell>
                  <TableCell className="text-center font-semibold text-[#3B82F6]">{r.v34 || "-"}</TableCell>
                  <TableCell className="text-center font-semibold text-[#EF4444]">{r.v58 || "-"}</TableCell>
                  <TableCell className="text-center font-semibold text-[#10B981]">{r.v12 || "-"}</TableCell>
                  <TableCell className="text-center font-semibold text-[#F59E0B]">{r.v38 || "-"}</TableCell>
                  <TableCell className="text-center font-semibold text-[#8B5CF6]">{r.v14 || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-[#F8FAFC] font-extrabold">
                <TableCell className="text-[#0F172A]">TOTAL</TableCell>
                <TableCell className="text-center text-[#3B82F6]">{totVol.toFixed(2)}</TableCell>
                <TableCell className="text-center text-[#0F172A]">{totLad.toLocaleString()}</TableCell>
                {STEEL_PIE.map((d, i) => (
                  <TableCell key={i} className="text-center" style={{ color: d.color }}>{d.value}</TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Cost breakdown by floor */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#0F172A] to-[#1E293B]">
          <CardTitle className="text-white">RESUMEN DE COSTOS POR PISO</CardTitle>
          <CardDescription className="text-white/50">Materiales, Mano de Obra y Equipos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="spreadsheet-table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Piso</TableHead>
                <TableHead className="text-right">Materiales</TableHead>
                <TableHead className="text-right">Mano de Obra</TableHead>
                <TableHead className="text-right">Equipos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[200px]">Distribución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costByPiso.map((row, i) => {
                const matPct = row.total > 0 ? (row.mat / row.total) * 100 : 0;
                const moPct = row.total > 0 ? (row.mo / row.total) * 100 : 0;
                const eqPct = row.total > 0 ? (row.eq / row.total) * 100 : 0;
                return (
                  <TableRow key={row.pisoId} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                    <TableCell className="font-semibold">
                      <span className="inline-block w-2.5 h-2.5 rounded-[3px] mr-1.5 align-middle" style={{ backgroundColor: row.color }} />
                      {row.label}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">{fmtS(row.mat)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">{fmtS(row.mo)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">{fmtS(row.eq)}</TableCell>
                    <TableCell className="text-right text-xs font-bold tabular-nums">{fmtS(row.total)}</TableCell>
                    <TableCell>
                      <div className="flex h-4 w-full rounded-md overflow-hidden" title={`Mat: ${matPct.toFixed(1)}% | MO: ${moPct.toFixed(1)}% | Eq: ${eqPct.toFixed(1)}%`}>
                        {matPct > 0 && <div className="bg-[#3B82F6]" style={{ width: `${matPct}%` }} />}
                        {moPct > 0 && <div className="bg-[#F59E0B]" style={{ width: `${moPct}%` }} />}
                        {eqPct > 0 && <div className="bg-[#10B981]" style={{ width: `${eqPct}%` }} />}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-[#F8FAFC] font-extrabold">
                <TableCell className="text-[#0F172A]">TOTAL</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{fmtS(costTotals.mat)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{fmtS(costTotals.mo)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{fmtS(costTotals.eq)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{fmtS(costTotals.total)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#3B82F6]" />Mat.</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#F59E0B]" />MO</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#10B981]" />Eq.</span>
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
