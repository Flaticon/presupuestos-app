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

export function DimH(props: DimHProps) {
  const o = () => props.o ?? 10;
  const ly = () => props.y + o();
  return (
    <g>
      <line x1={props.x1} y1={ly()} x2={props.x2} y2={ly()} stroke="#546E7A" stroke-width={0.6} marker-start="url(#aS)" marker-end="url(#aE)" />
      <line x1={props.x1} y1={props.y} x2={props.x1} y2={ly()} stroke="#546E7A" stroke-width={0.3} stroke-dasharray="2,2" />
      <line x1={props.x2} y1={props.y} x2={props.x2} y2={ly()} stroke="#546E7A" stroke-width={0.3} stroke-dasharray="2,2" />
      <text x={(props.x1 + props.x2) / 2} y={ly() + 9} text-anchor="middle" font-size={8} fill="#37474F" font-family="monospace" font-weight="600">
        {props.label}
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

export function Dot(props: DotProps) {
  return <circle cx={props.cx} cy={props.cy} r={props.r ?? 3} fill={props.c} stroke="#333" stroke-width={0.6} />;
}
