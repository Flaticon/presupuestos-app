import { ArrowDefs, DimH } from "./svg-helpers";

const CONCRETE = "#90A4AE";
const CONCRETE_S = "#546E7A";
const C34 = "#1565C0";
const C12 = "#1B5E20";
const C38 = "#E65100";

interface StaircaseDynamicProps {
  nPasos: number;
  cp: number;
  p: number;
  ancho: number;
  descL: number;
  garganta: number;
}

export function StaircaseDynamic({ nPasos, cp, p, descL, garganta }: StaircaseDynamicProps) {
  const pasosTramo = Math.max(1, Math.floor(nPasos / 2));
  const lHoriz = pasosTramo * p;
  const hTramo = pasosTramo * cp;
  const theta = Math.atan(hTramo / lHoriz);
  const cosT = Math.cos(theta);
  const lIncl = Math.sqrt(lHoriz ** 2 + hTramo ** 2);

  const W = 520, H = 250;
  const mL = 20, mB = 55, mT = 20;

  // Scale: stair uses ~45% of width; rest for legend/info
  const sc = Math.max(15, Math.min(120,
    Math.min(
      (W * 0.45) / (lHoriz + descL),
      (H - mB - mT) / (hTramo + garganta / cosT),
    )
  ));

  const descPx = descL * sc;
  const trampH = hTramo * sc;
  const trampW = lHoriz * sc;
  const stepW = trampW / pasosTramo;
  const stepH = trampH / pasosTramo;
  const thickV = Math.max(6, (garganta / cosT) * sc); // vertical projection of garganta
  const descThick = Math.max(6, garganta * sc);        // descanso is horizontal

  // Origin points
  const x0 = mL;
  const y0 = H - mB;
  const tx0 = x0 + descPx;
  const ty0 = y0;
  const tx1 = tx0 + trampW;
  const ty1 = ty0 - trampH;

  // --- Filled concrete profile: soffit + stepped top ---
  let d = `M ${tx0},${ty0 + thickV}`;            // bottom-left of inclined slab
  d += ` L ${tx1},${ty1 + thickV}`;              // bottom-right of inclined slab
  d += ` L ${tx1},${ty1}`;                       // up to top of last step
  for (let i = pasosTramo - 1; i >= 0; i--) {
    const lx = tx0 + i * stepW;
    const treadY = ty0 - (i + 1) * stepH;
    d += ` L ${lx},${treadY}`;                   // left along tread
    d += ` L ${lx},${ty0 - i * stepH}`;          // down the riser
  }
  d += ` Z`;

  // Step grid lines (visual separation)
  const steps = Array.from({ length: pasosTramo }, (_, i) => ({
    sx0: tx0 + i * stepW,
    sy0: ty0 - i * stepH,
    sx1: tx0 + (i + 1) * stepW,
    sy1: ty0 - (i + 1) * stepH,
  }));

  // Distribution bars Ø3/8" (every 2 steps)
  const distBars = steps
    .filter((_, i) => i % 2 === 0)
    .map((s) => ({
      x: (s.sx0 + s.sx1) / 2,
      yb: (s.sy0 + s.sy1) / 2 + thickV * 0.6,
      yt: (s.sy0 + s.sy1) / 2 - stepH * 0.3,
    }));

  const rightEdge = tx1 + 55;

  return (
    <div className="bg-muted rounded-lg border border-border p-2 mb-3">
      <div className="text-xs font-bold text-primary mb-1">
        Escalera Tipo U — Vista lateral (escala proporcional)
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: W }}>
        <ArrowDefs />

        {/* Descanso (landing) */}
        <rect x={x0} y={y0} width={descPx} height={descThick} rx={1}
          fill={CONCRETE} stroke={CONCRETE_S} strokeWidth={1} />
        {descPx > 30 && (
          <text x={x0 + descPx / 2} y={y0 + descThick / 2 + 3}
            textAnchor="middle" fontSize={7} fill="#fff" fontWeight="600">DESCANSO</text>
        )}

        {/* Inclined slab + filled steps */}
        <path d={d} fill={CONCRETE} stroke="none" />
        <path d={d} fill="none" stroke={CONCRETE_S} strokeWidth={1.2} strokeLinejoin="miter" />

        {/* Step grid lines */}
        {steps.map((s, i) => (
          <g key={i}>
            <line x1={s.sx0} y1={s.sy0} x2={s.sx1} y2={s.sy0}
              stroke={CONCRETE_S} strokeWidth={0.5} />
            <line x1={s.sx1} y1={s.sy0} x2={s.sx1} y2={s.sy1}
              stroke={CONCRETE_S} strokeWidth={0.5} />
          </g>
        ))}

        {/* Losa apoyo superior */}
        <rect x={tx1} y={ty1 - 8} width={50} height={descThick} rx={1}
          fill={CONCRETE} stroke={CONCRETE_S} strokeWidth={1} />
        <text x={tx1 + 25} y={ty1 - 8 + descThick / 2 + 3}
          textAnchor="middle" fontSize={7} fill="#fff" fontWeight="600">LOSA 3P</text>

        {/* Acero Ø3/4" principal inferior — runs along soffit */}
        <line x1={x0 + 4} y1={y0 + descThick - 3}
          x2={tx1 + 4} y2={ty1 + thickV - 3}
          stroke={C34} strokeWidth={2.2} />

        {/* Acero Ø1/2" bastones negativos en apoyos (follow slope) */}
        <line x1={tx0} y1={ty0 - 4}
          x2={tx0 + trampW * 0.3} y2={ty0 - trampH * 0.3 - 4}
          stroke={C12} strokeWidth={1.5} />
        <line x1={tx1 - trampW * 0.3} y1={ty1 + trampH * 0.3 - 4}
          x2={tx1} y2={ty1 - 4}
          stroke={C12} strokeWidth={1.5} />
        <line x1={x0 + descPx * 0.3} y1={y0 - 4}
          x2={x0 + descPx} y2={y0 - 4}
          stroke={C12} strokeWidth={1.5} />

        {/* Distribución Ø3/8" transversal */}
        {distBars.map((b, i) => (
          <line key={i} x1={b.x} y1={b.yb} x2={b.x} y2={b.yt}
            stroke={C38} strokeWidth={1} />
        ))}

        {/* Dimensiones */}
        <DimH x1={x0} x2={x0 + descPx} y={y0 + descThick + 2}
          label={`${descL}m`} o={8} />
        <DimH x1={tx0} x2={tx1} y={y0 + descThick + 2}
          label={`${lHoriz.toFixed(2)}m`} o={8} />

        {/* Ángulo */}
        <text x={tx0 + 8} y={ty0 - trampH / 2}
          fontSize={8} fill="#37474F" fontFamily="monospace" fontWeight="600">
          θ={(theta * 180 / Math.PI).toFixed(1)}°
        </text>

        {/* Leyenda */}
        <g transform={`translate(${rightEdge}, ${mT})`}>
          <line x1={0} y1={0} x2={22} y2={0} stroke={C34} strokeWidth={2} />
          <text x={26} y={4} fontSize={8} fill={C34} fontFamily="monospace">Ø3/4" inf.</text>
          <line x1={0} y1={13} x2={22} y2={13} stroke={C12} strokeWidth={1.5} />
          <text x={26} y={17} fontSize={8} fill={C12} fontFamily="monospace">Ø1/2" sup.</text>
          <line x1={0} y1={26} x2={22} y2={26} stroke={C38} strokeWidth={1} />
          <text x={26} y={30} fontSize={8} fill={C38} fontFamily="monospace">Ø3/8" dist.</text>
        </g>

        {/* Info box */}
        <rect x={rightEdge} y={mT + 40} width={105} height={55} rx={4}
          fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
        <text x={rightEdge + 3} y={mT + 52} fontSize={8} fill="#1A202C" fontFamily="monospace">
          L incl.: {lIncl.toFixed(2)}m</text>
        <text x={rightEdge + 3} y={mT + 63} fontSize={8} fill="#1A202C" fontFamily="monospace">
          h tramo: {hTramo.toFixed(3)}m</text>
        <text x={rightEdge + 3} y={mT + 74} fontSize={8} fill="#1A202C" fontFamily="monospace">
          garganta: {garganta}m</text>
        <text x={rightEdge + 3} y={mT + 85} fontSize={8} fill="#1A202C" fontFamily="monospace">
          {pasosTramo} pasos × tramo</text>
      </svg>
    </div>
  );
}
