import { createSignal, For, Show } from "solid-js";
import {
  BarChart3,
  Columns3,
  RectangleHorizontal,
  LayoutGrid,
  BrickWall,
  TrendingUp,
  Package,
  Wallet,
  Plus,
  X,
} from "lucide-solid";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/project-context";
import { useFloors } from "@/lib/floor-context";
import { getProjectLabel } from "@/lib/project-types";
import { ProjectSwitcher } from "./project-switcher";
import type { SectionId } from "@/data/constants";

const NAV_ITEMS: { id: SectionId; label: string; icon: typeof BarChart3 }[] = [
  { id: "resumen", label: "Resumen", icon: BarChart3 },
  { id: "columnas", label: "Columnas", icon: Columns3 },
  { id: "vigas", label: "Vigas", icon: RectangleHorizontal },
  { id: "losa", label: "Losa", icon: LayoutGrid },
  { id: "muros", label: "Muros", icon: BrickWall },
  { id: "escalera", label: "Escalera", icon: TrendingUp },
  { id: "insumos", label: "Insumos", icon: Package },
  { id: "presupuesto", label: "Presupuesto", icon: Wallet },
];

const PRESET_COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];

export function AppSidebar(props: {
  activeTab: SectionId;
  onTabChange: (id: SectionId) => void;
}) {
  const { activeProject } = useProject();
  const { floors, toggleFloor, addFloor, removeFloor } = useFloors();
  const [showAddFloor, setShowAddFloor] = createSignal(false);
  const [newLabel, setNewLabel] = createSignal("");
  const [newShort, setNewShort] = createSignal("");
  const [newColor, setNewColor] = createSignal(PRESET_COLORS[2]);

  const subtitle = () => (activeProject() ? getProjectLabel(activeProject()!) : "");
  const engineerName = () => (activeProject()?.engineer ? `Ing. ${activeProject()!.engineer}` : "");
  const cipLabel = () => (activeProject()?.cip ? `CIP ${activeProject()!.cip}` : "");

  const handleAddFloor = () => {
    if (!newLabel().trim() || !newShort().trim()) return;
    addFloor(newLabel().trim(), newShort().trim(), newColor());
    setNewLabel("");
    setNewShort("");
    setNewColor(PRESET_COLORS[2]);
    setShowAddFloor(false);
  };

  return (
    <div class="flex flex-col h-full bg-[#09090B]">
      {/* Logo */}
      <div class="px-5 py-6">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span class="text-white font-black text-sm">M</span>
          </div>
          <div>
            <div class="text-[15px] font-bold text-white tracking-tight">METRADOS</div>
            <div class="text-[11px] text-white/35 font-medium">{subtitle()}</div>
          </div>
        </div>
      </div>

      {/* Project Switcher */}
      <ProjectSwitcher />

      {/* Niveles */}
      <div class="px-3 mt-2">
        <div class="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-2">
          Niveles
        </div>
        <div class="flex flex-wrap gap-1.5 px-3 mb-3">
          <For each={floors()}>
            {(floor) => {
              const isDefault = floor.id === "3er-piso" || floor.id === "azotea";
              return (
                <div class="relative group">
                  <button
                    onClick={() => toggleFloor(floor.id)}
                    class={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 cursor-pointer border",
                      floor.active
                        ? "text-white shadow-sm"
                        : "text-white/30 border-white/10 bg-white/[0.03]"
                    )}
                    style={
                      floor.active
                        ? { "background-color": `${floor.color}CC`, "border-color": floor.color }
                        : undefined
                    }
                  >
                    <span
                      class={cn("w-1.5 h-1.5 rounded-full", floor.active ? "bg-white" : "bg-white/20")}
                    />
                    {floor.shortLabel}
                  </button>
                  <Show when={!isDefault}>
                    <button
                      onClick={() => removeFloor(floor.id)}
                      class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden group-hover:flex"
                    >
                      <X size={8} />
                    </button>
                  </Show>
                </div>
              );
            }}
          </For>
          <button
            onClick={() => setShowAddFloor(!showAddFloor())}
            class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all duration-200 cursor-pointer"
          >
            <Plus size={12} />
          </button>
        </div>

        <Show when={showAddFloor()}>
          <div class="mx-3 mb-3 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 space-y-2">
            <input
              type="text"
              placeholder="Nombre (ej: 4to Piso)"
              value={newLabel()}
              onInput={(e) => setNewLabel(e.currentTarget.value)}
              class="w-full px-2 py-1.5 rounded-lg bg-white/[0.08] border border-white/10 text-white text-[11px] placeholder:text-white/25 outline-none focus:border-white/30"
            />
            <input
              type="text"
              placeholder="Abrev. (ej: 4P)"
              value={newShort()}
              onInput={(e) => setNewShort(e.currentTarget.value)}
              maxLength={4}
              class="w-full px-2 py-1.5 rounded-lg bg-white/[0.08] border border-white/10 text-white text-[11px] placeholder:text-white/25 outline-none focus:border-white/30"
            />
            <div class="flex gap-1.5">
              <For each={PRESET_COLORS}>
                {(c) => (
                  <button
                    onClick={() => setNewColor(c)}
                    class={cn(
                      "w-5 h-5 rounded-full cursor-pointer transition-transform",
                      newColor() === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#09090B] scale-110" : ""
                    )}
                    style={{ "background-color": c }}
                  />
                )}
              </For>
            </div>
            <div class="flex gap-1.5">
              <button
                onClick={handleAddFloor}
                class="flex-1 py-1.5 rounded-lg bg-primary text-white text-[11px] font-medium cursor-pointer hover:bg-primary/90"
              >
                Agregar
              </button>
              <button
                onClick={() => setShowAddFloor(false)}
                class="px-3 py-1.5 rounded-lg bg-white/10 text-white/50 text-[11px] cursor-pointer hover:bg-white/15"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* Navigation */}
      <nav class="flex-1 px-3">
        <div class="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-3">
          Secciones
        </div>
        <div class="space-y-1">
          <For each={NAV_ITEMS}>
            {(item) => {
              const Icon = item.icon;
              const isActive = () => props.activeTab === item.id;
              return (
                <button
                  onClick={() => props.onTabChange(item.id)}
                  class={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer",
                    isActive()
                      ? "bg-primary/12 text-primary font-semibold"
                      : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                  )}
                >
                  <Icon size={18} stroke-width={isActive() ? 2 : 1.6} />
                  <span>{item.label}</span>
                </button>
              );
            }}
          </For>
        </div>
      </nav>

      {/* Footer */}
      <div class="px-5 py-5 border-t border-white/[0.04]">
        <div class="text-[11px] font-semibold text-white/40">Global Ingenieros E.I.R.L.</div>
        <div class="text-[10px] text-white/25 mt-0.5 leading-relaxed">
          {engineerName()}
          <Show when={engineerName() && cipLabel()}>
            <br />
          </Show>
          {cipLabel()}
        </div>
      </div>
    </div>
  );
}
