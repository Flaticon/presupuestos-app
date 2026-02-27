import { useState, useRef, useEffect } from "react";
import { useInsumos } from "@/lib/insumo-context";
import type { Insumo } from "@/data/insumos-data";
import type { BudgetItem } from "@/lib/types";
import { Search } from "lucide-react";

const GROUP_LABELS: Record<Insumo["grupo"], string> = {
  material: "Materiales",
  "mano-de-obra": "Mano de Obra",
  equipo: "Equipos",
};
const GROUP_ORDER: Insumo["grupo"][] = ["material", "mano-de-obra", "equipo"];

interface InsumoPickerProps {
  onSelect: (item: BudgetItem) => void;
  onCancel: () => void;
}

export function InsumoPicker({ onSelect, onCancel }: InsumoPickerProps) {
  const { insumos } = useInsumos();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onCancel]);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? insumos.filter((i) => i.nombre.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
    : insumos;

  const selectInsumo = (ins: Insumo) => {
    onSelect({
      d: ins.nombre,
      u: ins.unidad,
      m: 0,
      cu: ins.precio,
      insumoId: ins.id,
    });
  };

  const addCustom = () => {
    onSelect({ d: query || "Nuevo item", u: "Gbl.", m: 1, cu: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-card border border-border rounded-xl shadow-lg max-h-[320px] flex flex-col overflow-hidden"
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search size={14} className="text-text-soft shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter" && filtered.length > 0) selectInsumo(filtered[0]);
          }}
          placeholder="Buscar insumo..."
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-text-soft"
        />
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {GROUP_ORDER.map((grupo) => {
          const items = filtered.filter((i) => i.grupo === grupo);
          if (items.length === 0) return null;
          return (
            <div key={grupo}>
              <div className="px-3 py-1 text-[10px] font-semibold text-text-soft uppercase tracking-wider bg-muted/50 sticky top-0">
                {GROUP_LABELS[grupo]}
              </div>
              {items.map((ins) => (
                <button
                  key={ins.id}
                  onClick={() => selectInsumo(ins)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <span className="truncate">{ins.nombre}</span>
                  <span className="shrink-0 ml-2 text-text-soft text-[10px]">
                    {ins.unidad} · S/.{ins.precio.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-3 text-xs text-text-soft text-center">
            Sin resultados
          </div>
        )}
      </div>

      {/* Custom item option */}
      <button
        onClick={addCustom}
        className="w-full px-3 py-2 text-xs text-text-mid font-medium border-t border-border hover:bg-muted transition-colors cursor-pointer text-left"
      >
        + Item personalizado {query && <span className="text-text-soft">("{query}")</span>}
      </button>
    </div>
  );
}
