import { createSignal, Show } from "solid-js";
import type { BudgetSection } from "@/lib/types";
import type { Nivel } from "@/lib/types";
import type { ProjectInfo } from "@/lib/project-types";
import type { Insumo } from "@/data/insumos-data";
import { Download, FileSpreadsheet, FileText, Package, ClipboardList, Loader2 } from "lucide-solid";

const btnBase = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-mid shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-muted transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

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
  const [exporting, setExporting] = createSignal<string | null>(null);
  const [exportError, setExportError] = createSignal<string | null>(null);

  const safeExport = async (label: string, fn: () => Promise<void>) => {
    if (!props.activeProject || exporting()) return;
    setExporting(label);
    setExportError(null);
    try {
      await fn();
    } catch (e) {
      console.warn("[metrados] export: error al exportar", label, e);
      setExportError(`Error al exportar ${label}. Intenta de nuevo.`);
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCSV = () => safeExport("CSV", async () => {
    const { exportBudgetCSV } = await import("@/lib/export-budget");
    exportBudgetCSV(props.budget, props.activeProject!);
  });

  const handleExportXLS = () => safeExport("Excel", async () => {
    const { exportBudgetXLS } = await import("@/lib/export-budget");
    exportBudgetXLS(props.budget, props.activeProject!);
  });

  const handleExportPDF = () => safeExport("PDF", async () => {
    const { exportBudgetPDF } = await import("@/lib/export-budget");
    exportBudgetPDF(props.budget, props.activeProject!);
  });

  const handleExportInsumosPDF = () => safeExport("Insumos PDF", async () => {
    const { exportInsumosPDF } = await import("@/lib/export-budget");
    exportInsumosPDF(props.budget, props.insumos, props.floors, props.activeProject!);
  });

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

      <div class="flex gap-2 items-center">
        <button onClick={() => props.goTo("insumos")} class={btnBase}>
          <Package class="h-3.5 w-3.5" />
          Insumos
        </button>
        <button onClick={handleExportCSV} disabled={!!exporting()} class={btnBase}>
          <Show when={exporting() === "CSV"} fallback={<Download class="h-3.5 w-3.5" />}>
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
          </Show>
          CSV
        </button>
        <button onClick={handleExportXLS} disabled={!!exporting()} class={btnBase}>
          <Show when={exporting() === "Excel"} fallback={<FileSpreadsheet class="h-3.5 w-3.5" />}>
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
          </Show>
          Excel
        </button>
        <button onClick={handleExportPDF} disabled={!!exporting()} class={btnBase}>
          <Show when={exporting() === "PDF"} fallback={<FileText class="h-3.5 w-3.5" />}>
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
          </Show>
          PDF
        </button>
        <button onClick={handleExportInsumosPDF} disabled={!!exporting()} class={btnBase}>
          <Show when={exporting() === "Insumos PDF"} fallback={<ClipboardList class="h-3.5 w-3.5" />}>
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
          </Show>
          Insumos PDF
        </button>
        <Show when={exportError()}>
          {(msg) => <span class="text-[11px] text-red-500 ml-1">{msg()}</span>}
        </Show>
      </div>
    </div>
  );
}
