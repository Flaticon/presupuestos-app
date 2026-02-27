import { useState, useRef } from "react";
import { useInsumos } from "@/lib/insumo-context";
import { BUDGET_INIT } from "@/data/budget-data";
import { flatGroups } from "@/lib/budget-helpers";
import type { Insumo } from "@/data/insumos-data";
import { fmtS } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// Pre-compute how many partidas reference each insumoId (from initial budget)
function buildPartidaCount(): Map<string, number> {
  const map = new Map<string, number>();
  for (const g of flatGroups(BUDGET_INIT)) {
    const seen = new Set<string>();
    for (const it of g.items) {
      if (it.insumoId && !seen.has(it.insumoId)) {
        seen.add(it.insumoId);
        map.set(it.insumoId, (map.get(it.insumoId) ?? 0) + 1);
      }
    }
  }
  return map;
}

const PARTIDA_COUNT = buildPartidaCount();

const GROUP_LABELS: Record<Insumo["grupo"], string> = {
  material: "Materiales",
  "mano-de-obra": "Mano de Obra",
  equipo: "Equipos",
};

const GROUP_ORDER: Insumo["grupo"][] = ["material", "mano-de-obra", "equipo"];

function InlineEdit({
  value,
  onChange,
  type = "text",
  className = "",
}: {
  value: string | number;
  onChange: (v: string | number) => void;
  type?: "text" | "number";
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (type === "number") {
      const n = parseFloat(draft);
      if (!isNaN(n) && n >= 0) onChange(n);
    } else {
      if (draft.trim()) onChange(draft.trim());
    }
  };

  if (!editing) {
    return (
      <button
        onClick={start}
        className={`w-full text-left px-1.5 py-0.5 rounded text-xs hover:bg-muted transition-colors cursor-pointer truncate ${className}`}
      >
        {type === "number" && typeof value === "number" ? value.toFixed(2) : value}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      autoFocus
      type={type === "number" ? "number" : "text"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-full px-1.5 py-0.5 rounded text-xs bg-white border border-primary outline-none"
      step={type === "number" ? "0.01" : undefined}
    />
  );
}

function GrupoSelect({
  value,
  onChange,
}: {
  value: Insumo["grupo"];
  onChange: (v: Insumo["grupo"]) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Insumo["grupo"])}
      className="w-full px-1 py-0.5 rounded text-[11px] bg-transparent border border-transparent hover:border-border focus:border-primary outline-none cursor-pointer"
    >
      <option value="material">Material</option>
      <option value="mano-de-obra">Mano de Obra</option>
      <option value="equipo">Equipo</option>
    </select>
  );
}

export function InsumosCatalogo() {
  const { insumos, addInsumo, updateInsumo, deleteInsumo } = useInsumos();

  const valorTotal = insumos.reduce((s, i) => s + i.precio, 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={insumos.length} label="TOTAL INSUMOS" color="#7C3AED" />
        <StatCard value={fmtS(valorTotal)} label="VALOR CATÁLOGO (SUMA P.U.)" color="#059669" />
      </div>

      {/* Info banner */}
      <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 text-xs text-text-mid">
        <b className="text-text">Catálogo de insumos:</b> Click en celda para editar nombre, unidad o precio. Los cambios de precio se propagan a todas las partidas del presupuesto.
      </div>

      {/* Grouped tables */}
      {GROUP_ORDER.map((grupo) => {
        const items = insumos.filter((i) => i.grupo === grupo);
        if (items.length === 0) return null;

        return (
          <div
            key={grupo}
            className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-[#1E293B] flex justify-between items-center">
              <span className="text-[13px] font-semibold text-white">
                {GROUP_LABELS[grupo]}
              </span>
              <span className="text-xs text-white/60">{items.length} insumos</span>
            </div>
            <div className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-7 bg-muted text-text-mid" />
                    <TableHead className="text-left bg-muted text-text-mid">Nombre</TableHead>
                    <TableHead className="w-[60px] bg-muted text-text-mid">Unidad</TableHead>
                    <TableHead className="w-[100px] bg-muted text-text-mid">Grupo</TableHead>
                    <TableHead className="w-[80px] text-right bg-muted text-text-mid">Precio</TableHead>
                    <TableHead className="w-[65px] text-center bg-muted text-text-mid">Partidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((ins, i) => {
                    const pCount = PARTIDA_COUNT.get(ins.id) ?? 0;
                    return (
                      <TableRow key={ins.id} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                        <TableCell className="text-center p-0.5">
                          <button
                            onClick={() => deleteInsumo(ins.id)}
                            className="text-danger font-bold text-sm hover:bg-danger/10 rounded px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </TableCell>
                        <TableCell className="p-0.5">
                          <InlineEdit
                            value={ins.nombre}
                            onChange={(v) => updateInsumo(ins.id, { nombre: v as string })}
                          />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <InlineEdit
                            value={ins.unidad}
                            onChange={(v) => updateInsumo(ins.id, { unidad: v as string })}
                            className="text-center text-text-soft"
                          />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <GrupoSelect
                            value={ins.grupo}
                            onChange={(v) => updateInsumo(ins.id, { grupo: v })}
                          />
                        </TableCell>
                        <TableCell className="p-0.5">
                          <InlineEdit
                            value={ins.precio}
                            onChange={(v) => updateInsumo(ins.id, { precio: v as number })}
                            type="number"
                            className="text-right font-semibold text-emerald-700 dark:text-emerald-400"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {pCount > 0 ? (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                              {pCount}
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-soft">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}

      {/* Add insumo button */}
      <button
        onClick={() =>
          addInsumo({ nombre: "Nuevo insumo", unidad: "Und.", precio: 0, grupo: "material" })
        }
        className="w-full py-3 bg-muted border-2 border-dashed border-border rounded-xl text-text-mid text-[12px] font-medium hover:bg-primary-bg transition-all duration-200 cursor-pointer"
      >
        + Agregar insumo
      </button>
    </div>
  );
}
