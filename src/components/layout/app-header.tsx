import { createSignal, Show } from "solid-js";
import { Menu, Settings } from "lucide-solid";
import { useProject } from "@/lib/project-context";
import { getProjectSubtitle } from "@/lib/project-types";
import type { ProjectInfo } from "@/lib/project-types";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";

export function AppHeader(props: { onMenuToggle: () => void }) {
  const { activeProject, updateProject } = useProject();
  const [showSettings, setShowSettings] = createSignal(false);

  const title = () =>
    activeProject()
      ? `Metrados y Presupuesto — ${activeProject()!.floor}`
      : "Metrados y Presupuesto";

  const subtitle = () => (activeProject() ? getProjectSubtitle(activeProject()!) : "");

  return (
    <>
      <header class="sticky top-0 z-30 bg-white/70 backdrop-blur-lg border-b border-border/40">
        <div class="flex items-center gap-3 px-4 lg:px-6 py-3.5">
          {/* Mobile menu toggle */}
          <button
            onClick={props.onMenuToggle}
            class="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu size={20} class="text-text-mid" />
          </button>

          <div class="flex-1 min-w-0">
            <h1 class="text-sm font-semibold text-text tracking-tight truncate">
              {title()}
            </h1>
            <div class="text-[11px] text-text-soft truncate mt-0.5">
              {subtitle()}
            </div>
          </div>

          {/* Settings button */}
          <Show when={activeProject()}>
            <button
              onClick={() => setShowSettings(true)}
              class="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              aria-label="Configuración del proyecto"
            >
              <Settings size={18} class="text-text-soft" />
            </button>
          </Show>
        </div>
      </header>

      <Show when={activeProject() && showSettings()}>
        <ProjectSettingsDialog
          project={activeProject()!}
          onSave={(data) => {
            updateProject(activeProject()!.id, data);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      </Show>
    </>
  );
}

function ProjectSettingsDialog(props: {
  project: ProjectInfo;
  onSave: (data: Partial<ProjectInfo>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = createSignal({
    name: props.project.name,
    building: props.project.building,
    floor: props.project.floor,
    city: props.project.city,
    engineer: props.project.engineer,
    cip: props.project.cip,
    fc: props.project.fc,
    fy: props.project.fy,
    norm: props.project.norm,
  });

  return (
    <Dialog open onClose={props.onClose}>
      <DialogHeader>
        <h2 class="text-lg font-bold text-text">Configuración del Proyecto</h2>
        <p class="text-xs text-text-soft mt-1">Edita los datos del proyecto</p>
      </DialogHeader>
      <DialogBody>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <SettingsInput label="Nombre" value={form().name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <SettingsInput label="Edificio" value={form().building} onChange={(v) => setForm((f) => ({ ...f, building: v }))} />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <SettingsInput label="Piso" value={form().floor} onChange={(v) => setForm((f) => ({ ...f, floor: v }))} />
            <SettingsInput label="Ciudad" value={form().city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <SettingsInput label="Ingeniero" value={form().engineer} onChange={(v) => setForm((f) => ({ ...f, engineer: v }))} />
            <SettingsInput label="CIP" value={form().cip} onChange={(v) => setForm((f) => ({ ...f, cip: v }))} />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <SettingsInput label="f'c (kg/cm²)" value={String(form().fc)} onChange={(v) => setForm((f) => ({ ...f, fc: Number(v) || 0 }))} />
            <SettingsInput label="fy (kg/cm²)" value={String(form().fy)} onChange={(v) => setForm((f) => ({ ...f, fy: Number(v) || 0 }))} />
            <SettingsInput label="Norma" value={form().norm} onChange={(v) => setForm((f) => ({ ...f, norm: v }))} />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <button
          onClick={props.onClose}
          class="px-4 py-2 text-sm font-medium text-text-mid rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={() => props.onSave(form())}
          class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Guardar
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function SettingsInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label class="block">
      <span class="text-[11px] font-medium text-text-mid">{props.label}</span>
      <input
        type="text"
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </label>
  );
}
