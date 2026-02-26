import { useState, useCallback } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { LandingScreen } from "./landing-screen";
import { Sheet } from "@/components/ui/sheet";
import { Overview } from "@/components/sections/overview";
import { Columnas } from "@/components/sections/columnas";
import { Vigas } from "@/components/sections/vigas";
import { Losa } from "@/components/sections/losa";
import { Escalera } from "@/components/sections/escalera";
import { Presupuesto } from "@/components/sections/presupuesto";
import { ProjectProvider, useProject } from "@/lib/project-context";
import type { SectionId } from "@/data/constants";

function Dashboard() {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = useState<SectionId>("resumen");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const goTo = useCallback((id: string) => {
    setActiveTab(id as SectionId);
  }, []);

  const handleTabChange = useCallback((id: SectionId) => {
    setActiveTab(id);
    setSidebarOpen(false);
  }, []);

  if (!activeProject) return <LandingScreen />;

  const engineerLine = activeProject.engineer
    ? `Ing. ${activeProject.engineer}${activeProject.cip ? ` CIP ${activeProject.cip}` : ""}`
    : "";

  return (
    <div className="min-h-screen bg-surface font-sans text-text">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 z-40">
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </Sheet>

      {/* Main content */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <AppHeader onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <div className="max-w-5xl mx-auto">
            {activeTab === "resumen" && <Overview />}
            {activeTab === "columnas" && <Columnas />}
            {activeTab === "vigas" && <Vigas />}
            {activeTab === "losa" && <Losa />}
            {activeTab === "escalera" && <Escalera />}
            {activeTab === "presupuesto" && <Presupuesto goTo={goTo} />}
          </div>
        </main>

        <footer className="text-center py-4 px-4 text-[11px] text-text-soft border-t border-border/60 bg-white/50">
          <span className="font-medium text-text-mid">Global Ingenieros E.I.R.L.</span>
          {engineerLine && <> · {engineerLine}</>}
        </footer>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <ProjectProvider>
      <Dashboard />
    </ProjectProvider>
  );
}
