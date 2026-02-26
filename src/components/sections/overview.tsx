import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { RESUMEN_DATA, STEEL_PIE } from "@/data/resumen-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useProject } from "@/lib/project-context";
import { getProjectLabel } from "@/lib/project-types";

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

export function Overview() {
  const { activeProject } = useProject();
  const totVol = RESUMEN_DATA.reduce((s, r) => s + r.vol, 0);
  const totLad = RESUMEN_DATA.reduce((s, r) => s + r.lad, 0);
  const totVll = STEEL_PIE.reduce((s, r) => s + r.value, 0);

  const kpiValues = [
    totVol.toFixed(1),
    totVll.toLocaleString(),
    totLad.toLocaleString(),
    "220.8 m²",
  ];

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
    </div>
  );
}
