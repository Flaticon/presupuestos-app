import { createSignal, Show, Switch, Match } from "solid-js";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { LandingScreen } from "./landing-screen";
import { Sheet } from "@/components/ui/sheet";
import { Overview } from "@/components/sections/overview";
import { Columnas } from "@/components/sections/columnas";
import { Vigas } from "@/components/sections/vigas";
import { Losa } from "@/components/sections/losa";
import { Muros } from "@/components/sections/muros";
import { Escalera } from "@/components/sections/escalera";
import { Presupuesto } from "@/components/sections/presupuesto";
import { InsumosCatalogo } from "@/components/sections/insumos-catalogo";
import { ProjectProvider, useProject } from "@/lib/project-context";
import { FloorProvider } from "@/lib/floor-context";
import { SectionDataProvider } from "@/lib/section-data-context";
import { InsumoProvider } from "@/lib/insumo-context";
import type { SectionId } from "@/data/constants";

function Dashboard() {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = createSignal<SectionId>("resumen");
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  const goTo = (id: string) => {
    const valid: readonly string[] = ["resumen", "columnas", "vigas", "losa", "muros", "escalera", "insumos", "presupuesto"];
    if (valid.includes(id)) {
      setActiveTab(id as SectionId);
    }
  };

  const handleTabChange = (id: SectionId) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const engineerLine = () => {
    const proj = activeProject();
    if (!proj) return "";
    return proj.engineer
      ? `Ing. ${proj.engineer}${proj.cip ? ` CIP ${proj.cip}` : ""}`
      : "";
  };

  return (
    <Show when={activeProject()} fallback={<LandingScreen />}>
      <div class="min-h-screen bg-surface font-sans text-text">
        {/* Desktop sidebar */}
        <aside class="hidden lg:block fixed inset-y-0 left-0 w-60 z-40">
          <AppSidebar activeTab={activeTab()} onTabChange={handleTabChange} />
        </aside>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={sidebarOpen()} onClose={() => setSidebarOpen(false)}>
          <AppSidebar activeTab={activeTab()} onTabChange={handleTabChange} />
        </Sheet>

        {/* Main content */}
        <div class="lg:ml-60 flex flex-col min-h-screen">
          <AppHeader onMenuToggle={() => setSidebarOpen(true)} />

          <main class="flex-1 p-4 sm:p-5 lg:p-8">
            <div class="max-w-7xl mx-auto">
              <Switch>
                <Match when={activeTab() === "resumen"}><Overview /></Match>
                <Match when={activeTab() === "columnas"}><Columnas /></Match>
                <Match when={activeTab() === "vigas"}><Vigas /></Match>
                <Match when={activeTab() === "losa"}><Losa /></Match>
                <Match when={activeTab() === "muros"}><Muros /></Match>
                <Match when={activeTab() === "escalera"}><Escalera /></Match>
                <Match when={activeTab() === "insumos"}><InsumosCatalogo /></Match>
                <Match when={activeTab() === "presupuesto"}><Presupuesto goTo={goTo} /></Match>
              </Switch>
            </div>
          </main>

          <footer class="text-center py-4 px-4 text-[11px] text-text-soft border-t border-border/30 bg-transparent">
            <span class="font-medium text-text-mid">Global Ingenieros E.I.R.L.</span>
            <Show when={engineerLine()}>
              {(line) => <> · {line()}</>}
            </Show>
          </footer>
        </div>
      </div>
    </Show>
  );
}

export function AppLayout() {
  return (
    <ProjectProvider>
      <FloorProvider>
        <SectionDataProvider>
          <InsumoProvider>
            <Dashboard />
          </InsumoProvider>
        </SectionDataProvider>
      </FloorProvider>
    </ProjectProvider>
  );
}
