import { For } from "solid-js";
import { Dot } from "./svg-helpers";

const CONCRETE = "#90A4AE";
const CONCRETE_S = "#546E7A";
const C34 = "#1565C0";
const C58 = "#B71C1C";
const C38 = "#E65100";

const COLUMNS = [
  {
    label: "C1 — 30×50",
    b: 30,
    h: 50,
    bars: [
      { x: 8, y: 8 }, { x: 22, y: 8 }, { x: 8, y: 42 }, { x: 22, y: 42 },
      { x: 8, y: 25 }, { x: 22, y: 25 }, { x: 15, y: 8 }, { x: 15, y: 42 },
    ],
    c: C58,
  },
  {
    label: "C2 — 30×60",
    b: 30,
    h: 60,
    bars: [
      { x: 7, y: 7 }, { x: 23, y: 7 }, { x: 7, y: 28 }, { x: 23, y: 28 },
      { x: 7, y: 53 }, { x: 23, y: 53 }, { x: 15, y: 7 }, { x: 15, y: 53 },
      { x: 7, y: 18 }, { x: 23, y: 18 },
    ],
    c: C34,
  },
  {
    label: "P1 — 30×100",
    b: 30,
    h: 100,
    bars: [
      { x: 7, y: 7 }, { x: 23, y: 7 }, { x: 7, y: 33 }, { x: 23, y: 33 },
      { x: 7, y: 63 }, { x: 23, y: 63 }, { x: 7, y: 93 }, { x: 23, y: 93 },
      { x: 15, y: 7 }, { x: 15, y: 93 },
    ],
    c: C58,
  },
  { label: "C3 — Ø40", circ: true, c: C34, b: 0, h: 0, bars: [] },
];

const SPECIAL_COLUMNS = [
  {
    label: "CT1 — T",
    vb: "0 0 60 60",
    w: 60,
    h: 60,
    outline: "M5,5 L35,5 L35,15 L55,15 L55,45 L35,45 L35,55 L5,55 Z",
    inner: "M7,7 L33,7 L33,17 L53,17 L53,43 L33,43 L33,53 L7,53 Z",
    bars: [
      { x: 10, y: 10, c: C58 }, { x: 20, y: 10, c: C58 }, { x: 30, y: 10, c: C58 },
      { x: 10, y: 30, c: C58 },
      { x: 10, y: 50, c: C58 }, { x: 20, y: 50, c: C58 }, { x: 30, y: 50, c: C58 },
      { x: 42, y: 20, c: C34 }, { x: 50, y: 20, c: C34 },
      { x: 50, y: 30, c: C34 },
      { x: 50, y: 40, c: C34 }, { x: 42, y: 40, c: C34 },
    ],
  },
  {
    label: "CT2 — T",
    vb: "0 0 70 60",
    w: 70,
    h: 60,
    outline: "M5,5 L35,5 L35,15 L65,15 L65,45 L35,45 L35,55 L5,55 Z",
    inner: "M7,7 L33,7 L33,17 L63,17 L63,43 L33,43 L33,53 L7,53 Z",
    bars: [
      { x: 10, y: 10, c: C58 }, { x: 20, y: 10, c: C58 }, { x: 30, y: 10, c: C58 },
      { x: 10, y: 30, c: C58 },
      { x: 10, y: 50, c: C58 }, { x: 20, y: 50, c: C58 }, { x: 30, y: 50, c: C58 },
      { x: 30, y: 20, c: C58 }, { x: 30, y: 40, c: C58 },
      { x: 60, y: 20, c: C34 }, { x: 60, y: 30, c: C34 }, { x: 60, y: 40, c: C34 },
    ],
  },
  {
    label: "CT3 — L",
    vb: "0 0 70 55",
    w: 70,
    h: 55,
    outline: "M5,5 L35,5 L35,20 L65,20 L65,50 L5,50 Z",
    inner: "M7,7 L33,7 L33,22 L63,22 L63,48 L7,48 Z",
    bars: [
      { x: 10, y: 10, c: C58 }, { x: 20, y: 10, c: C58 }, { x: 30, y: 10, c: C58 },
      { x: 10, y: 30, c: C58 }, { x: 10, y: 45, c: C58 },
      { x: 20, y: 45, c: C58 }, { x: 30, y: 25, c: C58 }, { x: 30, y: 45, c: C58 },
      { x: 48, y: 25, c: C34 }, { x: 60, y: 25, c: C34 },
      { x: 48, y: 45, c: C34 }, { x: 60, y: 45, c: C34 },
    ],
  },
];

export function ColumnDiagrams() {
  return (
    <div class="flex flex-wrap gap-2.5 mb-3">
      <For each={COLUMNS}>
        {(d) => (
          <div class="bg-card rounded-xl border border-border p-2.5 text-center min-w-[80px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div class="text-[9px] font-bold text-primary mb-1">{d.label}</div>
            {d.circ ? (
              <svg viewBox="0 0 60 60" width={60} height={60}>
                <circle cx={30} cy={30} r={26} fill={CONCRETE} stroke={CONCRETE_S} stroke-width={1.2} />
                <circle cx={30} cy={6} r={3} fill={C34} stroke="#333" stroke-width={0.5} />
                <circle cx={54} cy={30} r={3} fill={C34} stroke="#333" stroke-width={0.5} />
                <circle cx={30} cy={54} r={3} fill={C34} stroke="#333" stroke-width={0.5} />
                <circle cx={6} cy={30} r={3} fill={C34} stroke="#333" stroke-width={0.5} />
                <circle cx={47} cy={13} r={3} fill={C34} stroke="#333" stroke-width={0.5} />
                <circle cx={13} cy={47} r={3} fill={C34} stroke="#333" stroke-width={0.5} />
                <rect x={6} y={6} width={48} height={48} rx={24} fill="none" stroke={C38} stroke-width={0.8} stroke-dasharray="3,2" />
              </svg>
            ) : (
              <svg viewBox={`0 0 ${d.b + 10} ${d.h + 10}`} width={d.b + 10} height={Math.min(d.h + 10, 80)}>
                <rect x={5} y={5} width={d.b} height={d.h} fill={CONCRETE} stroke={CONCRETE_S} stroke-width={1.2} />
                <rect x={7} y={7} width={d.b - 4} height={d.h - 4} fill="none" stroke={C38} stroke-width={0.8} stroke-dasharray="2,2" />
                <For each={d.bars}>
                  {(b) => <Dot cx={b.x + 5} cy={b.y + 5} r={2.5} c={d.c} />}
                </For>
              </svg>
            )}
          </div>
        )}
      </For>
      <For each={SPECIAL_COLUMNS}>
        {(d) => (
          <div class="bg-card rounded-xl border border-border p-2.5 text-center min-w-[80px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div class="text-[9px] font-bold text-primary mb-1">{d.label}</div>
            <svg viewBox={d.vb} width={d.w} height={d.h}>
              <path d={d.outline} fill={CONCRETE} stroke={CONCRETE_S} stroke-width={1.2} />
              <path d={d.inner} fill="none" stroke={C38} stroke-width={0.8} stroke-dasharray="2,2" />
              <For each={d.bars}>
                {(b) => <Dot cx={b.x} cy={b.y} r={2.5} c={b.c} />}
              </For>
            </svg>
          </div>
        )}
      </For>
    </div>
  );
}
