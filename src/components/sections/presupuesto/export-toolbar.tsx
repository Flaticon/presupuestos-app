import type { BudgetSection } from "@/lib/types";
import type { Nivel } from "@/lib/types";
import type { ProjectInfo } from "@/lib/project-types";
import type { Insumo } from "@/data/insumos-data";
import { Download, FileSpreadsheet, FileText, Package, ClipboardList } from "lucide-solid";

const btnBase = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-mid shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-muted transition-all duration-200 cursor-pointer";

interface ExportToolbarProps {
  view: "detalle" | "resumen";
  setView: (v: "detalle" | "resumen") => void;
  budget: BudgetSection[];
  activeProject: ProjectInfo | null;
  insumos: Insumo[];
  floors: Nivel[];
  goTo: (id: string) => void;
}

export function ExportToolbar(props: ExportToolbarProps) {
  const handleExportCSV = async () => {
    if (!props.activeProject) return;
    const { exportBudgetCSV } = await import("@/lib/export-budget");
    exportBudgetCSV(props.budget, props.activeProject);
  };

  const handleExportXLS = async () => {
    if (!props.activeProject) return;
    const { exportBudgetXLS } = await import("@/lib/export-budget");
    exportBudgetXLS(props.budget, props.activeProject);
  };

  const handleExportPDF = async () => {
    if (!props.activeProject) return;
    const { exportBudgetPDF } = await import("@/lib/export-budget");
    exportBudgetPDF(props.budget, props.activeProject);
  };

  const handleExportInsumosPDF = async () => {
    if (!props.activeProject) return;
    const { exportInsumosPDF } = await import("@/lib/export-budget");
    exportInsumosPDF(props.budget, props.insumos, props.floors, props.activeProject);
  };

  return (
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <div class="inline-flex rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => props.setView("detalle")}
          class={`px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
            props.view === "detalle"
              ? "bg-[#18181B] text-white"
              : "bg-card text-text-mid hover:bg-muted"
          }`}
        >
          Detalle
        </button>
        <button
          onClick={() => props.setView("resumen")}
          class={`px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
            props.view === "resumen"
              ? "bg-[#18181B] text-white"
              : "bg-card text-text-mid hover:bg-muted"
          }`}
        >
          Resumen S10
        </button>
      </div>

      <div class="flex gap-2">
        <button onClick={() => props.goTo("insumos")} class={btnBase}>
          <Package class="h-3.5 w-3.5" />
          Insumos
        </button>
        <button onClick={handleExportCSV} class={btnBase}>
          <Download class="h-3.5 w-3.5" />
          CSV
        </button>
        <button onClick={handleExportXLS} class={btnBase}>
          <FileSpreadsheet class="h-3.5 w-3.5" />
          Excel
        </button>
        <button onClick={handleExportPDF} class={btnBase}>
          <FileText class="h-3.5 w-3.5" />
          PDF
        </button>
        <button onClick={handleExportInsumosPDF} class={btnBase}>
          <ClipboardList class="h-3.5 w-3.5" />
          Insumos PDF
        </button>
      </div>
    </div>
  );
}
