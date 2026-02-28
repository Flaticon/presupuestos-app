import { createSignal, createEffect, onMount, onCleanup, For, Show } from "solid-js";
import { useInsumos } from "@/lib/insumo-context";
import type { Insumo } from "@/data/insumos-data";
import type { BudgetItem } from "@/lib/types";
import { Search } from "lucide-solid";

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

export function InsumoPicker(props: InsumoPickerProps) {
  const { insumos } = useInsumos();
  const [query, setQuery] = createSignal("");
  let inputRef!: HTMLInputElement;
  let containerRef!: HTMLDivElement;

  onMount(() => {
    inputRef?.focus();
  });

  createEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        props.onCancel();
      }
    }
    document.addEventListener("mousedown", handleClick);
    onCleanup(() => document.removeEventListener("mousedown", handleClick));
  });

  const q = () => query().toLowerCase().trim();
  const filtered = () => {
    const search = q();
    return search
      ? insumos().filter((i) => i.nombre.toLowerCase().includes(search) || i.id.toLowerCase().includes(search))
      : insumos();
  };

  function selectInsumo(ins: Insumo) {
    props.onSelect({
      d: ins.nombre,
      u: ins.unidad,
      m: 0,
      cu: ins.precio,
      insumoId: ins.id,
    });
  }

  function addCustom() {
    props.onSelect({ d: query() || "Nuevo item", u: "Gbl.", m: 1, cu: 0 });
  }

  return (
    <div
      ref={containerRef!}
      class="absolute left-0 right-0 bottom-full mb-1 z-50 bg-card border border-border rounded-xl shadow-lg max-h-[320px] flex flex-col overflow-hidden"
    >
      {/* Search */}
      <div class="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search size={14} class="text-text-soft shrink-0" />
        <input
          ref={inputRef!}
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") props.onCancel();
            if (e.key === "Enter" && filtered().length > 0) selectInsumo(filtered()[0]);
          }}
          placeholder="Buscar insumo..."
          class="flex-1 text-xs bg-transparent outline-none placeholder:text-text-soft"
        />
      </div>

      {/* List */}
      <div class="overflow-y-auto flex-1">
        <For each={GROUP_ORDER}>
          {(grupo) => {
            const items = () => filtered().filter((i) => i.grupo === grupo);
            return (
              <Show when={items().length > 0}>
                <div>
                  <div class="px-3 py-1 text-[10px] font-semibold text-text-soft uppercase tracking-wider bg-muted/50 sticky top-0">
                    {GROUP_LABELS[grupo]}
                  </div>
                  <For each={items()}>
                    {(ins) => (
                      <button
                        onClick={() => selectInsumo(ins)}
                        class="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <span class="truncate">{ins.nombre}</span>
                        <span class="shrink-0 ml-2 text-text-soft text-[10px]">
                          {ins.unidad} · S/.{ins.precio.toFixed(2)}
                        </span>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            );
          }}
        </For>
        <Show when={filtered().length === 0}>
          <div class="px-3 py-3 text-xs text-text-soft text-center">
            Sin resultados
          </div>
        </Show>
      </div>

      {/* Custom item option */}
      <button
        onClick={addCustom}
        class="w-full px-3 py-2 text-xs text-text-mid font-medium border-t border-border hover:bg-muted transition-colors cursor-pointer text-left"
      >
        + Item personalizado {query() && <span class="text-text-soft">("{query()}")</span>}
      </button>
    </div>
  );
}
