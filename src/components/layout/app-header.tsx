import { useState } from "react";
import { Menu, Settings } from "lucide-react";
import { useProject } from "@/lib/project-context";
import { getProjectSubtitle } from "@/lib/project-types";
import type { ProjectInfo } from "@/lib/project-types";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { activeProject, updateProject } = useProject();
  const [showSettings, setShowSettings] = useState(false);

  const title = activeProject
    ? `Metrados y Presupuesto — ${activeProject.floor}`
    : "Metrados y Presupuesto";

  const subtitle = activeProject ? getProjectSubtitle(activeProject) : "";

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center gap-3 px-4 lg:px-6 py-3.5">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu size={20} className="text-text-mid" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-text tracking-tight truncate">
              {title}
            </h1>
            <div className="text-[11px] text-text-soft truncate mt-0.5">
              {subtitle}
            </div>
          </div>

          {/* Settings button */}
          {activeProject && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
              aria-label="Configuración del proyecto"
            >
              <Settings size={18} className="text-text-soft" />
            </button>
          )}
        </div>
      </header>

      {activeProject && showSettings && (
        <ProjectSettingsDialog
          project={activeProject}
          onSave={(data) => {
            updateProject(activeProject.id, data);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

function ProjectSettingsDialog({
  project,
  onSave,
  onClose,
}: {
  project: ProjectInfo;
  onSave: (data: Partial<ProjectInfo>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: project.name,
    building: project.building,
    floor: project.floor,
    city: project.city,
    engineer: project.engineer,
    cip: project.cip,
    fc: project.fc,
    fy: project.fy,
    norm: project.norm,
  });

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader>
        <h2 className="text-lg font-bold text-text">Configuración del Proyecto</h2>
        <p className="text-xs text-text-soft mt-1">Edita los datos del proyecto</p>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <SettingsInput label="Nombre" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <SettingsInput label="Edificio" value={form.building} onChange={(v) => setForm((f) => ({ ...f, building: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SettingsInput label="Piso" value={form.floor} onChange={(v) => setForm((f) => ({ ...f, floor: v }))} />
            <SettingsInput label="Ciudad" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SettingsInput label="Ingeniero" value={form.engineer} onChange={(v) => setForm((f) => ({ ...f, engineer: v }))} />
            <SettingsInput label="CIP" value={form.cip} onChange={(v) => setForm((f) => ({ ...f, cip: v }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SettingsInput label="f'c (kg/cm²)" value={String(form.fc)} onChange={(v) => setForm((f) => ({ ...f, fc: Number(v) || 0 }))} />
            <SettingsInput label="fy (kg/cm²)" value={String(form.fy)} onChange={(v) => setForm((f) => ({ ...f, fy: Number(v) || 0 }))} />
            <SettingsInput label="Norma" value={form.norm} onChange={(v) => setForm((f) => ({ ...f, norm: v }))} />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-text-mid rounded-xl hover:bg-muted transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(form)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Guardar
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-mid">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/50 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </label>
  );
}
