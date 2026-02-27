import { useState } from "react";
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
} from "lucide-react";
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

interface AppSidebarProps {
  activeTab: SectionId;
  onTabChange: (id: SectionId) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { activeProject } = useProject();
  const { floors, toggleFloor, addFloor, removeFloor } = useFloors();
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newShort, setNewShort] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[2]);

  const subtitle = activeProject ? getProjectLabel(activeProject) : "";
  const engineerName = activeProject?.engineer ? `Ing. ${activeProject.engineer}` : "";
  const cipLabel = activeProject?.cip ? `CIP ${activeProject.cip}` : "";

  const handleAddFloor = () => {
    if (!newLabel.trim() || !newShort.trim()) return;
    addFloor(newLabel.trim(), newShort.trim(), newColor);
    setNewLabel("");
    setNewShort("");
    setNewColor(PRESET_COLORS[2]);
    setShowAddFloor(false);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0C1222] to-[#080E1A]">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#3B82F6] flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <div>
            <div className="text-[15px] font-bold text-white tracking-tight">METRADOS</div>
            <div className="text-[11px] text-white/35 font-medium">{subtitle}</div>
          </div>
        </div>
      </div>

      {/* Project Switcher */}
      <ProjectSwitcher />

      {/* Niveles */}
      <div className="px-3 mt-2">
        <div className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-2">
          Niveles
        </div>
        <div className="flex flex-wrap gap-1.5 px-3 mb-3">
          {floors.map((floor) => {
            const isDefault = floor.id === "3er-piso" || floor.id === "azotea";
            return (
              <div key={floor.id} className="relative group">
                <button
                  onClick={() => toggleFloor(floor.id)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer border",
                    floor.active
                      ? "text-white shadow-sm"
                      : "text-white/30 border-white/10 bg-white/[0.03]"
                  )}
                  style={
                    floor.active
                      ? { backgroundColor: `${floor.color}CC`, borderColor: floor.color }
                      : undefined
                  }
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full", floor.active ? "bg-white" : "bg-white/20")}
                  />
                  {floor.shortLabel}
                </button>
                {!isDefault && (
                  <button
                    onClick={() => removeFloor(floor.id)}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden group-hover:flex"
                  >
                    <X size={8} />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={() => setShowAddFloor(!showAddFloor)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all duration-200 cursor-pointer"
          >
            <Plus size={12} />
          </button>
        </div>

        {showAddFloor && (
          <div className="mx-3 mb-3 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 space-y-2">
            <input
              type="text"
              placeholder="Nombre (ej: 4to Piso)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-white/[0.08] border border-white/10 text-white text-[11px] placeholder:text-white/25 outline-none focus:border-white/30"
            />
            <input
              type="text"
              placeholder="Abrev. (ej: 4P)"
              value={newShort}
              onChange={(e) => setNewShort(e.target.value)}
              maxLength={4}
              className="w-full px-2 py-1.5 rounded-lg bg-white/[0.08] border border-white/10 text-white text-[11px] placeholder:text-white/25 outline-none focus:border-white/30"
            />
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={cn(
                    "w-5 h-5 rounded-full cursor-pointer transition-transform",
                    newColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#0C1222] scale-110" : ""
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleAddFloor}
                className="flex-1 py-1.5 rounded-lg bg-primary text-white text-[11px] font-medium cursor-pointer hover:bg-primary/90"
              >
                Agregar
              </button>
              <button
                onClick={() => setShowAddFloor(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white/50 text-[11px] cursor-pointer hover:bg-white/15"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-3">
          Secciones
        </div>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-5 border-t border-white/[0.06]">
        <div className="text-[11px] font-semibold text-white/40">Global Ingenieros E.I.R.L.</div>
        <div className="text-[10px] text-white/25 mt-0.5 leading-relaxed">
          {engineerName}
          {engineerName && cipLabel && <br />}
          {cipLabel}
        </div>
      </div>
    </div>
  );
}
