import { ArrowDefs, DimH, Dot } from "./svg-helpers";

const CONCRETE = "#90A4AE";
const CONCRETE_S = "#546E7A";
const C12 = "#1B5E20";

export function SlabDiagram() {
  return (
    <svg width="100%" viewBox="0 0 440 110" style={{ maxWidth: 440 }} className="mb-2">
      <ArrowDefs />
      <rect x={20} y={10} width={380} height={16} fill={CONCRETE} stroke={CONCRETE_S} strokeWidth={0.8} />
      <text x={210} y={21} textAnchor="middle" fontSize={7} fill="#fff" fontWeight="600">LOSA e=0.05m</text>
      {[0, 1, 2, 3].map((i) => {
        const x = 20 + i * 95;
        return (
          <g key={i}>
            <rect x={x} y={26} width={16} height={50} fill={CONCRETE} stroke={CONCRETE_S} strokeWidth={0.6} />
            <rect x={x + 18} y={26} width={75} height={50} fill="#FFCC80" stroke="#F57C00" strokeWidth={0.6} rx={1} />
            <text x={x + 55} y={54} textAnchor="middle" fontSize={7} fill="#BF360C" fontWeight="600">LADRILLO</text>
            <Dot cx={x + 8} cy={70} r={2.5} c={C12} />
          </g>
        );
      })}
      <DimH x1={20} x2={36} y={80} label="0.10" o={4} />
      <DimH x1={38} x2={113} y={80} label="0.30" o={4} />
      <DimH x1={20} x2={115} y={93} label="MÓD=0.40m" o={4} />
      <text x={410} y={35} fontSize={7} fill="#4A5568" fontFamily="monospace">e=0.20m</text>
    </svg>
  );
}
