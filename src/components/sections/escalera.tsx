import { useState } from "react";
import type { EscaleraGeo } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StaircaseDynamic } from "@/components/diagrams/staircase-dynamic";

export function Escalera() {
  const [geo, setGeo] = useState<EscaleraGeo>({
    nPasos: 18, cp: 0.175, p: 0.250,
    ancho: 1.20, anchoTotal: 2.40,
    descL: 0.90, garganta: 0.20, eDesc: 0.20,
    sep34: 0.20, sep12: 0.20, sep38: 0.20,
  });
  const set = (k: keyof EscaleraGeo, v: number) => setGeo((g) => ({ ...g, [k]: v }));

  // Derived calculations
  const pasosTramo = Math.floor(geo.nPasos / 2);
  const hTramo = pasosTramo * geo.cp;
  const lHoriz = pasosTramo * geo.p;
  const theta = Math.atan(hTramo / lHoriz);
  const cosT = Math.cos(theta);
  const lIncl = Math.sqrt(lHoriz ** 2 + hTramo ** 2);

  // Volume
  const eProm = geo.garganta / cosT + geo.cp / 2;
  const vTramo = geo.ancho * lHoriz * eProm;
  const vTramos = vTramo * 2;
  const vDesc = geo.anchoTotal * geo.descL * geo.eDesc;
  const vTotal = vTramos + vDesc;

  // Formwork
  const encTramo = geo.ancho * lIncl;
  const encTramos = encTramo * 2;
  const encDesc = geo.anchoTotal * geo.descL;
  const encTotal = encTramos + encDesc;

  // Steel Ø3/4" — main
  const n34 = Math.floor(geo.ancho / geo.sep34) + 1;
  const l34 = lIncl + 2 * 0.40;
  const m34tramo = n34 * l34;
  const n34desc = Math.floor(geo.anchoTotal / geo.sep34) + 1;
  const m34desc = n34desc * (geo.descL + 0.40);
  const m34total = m34tramo * 2 + m34desc;
  const v34 = Math.ceil(m34total / 9);

  // Steel Ø1/2" — negative
  const n12 = Math.floor(geo.ancho / geo.sep12) + 1;
  const lnBaston = lHoriz * 0.25 + 0.40;
  const m12total = n12 * lnBaston * 4;
  const v12 = Math.ceil(m12total / 9);

  // Steel Ø3/8" — distribution
  const n38tramo = Math.floor(lIncl / geo.sep38) + 1;
  const m38tramo = n38tramo * geo.ancho;
  const n38desc = Math.floor(geo.descL / geo.sep38) + 1;
  const m38desc = n38desc * geo.anchoTotal;
  const m38total = m38tramo * 2 + m38desc;
  const v38 = Math.ceil(m38total / 9);

  // Verification
  const verif = 2 * geo.p + geo.cp;

  const ParamRow = ({
    label, k, step = 0.005, min = 0.01, obs,
  }: {
    label: string; k: keyof EscaleraGeo; step?: number; min?: number; obs: string;
  }) => (
    <TableRow className="border-b border-border">
      <TableCell className="font-semibold">{label}</TableCell>
      <TableCell className="text-center w-[90px]">
        <div className="flex items-center gap-1 justify-center">
          <button
            onClick={() => set(k, Math.max(min, +(geo[k] - step).toFixed(4)))}
            className="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
          >
            −
          </button>
          <span className="font-bold text-primary min-w-[40px] text-center">{geo[k].toFixed(3)}</span>
          <button
            onClick={() => set(k, +(geo[k] + step).toFixed(4))}
            className="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
          >
            +
          </button>
        </div>
      </TableCell>
      <TableCell className="text-[10px] text-text-soft">{obs}</TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader className="bg-[#1E293B]">
        <CardTitle className="text-white">ESCALERA — Metrado Editable</CardTitle>
        <CardDescription className="text-white/60">
          Tipo U · {geo.nPasos} pasos · Vol ≈ {vTotal.toFixed(2)} m³
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Dynamic diagram */}
        <StaircaseDynamic
          nPasos={geo.nPasos} cp={geo.cp} p={geo.p}
          ancho={geo.ancho} descL={geo.descL} garganta={geo.garganta}
        />

        {/* Editable parameters */}
        <div className="text-xs font-bold text-text border-b border-border pb-1.5 uppercase tracking-wider">
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
            <TableRow className="bg-muted/50">
              <TableCell className="font-semibold">N° de pasos (total)</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <button
                    onClick={() => set("nPasos", Math.max(4, geo.nPasos - 2))}
                    className="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="font-bold text-primary min-w-[30px] text-center">{geo.nPasos}</span>
                  <button
                    onClick={() => set("nPasos", geo.nPasos + 2)}
                    className="border border-border rounded bg-white w-5 h-5 text-sm leading-none cursor-pointer hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-[10px] text-text-soft">{pasosTramo} pasos/tramo × 2 tramos</TableCell>
            </TableRow>
            <ParamRow label="Contrapaso (cp)" k="cp" step={0.005} obs={`Altura/paso = ${(geo.cp * 100).toFixed(1)} cm`} />
            <ParamRow label="Paso (p)" k="p" step={0.010} obs={`Huella horizontal = ${(geo.p * 100).toFixed(0)} cm`} />
            <ParamRow label="Ancho de tramo" k="ancho" step={0.050} obs="Ancho libre c/tramo" />
            <ParamRow label="Ancho total" k="anchoTotal" step={0.050} obs="2 tramos + muro central" />
            <ParamRow label="Longitud descanso" k="descL" step={0.050} obs="Largo del descanso intermedio" />
            <ParamRow label="Garganta (t)" k="garganta" step={0.010} obs="Espesor ⊥ a pendiente" />
            <ParamRow label="Sep. Ø3/4" k="sep34" step={0.050} min={0.10} obs="Separación acero principal" />
            <ParamRow label="Sep. Ø1/2" k="sep12" step={0.050} min={0.10} obs="Separación bastones negativos" />
            <ParamRow label="Sep. Ø3/8" k="sep38" step={0.050} min={0.10} obs="Separación acero distribución" />
          </TableBody>
        </Table>

        {/* Calculated results */}
        <div className="text-xs font-bold text-text border-b border-border pb-1.5 uppercase tracking-wider">RESULTADOS CALCULADOS</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { l: "Ángulo θ", v: `${(theta * 180 / Math.PI).toFixed(1)}°`, c: "#2563EB" },
            { l: "L. inclinada", v: `${lIncl.toFixed(2)} m`, c: "#2563EB" },
            { l: "h por tramo", v: `${hTramo.toFixed(3)} m`, c: "#2563EB" },
            { l: "Espesor prom.", v: `${eProm.toFixed(3)} m`, c: "#C62828" },
            { l: "Vol. concreto", v: `${vTotal.toFixed(2)} m³`, c: "#1565C0" },
            { l: "Encofrado", v: `${encTotal.toFixed(1)} m²`, c: "#E65100" },
          ].map((m, i) => (
            <div key={i} className="bg-card rounded-xl px-3 py-2.5 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="text-[10px] text-text-soft">{m.l}</div>
              <div className="text-base font-extrabold" style={{ color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Formulas */}
        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b>Espesor promedio:</b> e<sub>prom</sub> = t/cosθ + cp/2 = {geo.garganta}/{cosT.toFixed(4)} + {geo.cp}/2 = <b className="text-steel-58">{eProm.toFixed(4)} m</b><br />
          <b>Volumen tramo:</b> {geo.ancho} × {lHoriz.toFixed(2)} × {eProm.toFixed(3)} = {vTramo.toFixed(3)} m³ × 2 = <b>{vTramos.toFixed(3)} m³</b><br />
          <b>Volumen descanso:</b> {geo.anchoTotal} × {geo.descL} × {geo.eDesc} = <b>{vDesc.toFixed(3)} m³</b>
        </div>

        {/* Steel reinforcement */}
        <div className="text-xs font-bold text-text border-b border-border pb-1.5 uppercase tracking-wider">ACERO DE REFUERZO</div>

        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b className="text-steel-34">Ø3/4" — Principal inferior (longitudinal)</b><br />
          Barras/tramo = {geo.ancho}/{geo.sep34}+1 = <b>{n34}</b> &nbsp;·&nbsp; L/barra = {lIncl.toFixed(2)}+2×0.40 = <b>{l34.toFixed(2)} m</b><br />
          2 tramos: {n34}×{l34.toFixed(2)}×2 = {(m34tramo * 2).toFixed(1)}m &nbsp;+&nbsp; Descanso: {n34desc}×{(geo.descL + 0.40).toFixed(2)} = {m34desc.toFixed(1)}m<br />
          <b>Total = {m34total.toFixed(1)} m → {v34} varillas</b>
        </div>

        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b className="text-steel-12">Ø1/2" — Bastones negativos en apoyos (CORRECCIÓN)</b><br />
          L. bastón = Ln/4 + desarrollo = {lHoriz.toFixed(2)}/4 + 0.40 = <b>{lnBaston.toFixed(3)} m</b><br />
          Barras/apoyo = {n12} &nbsp;·&nbsp; 4 zonas de apoyo (arranque + descanso×2 + llegada)<br />
          <b>Total = {n12}×{lnBaston.toFixed(3)}×4 = {m12total.toFixed(1)} m → {v12} varillas</b>
        </div>

        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed">
          <b className="text-steel-38">Ø3/8" — Distribución transversal</b><br />
          En tramo: {n38tramo} barras × {geo.ancho}m = {m38tramo.toFixed(1)}m/tramo × 2<br />
          En descanso: {n38desc} barras × {geo.anchoTotal}m = {m38desc.toFixed(1)}m<br />
          <b>Total = {m38total.toFixed(1)} m → {v38} varillas</b>
        </div>

        {/* Summary table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Elemento</TableHead>
              <TableHead>Concreto m³</TableHead>
              <TableHead>Encofrado m²</TableHead>
              <TableHead className="bg-steel-34">Ø3/4" m</TableHead>
              <TableHead className="bg-steel-12">Ø1/2" m</TableHead>
              <TableHead className="bg-steel-38">Ø3/8" m</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { e: "Tramo 1", c: vTramo, enc: encTramo, s34: m34tramo, s12: n12 * lnBaston, s38: m38tramo },
              { e: "Tramo 2", c: vTramo, enc: encTramo, s34: m34tramo, s12: n12 * lnBaston, s38: m38tramo },
              { e: "Descanso", c: vDesc, enc: encDesc, s34: m34desc, s12: n12 * lnBaston * 2, s38: m38desc },
            ].map((r, i) => (
              <TableRow key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                <TableCell>{r.e}</TableCell>
                <TableCell className="text-right font-semibold">{r.c.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{r.enc.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold text-steel-34">{r.s34.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold text-steel-12">{r.s12.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold text-steel-38">{r.s38.toFixed(1)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary-bg font-bold">
              <TableCell className="text-primary">TOTAL</TableCell>
              <TableCell className="text-right text-primary">{vTotal.toFixed(2)}</TableCell>
              <TableCell className="text-right text-primary">{encTotal.toFixed(1)}</TableCell>
              <TableCell className="text-right text-steel-34">{m34total.toFixed(1)}</TableCell>
              <TableCell className="text-right text-steel-12">{m12total.toFixed(1)}</TableCell>
              <TableCell className="text-right text-steel-38">{m38total.toFixed(1)}</TableCell>
            </TableRow>
            <TableRow className="bg-muted">
              <TableCell className="font-bold text-text-mid">Varillas (÷9m)</TableCell>
              <TableCell className="text-center">—</TableCell>
              <TableCell className="text-center">—</TableCell>
              <TableCell className="text-right text-steel-34 font-extrabold">{v34} vll</TableCell>
              <TableCell className="text-right text-steel-12 font-extrabold">{v12} vll</TableCell>
              <TableCell className="text-right text-steel-38 font-extrabold">{v38} vll</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Verification */}
        <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 text-xs text-text-mid">
          <b>Verificación 2p+cp:</b> 2×{geo.p.toFixed(3)} + {geo.cp.toFixed(3)} = {verif.toFixed(3)} m
          {verif >= 0.60 && verif <= 0.64 ? " ✅ Cumple (0.60 ≤ 2p+cp ≤ 0.64)" : " ⚠️ Fuera de rango (0.60–0.64)"}&nbsp;&nbsp;
          <b>Pendiente:</b> cp/p = {(geo.cp / geo.p).toFixed(2)} {geo.cp / geo.p <= 0.75 ? " ✅ ≤ 0.75" : " ⚠️"}&nbsp;&nbsp;
          <b>Ángulo:</b> {(theta * 180 / Math.PI).toFixed(1)}° {theta * 180 / Math.PI < 40 ? " ✅ < 40°" : " ⚠️"}
        </div>
      </CardContent>
    </Card>
  );
}
