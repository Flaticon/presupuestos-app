import {
  BarChart3,
  Columns3,
  RectangleHorizontal,
  LayoutGrid,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/project-context";
import { getProjectLabel } from "@/lib/project-types";
import { ProjectSwitcher } from "./project-switcher";
import type { SectionId } from "@/data/constants";

const NAV_ITEMS: { id: SectionId; label: string; icon: typeof BarChart3 }[] = [
  { id: "resumen", label: "Resumen", icon: BarChart3 },
  { id: "columnas", label: "Columnas", icon: Columns3 },
  { id: "vigas", label: "Vigas", icon: RectangleHorizontal },
  { id: "losa", label: "Losa", icon: LayoutGrid },
  { id: "escalera", label: "Escalera", icon: TrendingUp },
  { id: "presupuesto", label: "Presupuesto", icon: Wallet },
];

interface AppSidebarProps {
  activeTab: SectionId;
  onTabChange: (id: SectionId) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { activeProject } = useProject();

  const subtitle = activeProject ? getProjectLabel(activeProject) : "";
  const engineerName = activeProject?.engineer ? `Ing. ${activeProject.engineer}` : "";
  const cipLabel = activeProject?.cip ? `CIP ${activeProject.cip}` : "";

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

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
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
