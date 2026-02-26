export function ArrowDefs() {
  return (
    <defs>
      <marker id="aE" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
        <path d="M0,0 L5,2.5 L0,5Z" fill="#546E7A" />
      </marker>
      <marker id="aS" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto">
        <path d="M5,0 L0,2.5 L5,5Z" fill="#546E7A" />
      </marker>
    </defs>
  );
}

interface DimHProps {
  x1: number;
  x2: number;
  y: number;
  label: string;
  o?: number;
}

export function DimH({ x1, x2, y, label, o = 10 }: DimHProps) {
  const ly = y + o;
  return (
    <g>
      <line x1={x1} y1={ly} x2={x2} y2={ly} stroke="#546E7A" strokeWidth={0.6} markerStart="url(#aS)" markerEnd="url(#aE)" />
      <line x1={x1} y1={y} x2={x1} y2={ly} stroke="#546E7A" strokeWidth={0.3} strokeDasharray="2,2" />
      <line x1={x2} y1={y} x2={x2} y2={ly} stroke="#546E7A" strokeWidth={0.3} strokeDasharray="2,2" />
      <text x={(x1 + x2) / 2} y={ly + 9} textAnchor="middle" fontSize={8} fill="#37474F" fontFamily="monospace" fontWeight="600">
        {label}
      </text>
    </g>
  );
}

interface DotProps {
  cx: number;
  cy: number;
  r?: number;
  c: string;
}

export function Dot({ cx, cy, r = 3, c }: DotProps) {
  return <circle cx={cx} cy={cy} r={r} fill={c} stroke="#333" strokeWidth={0.6} />;
}
